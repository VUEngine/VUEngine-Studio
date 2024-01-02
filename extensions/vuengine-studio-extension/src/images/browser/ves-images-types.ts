import URI from '@theia/core/lib/common/uri';
import { DataSection } from '../../editors/browser/components/Common/CommonTypes';

export interface ImageConfig {
  files: string[]
  name: string
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
}

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
  height: number
  name: string
  width: number
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
  height: number
  width: number
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

export interface TilesCompressionResult {
  tilesData: string[]
  frameTileOffsets: number[]
  compressionRatio: number
}

export const COMPRESSION_FLAG_LENGTH = 1;

export const DEFAULT_IMAGE_CONVERTER_CONFIG: ImageConfig = {
  files: [],
  name: '',
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
  }
};
