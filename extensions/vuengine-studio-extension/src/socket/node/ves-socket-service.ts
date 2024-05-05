import { injectable } from '@theia/core/shared/inversify';
import net from 'net';
import { VesSocketService, VesSocketServiceClient } from '../common/ves-socket-service-protocol';

@injectable()
export class VesSocketServiceImpl implements VesSocketService {
  protected client: VesSocketServiceClient | undefined;
  protected socket: net.Socket | undefined;

  dispose(): void {
    throw new Error('Method not implemented.');
  }

  async setClient(client: VesSocketServiceClient): Promise<void> {
    this.client = client;
  }

  connect(port: number, ip: string): void {
    const client = this.client;
    const socket = new net.Socket();
    this.socket = socket;

    socket.on('connect', function (): void {
      client?.onDidConnect();
    });

    socket.on('data', function (data: Buffer): void {
      client?.onDidReceiveData(data);
    });

    socket.on('error', function (error: string): void {
      client?.onDidReceiveError(error);
    });

    socket.on('close', function (): void {
      client?.onDidClose();
      socket.destroy();
    });

    socket.connect(port, ip);
  }

  destroy(): void {
    this.socket?.destroy();
  }

  write(buffer: string | Uint8Array): void {
    this.socket?.write(buffer);
  }
}
