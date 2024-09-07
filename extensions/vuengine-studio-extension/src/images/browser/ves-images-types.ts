import URI from '@theia/core/lib/common/uri';
import * as iq from 'image-q';
import { ColorMode } from '../../core/browser/ves-common-types';
import { BasicSelectOption } from '../../editors/browser/components/Common/BasicSelect';
import { DataSection } from '../../editors/browser/components/Common/CommonTypes';

export const DEFAULT_COLOR_DISTANCE_CALCULATOR = 'euclidean';
export const DEFAULT_IMAGE_QUANTIZATION_ALGORITHM = 'nearest';
export const DEFAULT_MINIMUM_COLOR_DISTANCE_TO_DITHER = 0;
export const DEFAULT_DITHER_SERPENTINE = false;

export const TILE_HEIGHT = 8;
export const TILE_WIDTH = 8;
export const TILES_PER_UINT32 = 4;
export const BITS_PER_PIXEL = 2;
export const PIXELS_BITS_PER_TILE = TILE_HEIGHT * TILE_WIDTH;
export const MAX_IMAGE_WIDTH = 512;

export const SHARED_TILES_FILENAME = '__sharedTiles';

export interface ImageConfig {
  files: string[]
  section: DataSection
  tileset: {
    shared: boolean
    compression: ImageCompressionType
  }
  map: {
    generate: boolean
    reduce: {
      flipped: boolean
      unique: boolean
    }
    compression: ImageCompressionType
  }
  animation: AnimationConfig
  imageProcessingSettings: ImageProcessingSettings,
  colorMode: ColorMode
}

export type ImageConfigWithName = ImageConfig & {
  name: string
};

export interface AnimationConfig {
  isAnimation: boolean
  individualFiles: boolean
  frames: number
}

export interface ImageConfigFileToBeConverted {
  configFileUri: URI
  config: ImageConfig
}

export interface ConversionResultTilesData {
  compressionRatio?: number
  count: number
  data: string[] | string // string when compressed
  frameOffsets?: number[]
  name: string
}

export interface ConversionResultMapData {
  compressionRatio?: number
  data: string[] | string // string when compressed
  height: number
  name: string
  width: number
}

export interface ConversionResultAnimationData {
  frames?: number
  largestFrame?: number
}

export interface ConversionResult {
  animation: ConversionResultAnimationData
  maps: ConversionResultMapData[]
  tiles: ConversionResultTilesData
}

export interface ConvertedFileTilesData {
  count: number
  data: string[]
}

export interface ConvertedFileMapData {
  data: string[]
  height: number
  width: number
}

export interface ConvertedFileData {
  map: ConvertedFileMapData
  name: string
  tiles: ConvertedFileTilesData
}

export enum ImageCompressionType {
  NONE = 'none',
  RLE = 'rle',
}

export type TilesCompressionResult = Partial<ConversionResultTilesData>;

export const COMPRESSION_FLAG_LENGTH = 1;

export const DEFAULT_IMAGE_CONVERTER_CONFIG: ImageConfig = {
  files: [],
  section: DataSection.ROM,
  tileset: {
    shared: false,
    compression: ImageCompressionType.NONE
  },
  map: {
    generate: true,
    reduce: {
      flipped: true,
      unique: true
    },
    compression: ImageCompressionType.NONE
  },
  animation: {
    isAnimation: false,
    individualFiles: false,
    frames: 0,
  },
  imageProcessingSettings: {
    distanceCalculator: DEFAULT_COLOR_DISTANCE_CALCULATOR,
    imageQuantizationAlgorithm: DEFAULT_IMAGE_QUANTIZATION_ALGORITHM,
    minimumColorDistanceToDither: DEFAULT_MINIMUM_COLOR_DISTANCE_TO_DITHER,
    serpentine: DEFAULT_DITHER_SERPENTINE,
  },
  colorMode: ColorMode.Default
};

export interface ImageProcessingSettings {
  distanceCalculator: iq.ColorDistanceFormula,
  imageQuantizationAlgorithm: iq.ImageQuantization,
  minimumColorDistanceToDither: number,
  serpentine: boolean,
  invert?: boolean,
}

export const DISTANCE_CALCULATOR_OPTIONS: BasicSelectOption[] = [
  {
    label: 'CIE94',
    value: 'cie94-graphic-arts'
  },
  {
    label: 'CIEDE2000',
    value: 'ciede2000'
  },
  {
    label: 'Color Metric',
    value: 'color-metric'
  },
  {
    label: 'Euclidean',
    value: 'euclidean'
  },
  {
    label: 'Euclidean BT709',
    value: 'euclidean-bt709'
  },
  {
    label: 'Euclidean BT709 (No Alpha)',
    value: 'euclidean-bt709-noalpha'
  },
  {
    label: 'Manhattan',
    value: 'manhattan'
  },
  {
    label: 'Manhattan BT709',
    value: 'manhattan-bt709'
  },
  {
    label: 'Manhattan (nommyde)',
    value: 'manhattan-nommyde'
  },
  {
    label: 'PNGQuant',
    value: 'pngquant'
  },
];

export const IMAGE_QUANTIZATION_ALGORITHM_OPTIONS: BasicSelectOption[] = [
  {
    label: 'Floyd-Steinberg',
    value: 'floyd-steinberg'
  },
  {
    label: 'False Floyd Steinberg',
    value: 'false-floyd-steinberg'
  },
  {
    label: 'Stucki',
    value: 'stucki'
  },
  {
    label: 'Atkinson',
    value: 'atkinson'
  },
  {
    label: 'Jarvis',
    value: 'jarvis'
  },
  {
    label: 'Burkes',
    value: 'burkes'
  },
  {
    label: 'Sierra',
    value: 'sierra'
  },
  {
    label: 'Two-Row Sierra',
    value: 'two-sierra'
  },
  {
    label: 'Sierra Lite',
    value: 'sierra-lite'
  },
];
