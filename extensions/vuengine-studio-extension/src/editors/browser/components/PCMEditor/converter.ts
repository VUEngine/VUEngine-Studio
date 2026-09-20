import { URI } from '@theia/core';
import { BinaryBufferReadableStream } from '@theia/core/lib/common/buffer';
import { FileService } from '@theia/filesystem/lib/browser/file-service';

export const convertPcm = async (configFileUri: URI, filePath: string, fileService: FileService): Promise<number[]> => {
    const result: number[] = [];
    const amplitude = 5 * 15;
    const scale = amplitude / 63 / 4;

    const fileUri = configFileUri.parent.resolve(filePath);
    const exists = await fileService.exists(fileUri);

    if (exists) {
      const fileStreamContent = await fileService.readFileStream(fileUri);
      let fileBinaryBuffer = await BinaryBufferReadableStream.toBuffer(fileStreamContent.value);

      // cut header
      fileBinaryBuffer = fileBinaryBuffer.slice(36, fileBinaryBuffer.byteLength);

      [...Array(fileBinaryBuffer.byteLength)].map((v, i) => {
        let value = fileBinaryBuffer.readUInt8(i);
        // apply scaling
        value = Math.floor(value * scale);
        // clamp at max amplitude
        value = Math.min(amplitude, value);
        result.push(value);
      });
    }

    return result;
};
