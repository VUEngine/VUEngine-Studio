import { ILogger } from '@theia/core';
import { BackendApplicationContribution } from '@theia/core/lib/node';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import {
  ColorMode,
  ConversionResult,
  ConvertRequest,
  ImageConverterPool,
  ImageProcessingSettings,
  SourceImage,
} from 'vb-image-converter';
import { existsSync } from 'fs';
import { join } from 'path';
import { VesImagesConverter } from '../common/ves-images-service-protocol';

@injectable()
export class VesImagesConverterServer implements VesImagesConverter, BackendApplicationContribution {
  @inject(ILogger)
  protected readonly logger!: ILogger;

  protected pool: ImageConverterPool;

  @postConstruct()
  protected init(): void {
    this.pool = new ImageConverterPool({ workerPath: this.resolveWorkerPath() });
  }

  async convert(request: ConvertRequest): Promise<ConversionResult> {
    const result = await this.pool.convert(request);
    result.warnings.forEach(warning => this.logger.warn(`[image converter] ${request.name}: ${warning}`));
    return result;
  }

  async quantize(source: SourceImage, settings: ImageProcessingSettings, colorMode: ColorMode): Promise<Uint8Array> {
    return this.pool.quantize(source, settings, colorMode);
  }

  onStop(): void {
    this.pool.dispose().catch(error => this.logger.error('[image converter] failed to shut down worker pool', error));
  }

  protected resolveWorkerPath(): string | undefined {
    const bundled = join(__dirname, 'image-converter-worker.js');
    return existsSync(bundled) ? bundled : undefined;
  }
}
