import URI from '@theia/core/lib/common/uri';
import { MemorySection } from '../../build/browser/ves-build-types';

export interface ImageConverterConfig {
  images: string[]
  name: string
  section: MemorySection
  tileset: {
    shared: boolean
    reduce: boolean
    compress: false | ImageConverterCompressor
  }
  map: {
    generate: boolean
    reduce: {
      flipped: boolean
      unique: boolean
    }
    compress: false | ImageConverterCompressor
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
  config: ImageConverterConfig
  gritArguments: string[]
  output: ConvertedFileData[]
}

export interface ImageConverterLogLine {
  timestamp: number
  text: string
  type: ImageConverterLogLineType
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

export enum ImageConverterLogLineType {
  Normal = 'normal',
  Headline = 'headline',
  Warning = 'warning',
  Error = 'error',
  Done = 'done',
}

export const COMPRESSION_FLAG_LENGTH = 1;

export enum ImageConverterCompressor {
  RLE = 'rle',
}

export interface TilesCompressionResult {
  tilesData: string[]
  frameTileOffsets: number[]
  compressionRatio: number
}
