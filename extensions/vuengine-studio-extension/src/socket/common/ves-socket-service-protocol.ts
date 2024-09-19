import { RpcServer } from '@theia/core';

export const VES_SOCKET_SERVICE_PATH = '/services/ves/socket';
export const VesSocketService = Symbol('VesSocketService');

export interface VesSocketServiceClient {
  onDidReceiveData(data: Buffer): void;
  onDidReceiveError(error: string): void;
  onDidConnect(): void;
  onDidClose(): void;
  onDidTransferChunk(): void;
}

export interface VesSocketService extends RpcServer<VesSocketServiceClient> {
  connect(port: number, ip: string): void;
  destroy(): void;
  write(buffer: string | Uint8Array): void;
  writeChunked(buffer: Uint8Array, chunkSizeBytes: number): void;
}
