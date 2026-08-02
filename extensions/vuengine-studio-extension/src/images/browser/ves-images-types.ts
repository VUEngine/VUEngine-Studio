import URI from '@theia/core/lib/common/uri';
import {
  ColorMode,
  ConversionResult,
  DEFAULT_COLOR_DISTANCE_CALCULATOR,
  DEFAULT_DITHER_SERPENTINE,
  DEFAULT_MINIMUM_COLOR_DISTANCE_TO_DITHER,
  ImageCompressionType,
  ImageConfig as ImageConverterConfig,
  ImageQuantizationAlgorithm,
} from 'vb-image-converter';
import { AdvancedSelectOption } from '../../editors/browser/components/Common/Base/AdvancedSelect';
import { DataSection } from '../../editors/browser/components/Common/CommonTypes';

export interface ImageDataMap {
  [name: string]: Partial<ConversionResult>;
}

export type ImageConfig = ImageConverterConfig & {
  files: string[];
  section: DataSection;
  _imageData?: ImageDataMap;
};

export type ImageConfigWithName = ImageConfig & {
  name: string;
};

export interface ImageConfigFileToBeConverted {
  configFileUri: URI;
  config: ImageConfig;
}

export const NO_DITHER_ALGORITHM: ImageQuantizationAlgorithm = 'nearest';
export const DEFAULT_DITHER_ALGORITHM: ImageQuantizationAlgorithm = 'floyd-steinberg';

export const DEFAULT_IMAGE_CONVERTER_CONFIG: ImageConfig = {
  files: [],
  section: DataSection.ROM,
  tileset: {
    shared: false,
    compression: ImageCompressionType.NONE,
    optimization: {
      maxTiles: 0,
    },
  },
  map: {
    generate: true,
    reduce: {
      flipped: true,
      unique: true,
    },
    compression: ImageCompressionType.NONE,
  },
  animation: {
    isAnimation: false,
    individualFiles: false,
    frames: 0,
  },
  imageProcessingSettings: {
    distanceCalculator: DEFAULT_COLOR_DISTANCE_CALCULATOR,
    imageQuantizationAlgorithm: NO_DITHER_ALGORITHM,
    minimumColorDistanceToDither: DEFAULT_MINIMUM_COLOR_DISTANCE_TO_DITHER,
    serpentine: DEFAULT_DITHER_SERPENTINE,
  },
  colorMode: ColorMode.Default,
};

export const DISTANCE_CALCULATOR_OPTIONS: AdvancedSelectOption[] = [
  {
    label: 'CIE94',
    value: 'cie94-graphic-arts',
  },
  {
    label: 'CIEDE2000',
    value: 'ciede2000',
  },
  {
    label: 'Color Metric',
    value: 'color-metric',
  },
  {
    label: 'Euclidean',
    value: 'euclidean',
  },
  {
    label: 'Euclidean BT709',
    value: 'euclidean-bt709',
  },
  {
    label: 'Euclidean BT709 (No Alpha)',
    value: 'euclidean-bt709-noalpha',
  },
  {
    label: 'Manhattan',
    value: 'manhattan',
  },
  {
    label: 'Manhattan BT709',
    value: 'manhattan-bt709',
  },
  {
    label: 'Manhattan (nommyde)',
    value: 'manhattan-nommyde',
  },
  {
    label: 'PNGQuant',
    value: 'pngquant',
  },
];

export const IMAGE_QUANTIZATION_ALGORITHM_OPTIONS: AdvancedSelectOption[] = [
  {
    label: 'Floyd-Steinberg',
    value: 'floyd-steinberg',
  },
  {
    label: 'False Floyd Steinberg',
    value: 'false-floyd-steinberg',
  },
  {
    label: 'Stucki',
    value: 'stucki',
  },
  {
    label: 'Atkinson',
    value: 'atkinson',
  },
  {
    label: 'Jarvis',
    value: 'jarvis',
  },
  {
    label: 'Burkes',
    value: 'burkes',
  },
  {
    label: 'Sierra',
    value: 'sierra',
  },
  {
    label: 'Two-Row Sierra',
    value: 'two-sierra',
  },
  {
    label: 'Sierra Lite',
    value: 'sierra-lite',
  },
];
