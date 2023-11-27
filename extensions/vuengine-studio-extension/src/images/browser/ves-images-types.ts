import URI from '@theia/core/lib/common/uri';
import { MemorySection } from '../../build/browser/ves-build-types';

export interface ImagesConfig {
  images: string[]
  name: string
  section: MemorySection
  tileset: {
    shared: boolean
    reduce: boolean
    compress: false | ImageCompressionType
  }
  map: {
    generate: boolean
    reduce: {
      flipped: boolean
      unique: boolean
    }
    compress: false | ImageCompressionType
  }
  animation: AnimationConfig
}

export interface AnimationConfig {
  isAnimation: boolean
  individualFiles: boolean
  frameWidth: number
  frameHeight: number
}

export interface ImageConfigFileToBeConverted {
  imageConfigFileUri: URI
  images: URI[]
  name: string
  config: ImagesConfig
  gritArguments: string[]
  output: ConvertedFileData[]
}

export interface ImagesLogLine {
  timestamp: number
  text: string
  type: ImagesLogLineType
  uri?: URI
}

export interface ConvertedFileData {
  name: string
  fileUri: URI
  tilesData: string[]
  mapData: string[]
  frameTileOffsets: number[]
  meta: ConvertedFileDataMeta
}

export interface ConvertedFileDataMeta {
  tilesCount: number
  tilesCompressionRatio?: number
  mapCompressionRatio?: string
  imageHeight: number
  imageWidth: number
  mapHeight: number
  mapWidth: number
  mapReduceFlipped: boolean
  mapReduceUnique: boolean
  animation: AnimationConfig & {
    largestFrame: number
  }
}

export enum ImagesLogLineType {
  Normal = 'normal',
  Headline = 'headline',
  Warning = 'warning',
  Error = 'error',
  Done = 'done',
}

export enum ImageCompressionType {
  RLE = 'rle',
}

export interface TilesCompressionResult {
  tilesData: string[]
  frameTileOffsets: number[]
  compressionRatio: number
}

export const COMPRESSION_FLAG_LENGTH = 1;

export const DEFAULT_IMAGE_CONVERTER_CONFIG: ImagesConfig = {
  images: [],
  name: '',
  section: MemorySection.ROM,
  tileset: {
    shared: false,
    reduce: true,
    compress: false
  },
  map: {
    generate: true,
    reduce: {
      flipped: true,
      unique: true
    },
    compress: false
  },
  animation: {
    isAnimation: false,
    individualFiles: false,
    frameWidth: 0,
    frameHeight: 0
  }
};
