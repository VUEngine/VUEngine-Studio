import type {
  ColorMode,
  ConversionResult,
  ConvertRequest,
  ImageProcessingSettings,
  SourceImage,
} from 'vb-image-converter';

export const VES_IMAGES_SERVICE_PATH = '/services/ves/images';
export const VesImagesConverter = Symbol('VesImagesConverter');

export interface VesImagesConverter {
  convert(request: ConvertRequest): Promise<ConversionResult>;
  quantize(source: SourceImage, settings: ImageProcessingSettings, colorMode: ColorMode): Promise<Uint8Array>;
}
