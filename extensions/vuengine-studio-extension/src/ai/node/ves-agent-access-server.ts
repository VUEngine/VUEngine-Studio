import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { CallToolRequestSchema, isInitializeRequest, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { RpcProxy } from '@theia/core';
import { ApplicationServer } from '@theia/core/lib/common/application-protocol';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { FileUri } from '@theia/core/lib/common/file-uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { promises as fs } from 'fs';
import http from 'http';
import path from 'path';
import { VUENGINE_AGENT_GUIDE } from '../common/ves-agent-guide';
import {
  VesAgentAccess, VesAgentAccessClient, VesAgentAccessConfig, VesAgentAccessStatus,
} from '../common/ves-agent-access-protocol';

const MAX_BODY = 1024 * 1024;

@injectable()
export class VesAgentAccessServer {
  @inject(EnvVariablesServer)
  protected readonly envVariablesServer!: EnvVariablesServer;
  @inject(ApplicationServer)
  protected readonly applicationServer!: ApplicationServer;

  protected readonly clients: VesAgentAccessClient[] = [];
  protected readonly sessions = new Map<string, StreamableHTTPServerTransport>();
  protected server?: http.Server;
  protected token?: string;
  protected configured?: { enabled: boolean, port: number };
  protected current: VesAgentAccessStatus = { listening: false, sessions: 0 };
  protected queue: Promise<unknown> = Promise.resolve();

  connect(client: RpcProxy<VesAgentAccessClient>): VesAgentAccess {
    this.clients.push(client);
    client.onDidCloseConnection(() => {
      const index = this.clients.indexOf(client);
      if (index >= 0) {
        this.clients.splice(index, 1);
      }
    });
    return {
      configure: (enabled, port) => this.configure(enabled, port),
      status: async () => this.status(),
      config: async () => this.current.listening && this.token && this.current.url
        ? { url: this.current.url, token: this.token } as VesAgentAccessConfig
        : undefined,
      activate: async () => {
        const index = this.clients.indexOf(client);
        if (index >= 0) {
          this.clients.splice(index, 1);
          this.clients.push(client);
        }
      },
      setClient: () => undefined,
      dispose: () => undefined,
    };
  }

  protected status(): VesAgentAccessStatus {
    return { ...this.current, sessions: this.sessions.size };
  }

  protected configure(enabled: boolean, port: number): Promise<VesAgentAccessStatus> {
    const next = this.queue.then(async () => {
      if (this.configured?.enabled === enabled && this.configured.port === port) {
        return this.status();
      }
      this.configured = { enabled, port };
      await this.stop();
      if (enabled) {
        await this.start(port);
      }
      return this.status();
    });
    this.queue = next.catch(() => undefined);
    return next;
  }

  protected async start(port: number): Promise<void> {
    const file = await this.configFile();
    try {
      this.token = await this.readOrMakeToken(file);
      const server = http.createServer((request, response) => {
        this.handle(request, response, port).catch(error => {
          console.error('[agent access] request failed:', error);
          if (!response.headersSent) {
            response.writeHead(500).end();
          }
        });
      });
      await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', () => {
          server.off('error', reject);
          resolve();
        });
      });
      this.server = server;
      const url = `http://127.0.0.1:${port}/mcp`;
      await this.writePrivate(file, JSON.stringify({ url, token: this.token }, undefined, 2));
      this.current = { listening: true, url, file, sessions: 0 };
    } catch (error) {
      const message = (error as NodeJS.ErrnoException).code === 'EADDRINUSE'
        ? `Port ${port} is taken; choose another one in the settings (Agent Access: Port).`
        : error instanceof Error ? error.message : String(error);
      this.current = { listening: false, file, error: message, sessions: 0 };
    }
  }

  protected async stop(): Promise<void> {
    for (const transport of this.sessions.values()) {
      await transport.close().catch(() => undefined);
    }
    this.sessions.clear();
    const server = this.server;
    this.server = undefined;
    this.current = { listening: false, sessions: 0 };
    if (server) {
      server.closeAllConnections();
      await new Promise<void>(resolve => server.close(() => resolve()));
    }
  }

  protected async handle(request: http.IncomingMessage, response: http.ServerResponse, port: number): Promise<void> {
    const { pathname } = new URL(request.url ?? '/', 'http://127.0.0.1');
    if (pathname !== '/mcp') {
      response.writeHead(404).end();
      return;
    }
    const host = request.headers.host ?? '';
    if (host !== `127.0.0.1:${port}` && host !== `localhost:${port}`) {
      response.writeHead(403).end();
      return;
    }
    if (!this.authorized(request.headers.authorization)) {
      response.writeHead(401, { 'Content-Type': 'text/plain' }).end('The token from agent-access.json is missing or wrong.');
      return;
    }

    const body = request.method === 'POST' ? await this.readBody(request) : undefined;
    const sessionId = request.headers['mcp-session-id'];
    let transport = typeof sessionId === 'string' ? this.sessions.get(sessionId) : undefined;
    if (!transport) {
      if (sessionId !== undefined || !isInitializeRequest(body)) {
        response.writeHead(404, { 'Content-Type': 'application/json' }).end(JSON.stringify({
          jsonrpc: '2.0', error: { code: -32001, message: 'Session not found; start a new one.' }, id: null,
        }));
        return;
      }
      const created = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: id => {
          this.sessions.set(id, created);
        },
      });
      created.onclose = () => {
        if (created.sessionId) {
          this.sessions.delete(created.sessionId);
        }
      };
      await (await this.mcpServer()).connect(created);
      transport = created;
    }
    await transport.handleRequest(request, response, body);
  }

  // eslint-disable-next-line deprecation/deprecation
  protected async mcpServer(): Promise<Server> {
    const info = await this.applicationServer.getApplicationInfo().catch(() => undefined);
    // eslint-disable-next-line deprecation/deprecation
    const server = new Server(
      { name: 'VUEngine Studio', version: info?.version ?? '0.0.0' },
      { capabilities: { tools: {} }, instructions: VUENGINE_AGENT_GUIDE },
    );
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: (await this.window().listTools()).map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema as { type: 'object' },
      })),
    }));
    server.setRequestHandler(CallToolRequestSchema, async call => {
      const text = await this.window().callTool(call.params.name, JSON.stringify(call.params.arguments ?? {}));
      return { content: [{ type: 'text' as const, text }], isError: text.startsWith('error:') };
    });
    return server;
  }

  protected window(): VesAgentAccessClient {
    const client = this.clients[this.clients.length - 1];
    if (!client) {
      throw new Error('VUEngine Studio has no window open.');
    }
    return client;
  }

  protected authorized(header: string | undefined): boolean {
    if (!this.token || !header?.startsWith('Bearer ')) {
      return false;
    }
    const given = Buffer.from(header.slice('Bearer '.length).trim());
    const expected = Buffer.from(this.token);
    return given.length === expected.length && timingSafeEqual(given, expected);
  }

  protected async readBody(request: http.IncomingMessage): Promise<unknown> {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of request) {
      size += (chunk as Buffer).length;
      if (size > MAX_BODY) {
        throw new Error('The request is too large.');
      }
      chunks.push(chunk as Buffer);
    }
    const text = Buffer.concat(chunks).toString('utf8');
    return text ? JSON.parse(text) : undefined;
  }

  protected async configFile(): Promise<string> {
    return path.join(FileUri.fsPath(await this.envVariablesServer.getConfigDirUri()), 'agent-access.json');
  }

  protected async readOrMakeToken(file: string): Promise<string> {
    try {
      const stored = JSON.parse(await fs.readFile(file, 'utf8')) as { token?: unknown };
      if (typeof stored.token === 'string' && /^[0-9a-f]{64}$/.test(stored.token)) {
        return stored.token;
      }
    } catch {
      // none yet
    }
    return randomBytes(32).toString('hex');
  }

  protected async writePrivate(file: string, contents: string): Promise<void> {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, contents, { mode: 0o600 });
    await fs.chmod(file, 0o600).catch(() => undefined);
  }
}
