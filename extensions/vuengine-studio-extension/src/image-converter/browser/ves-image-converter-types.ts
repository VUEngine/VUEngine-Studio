import URI from '@theia/core/lib/common/uri';
import { MemorySection } from '../../build/browser/ves-build-types';

export interface ImageConverterConfig {
  images: Array<string>
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
  animation: {
    isAnimation: boolean
    individualFiles: boolean
    frameWidth: number
    frameHeight: number
  }
}

export interface ImageConfigFileToBeConverted {
  imageConfigFileUri: URI
  images: Array<URI>
  name: string
  config: ImageConverterConfig
  gritArguments: Array<string>
  output: Array<ConvertedFileData>
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
  tilesData: Array<string>
  mapData: Array<string>
  frameTileOffsets: Array<number>
  meta: ConvertedFileDataMeta
}

export interface ConvertedFileDataMeta {
  tilesCount: number
  tilesCompressionRatio?: string
  mapCompressionRatio?: number
  imageHeight: number
  imageWidth: number
  mapHeight: number
  mapWidth: number
  mapReduceFlipped: boolean
  mapReduceUnique: boolean
  animation: {
    isAnimation: boolean
    individualFiles: boolean
    frameWidth: number
    frameHeight: number
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

export enum ImageConverterCompressor {
  RLE = 'rle',
}
