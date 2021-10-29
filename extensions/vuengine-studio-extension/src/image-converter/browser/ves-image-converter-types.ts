import URI from '@theia/core/lib/common/uri';
import { MemorySection } from '../../build/browser/ves-build-types';

export interface ImageConverterConfig {
  images: Array<string>
  converter: {
    tileset: {
      shared: boolean
      reduce: boolean
    }
    map: {
      generate: boolean
      reduce: {
        flipped: boolean
        unique: boolean
      }
    }
    stackFrames: boolean
  }
  name: string
  section: MemorySection
}

export interface ImageConfigFileToBeConverted {
  imageConfigFile: string
  images: Array<string>
  name: string
  config: ImageConverterConfig
  gritArguments: Array<string>
}

export interface ImageConverterLogLine {
  timestamp: number;
  text: string;
  type: ImageConverterLogLineType;
  uri?: URI;
}

export enum ImageConverterLogLineType {
  Normal = 'normal',
  Headline = 'headline',
  Warning = 'warning',
  Error = 'error',
  Done = 'done',
}

export interface FileContentsMap {
  [key: string]: string
}

export interface StackedFrameData {
  filename: string,
  tiles: Array<string>
  maps: Array<string>
}
