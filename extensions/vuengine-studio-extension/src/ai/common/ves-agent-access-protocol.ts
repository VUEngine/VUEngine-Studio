import { RpcServer } from '@theia/core';

export const VES_AGENT_ACCESS_PATH = '/services/ves/agent-access';
export const VesAgentAccess = Symbol('VesAgentAccess');

export interface VesAgentTool {
  name: string;
  description: string;
  inputSchema: object;
}

export interface VesAgentAccessClient {
  listTools(): Promise<VesAgentTool[]>;
  callTool(name: string, args: string): Promise<string>;
}

export interface VesAgentAccessStatus {
  listening: boolean;
  url?: string;
  file?: string;
  error?: string;
  sessions: number;
}

export interface VesAgentAccessConfig {
  url: string;
  token: string;
}

export interface VesAgentAccess extends RpcServer<VesAgentAccessClient> {
  configure(enabled: boolean, port: number): Promise<VesAgentAccessStatus>;
  status(): Promise<VesAgentAccessStatus>;
  config(): Promise<VesAgentAccessConfig | undefined>;
  activate(): Promise<void>;
}
