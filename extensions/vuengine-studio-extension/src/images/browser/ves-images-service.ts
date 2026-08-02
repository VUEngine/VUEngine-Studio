import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import {
  ColorMode,
  ConversionResult,
  ConversionResultMapData,
  ImageCompressionType,
  ImageProcessingSettings,
  PALETTE_R_VALUES,
  renderToPixels,
} from 'vb-image-converter';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesImagesConverter } from '../common/ves-images-service-protocol';
import { ImageConfigWithName } from './ves-images-types';

@injectable()
export class VesImagesService {
  @inject(FileService)
  protected fileService!: FileService;
  @inject(VesCommonService)
  protected readonly vesCommonService!: VesCommonService;
  @inject(VesImagesConverter)
  protected readonly converter!: VesImagesConverter;

  async convertImage(imageConfigFileUri: URI, imageConfig: ImageConfigWithName, filePath?: string): Promise<ConversionResult> {
    const folderUri = imageConfigFileUri.parent;
    const files = filePath ? [filePath] : imageConfig.files;
    const name = imageConfig.name ? imageConfig.name : imageConfigFileUri.path.name;
    // Results of the previous run are of no interest to the converter, and shipping
    // them along would send the whole compressed tile data over the wire every time.
    const { _imageData, ...config } = imageConfig;

    return this.converter.convert({
      name,
      images: files.map(file => {
        const fileUri = folderUri.resolve(file);
        return { name: fileUri.path.name, path: fileUri.path.fsPath() };
      }),
      config,
    });
  }

  async compressImageData(imageData: Partial<ConversionResult>): Promise<Partial<ConversionResult>> {
    const result = { ...imageData };

    if (result.tiles) {
      result.tiles = {
        ...result.tiles,
        data: await this.vesCommonService.compressJson(result.tiles.data),
      };
      if (imageData.tiles?.frameOffsets) {
        result.tiles.frameOffsets = await this.vesCommonService.compressJson(imageData.tiles.frameOffsets) as unknown as number[];
      }
    }

    if (result.maps) {
      result.maps = await Promise.all(result.maps.map(async map => ({
        ...map,
        data: await this.vesCommonService.compressJson(map.data),
      })));
    }

    return result;
  }

  // Runs only the pre-processing stage and hands back an indexed PNG, for
  // previews and for the font importer.
  async quantizeImage(
    imageUri: URI,
    processingSettings: ImageProcessingSettings,
    colorMode: ColorMode,
  ): Promise<Uint8Array> {
    return this.converter.quantize({
      name: imageUri.path.name,
      path: imageUri.path.fsPath(),
    }, processingSettings, colorMode);
  }

  // Expands tile and map data into a pixel matrix for canvas previews.
  imageDataToPixelData(tilesData: string[], mapData: ConversionResultMapData, compression: ImageCompressionType): number[][] {
    return renderToPixels(tilesData, mapData, compression);
  }

  // Encodes already indexed pixel data as an indexed PNG, for the font exporter.
  // Uses the Camoto fork of pngjs since it can write colorType 3.
  getIndexedPng(imageData: Uint8Array, height: number, width: number): Buffer {
    const camoto = require('@camoto/pngjs/browser');
    return camoto.PNG.sync.write({
      alpha: false,
      bpp: 1,
      color: true,
      colorType: 3,
      data: Buffer.from(imageData),
      depth: 8,
      gamma: 0,
      height,
      interlace: false,
      palette: PALETTE_R_VALUES[0].map(r => [r, 0, 0, 255]),
      width,
    }, {
      bitDepth: 8,
      inputColorType: 3,
      inputHasAlpha: false,
      colorType: 3
    });
  }

}
