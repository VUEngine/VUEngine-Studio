import { BinaryBufferReadableStream } from '@theia/core/lib/common/buffer';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';

@injectable()
export class VesAudioConverterService {
  @inject(FileService)
  protected fileService: FileService;
  @inject(VesCommonService)
  protected vesCommonService: VesCommonService;
  @inject(VesProcessWatcher)
  protected readonly vesProcessWatcher: VesProcessWatcher;
  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  async convertPcm(filePath: string, range: number): Promise<number[]> {
    const result: number[] = [];
    const amplitude = range * 15;
    const scale = amplitude / 63 / 4;

    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    if (!workspaceRootUri) {
      return result;
    }
    const fileUri = workspaceRootUri.resolve(filePath);
    const exists = await this.fileService.exists(fileUri);

    if (exists) {
      const fileStreamContent = await this.fileService.readFileStream(fileUri);
      let fileBinaryBuffer = await BinaryBufferReadableStream.toBuffer(fileStreamContent.value);

      // cut header
      fileBinaryBuffer = fileBinaryBuffer.slice(36, fileBinaryBuffer.byteLength);

      [...Array(fileBinaryBuffer.byteLength)].map((v, i) => {
        let value = fileBinaryBuffer.readUInt8(i);
        // apply scaling
        value = Math.floor(value * scale);
        // clamp at amplitude max
        value = Math.min(amplitude, value);
        result.push(value);
      });
    }

    return result;
  }
}
