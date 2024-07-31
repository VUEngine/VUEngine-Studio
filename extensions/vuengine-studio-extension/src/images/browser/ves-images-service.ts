import { isWindows } from '@theia/core';
import { LabelProvider } from '@theia/core/lib/browser';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import { Deferred } from '@theia/core/lib/common/promise-util';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import * as iq from 'image-q';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { ColorMode, PALETTE_R_VALUES, PALETTE_VALUE_INDEX_MAP } from '../../core/browser/ves-common-types';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProcessService, VesProcessType } from '../../process/common/ves-process-service-protocol';
import { compressTiles } from './ves-images-compressor';
import {
  COMPRESSION_FLAG_LENGTH,
  ConversionResult,
  ConversionResultMapData,
  ConvertedFileData,
  DEFAULT_COLOR_DISTANCE_CALCULATOR,
  DEFAULT_DITHER_SERPENTINE,
  DEFAULT_IMAGE_QUANTIZATION_ALGORITHM,
  DEFAULT_MINIMUM_COLOR_DISTANCE_TO_DITHER,
  ImageCompressionType,
  ImageConfig,
  ImageConfigWithName,
  ImageProcessingSettings,
  PIXELS_BITS_PER_TILE,
  TILE_HEIGHT,
  TILE_WIDTH,
  TILES_PER_UINT32
} from './ves-images-types';

@injectable()
export class VesImagesService {
  @inject(FileService)
  protected fileService: FileService;
  @inject(LabelProvider)
  protected readonly labelProvider: LabelProvider;
  @inject(VesCommonService)
  protected vesCommonService: VesCommonService;
  @inject(VesProcessService)
  protected vesProcessService: VesProcessService;
  @inject(VesProcessWatcher)
  protected readonly vesProcessWatcher: VesProcessWatcher;
  @inject(WorkspaceService)
  protected readonly workspaceService: WorkspaceService;

  protected _ready = new Deferred<void>();
  get ready(): Promise<void> {
    return this._ready.promise;
  }

  protected targetPalettes: iq.utils.Palette[];

  @postConstruct()
  protected init(): void {
    this.doInit();
  }

  protected async doInit(): Promise<void> {
    await this.buildPalettes();
    this._ready.resolve();
  }

  async convertImage(imageConfigFileUri: URI, imageConfig: ImageConfigWithName, filePath?: string): Promise<ConversionResult> {
    const result: ConversionResult = {
      animation: {},
      maps: [],
      tiles: {
        count: 0,
        data: [],
        height: 0,
        name: '',
        width: 0,
      },
    };

    // gather grit options
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    const files = filePath
      ? [filePath]
      : imageConfig.files.length
        ? imageConfig.files
        : window.electronVesCore.findFiles(imageConfigFileUri.parent.path.fsPath(), '*.png')
          .sort((a, b) => a.localeCompare(b))
          .map(p => workspaceRootUri.relative(imageConfigFileUri.parent.resolve(p))?.toString()!);
    const gritUri = await this.getGritUri();
    const name = imageConfig.name ? imageConfig.name : imageConfigFileUri.path.name;
    const gritArguments = this.getGritArguments(name, imageConfig);
    const tempDirName = `grit-${this.vesCommonService.nanoid()}`;
    const tempDirBaseUri = new URI(window.electronVesCore.getTempDir());
    const tempDirUri = tempDirBaseUri.resolve(tempDirName);
    if (!(await this.fileService.exists(tempDirUri))) {
      await this.fileService.createFolder(tempDirUri);
    }

    // preprocess images
    const processedImagePaths: string[] = [];
    await Promise.all(files.map(async imagePath => {
      const processedImage = await this.quantizeImage(imagePath, imageConfig.imageProcessingSettings, imageConfig.colorMode);
      const filename = workspaceRootUri.resolve(imagePath).path.name;
      const randomFileUri = tempDirUri.resolve(`${filename}.png`);
      // @ts-ignore
      await this.fileService.writeFile(randomFileUri, BinaryBuffer.fromString(processedImage));
      processedImagePaths.push(randomFileUri.path.fsPath());
    }));

    // throw at grit
    const processInfo = await this.vesProcessService.launchProcess(VesProcessType.Raw, {
      command: await this.fileService.fsPath(gritUri),
      args: [
        ...processedImagePaths,
        ...gritArguments
      ],
      options: {
        cwd: await this.fileService.fsPath(tempDirUri)
      },
    });

    return new Promise(resolve => {
      // wait for converting process to finish, then process further
      const exitListener = this.vesProcessWatcher.onDidExitProcess(async ({ pId }) => {
        if (pId === processInfo.processManagerId) {
          const convertedFileData = await this.getConvertedFilesData(tempDirUri);
          this.fileService.delete(tempDirUri, { recursive: true });

          this.removeUnusedEmptyTileAddedByGrit(imageConfig, convertedFileData);

          if (imageConfig.animation.isAnimation
            && imageConfig.animation.individualFiles) {

            let totalTilesCount = 0;
            let tilesData: string[] = [];
            let mapData: string[] = [];
            let height = 0;
            let width = 0;
            let largestFrame = 0;
            let frameTileOffsets: number[] = [COMPRESSION_FLAG_LENGTH];
            convertedFileData.map(m => {
              totalTilesCount += m.tiles.count;
              tilesData = tilesData.concat(m.tiles.data);
              mapData = mapData.concat(m.map.data);
              height = m.map.height;
              width = m.map.width;
              frameTileOffsets = frameTileOffsets.concat(tilesData.length + 1);
              if (m.tiles.count > largestFrame) {
                largestFrame = m.tiles.count;
              }
            });
            frameTileOffsets.pop();

            const compressedLength = tilesData.length;
            const uncompressedLength = totalTilesCount * 4;
            const tilesCompressionRatio = - ((uncompressedLength - compressedLength) / uncompressedLength * 100);

            result.tiles = {
              compressionRatio: tilesCompressionRatio,
              count: totalTilesCount,
              data: tilesData,
              frameOffsets: frameTileOffsets,
              height: height * 8,
              name,
              width: width * 8,
            };
            result.maps.push({
              data: mapData,
              height,
              name,
              width,
            });
            result.animation = {
              frames: convertedFileData.length,
              largestFrame,
            };
          } else {
            // We only need to generate TilesFrameOffsets for animations when either tiles are
            // compressed or the map data is optimized
            /*
            if (imageConfig.animation.isAnimation && !imageConfig.animation.individualFiles) {
              convertedFileData.map(fileData => {
                const frameCount = imageConfig.animation.frames || 1;
                const frameSize = fileData.tiles.data.length / frameCount;
                const frameOffsets = [COMPRESSION_FLAG_LENGTH];
                for (let i = 1; i < frameCount; i++) {
                  frameOffsets.push(COMPRESSION_FLAG_LENGTH + (frameSize * i));
                }
              });
            }
            */

            let frames = 0;
            convertedFileData.map(m => {
              if (m.tiles.data.length) {
                result.tiles = {
                  ...m.tiles,
                  name: m.name
                };
              }
              if (m.map.data.length) {
                result.maps.push({
                  ...m.map,
                  name: m.name
                });
                frames++;
              }
            });
            result.animation = {
              frames: imageConfig.animation.frames || frames,
            };
          }

          await this.handleCompression(imageConfig, result);

          exitListener.dispose();
          resolve(result);
        }
      });
    });
  }

  async quantizeImage(
    imagePath: string,
    processingSettings: ImageProcessingSettings,
    colorMode: ColorMode,
  ): Promise<Buffer> {
    await this.workspaceService.ready;
    await this.ready;

    // read image file
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
    const resolvedImageUri = workspaceRootUri.resolve(imagePath);
    const imageFileContent = await this.fileService.readFile(resolvedImageUri);
    // Using the Camoto fork of pngjs here, because it supports generating indexed PNGs
    const camoto = require('@camoto/pngjs/browser');
    const imageData = camoto.PNG.sync.read(Buffer.from(imageFileContent.value.buffer));

    // create point container
    const pointContainer = iq.utils.PointContainer.fromUint8Array(imageData.data, imageData.width, imageData.height);

    // apply reduced palette
    const outPointContainer = this.applyPaletteToPointContainer(pointContainer, this.targetPalettes[colorMode], processingSettings);

    // post process resulting point container into an indexed array
    const outPointContainerArray = outPointContainer.toUint8Array();
    const indexedPoints: number[] = [];
    if (colorMode === ColorMode.FrameBlend) {
      for (let x = 0; x < outPointContainerArray.length; x += 4) {
        indexedPoints.push(PALETTE_VALUE_INDEX_MAP[1][outPointContainerArray[x]]);
      }
      for (let x = 0; x < outPointContainerArray.length; x += 4) {
        indexedPoints.push(PALETTE_VALUE_INDEX_MAP[2][outPointContainerArray[x]]);
      }
    } else {
      for (let x = 0; x < outPointContainerArray.length; x += 4) {
        indexedPoints.push(PALETTE_VALUE_INDEX_MAP[0][outPointContainerArray[x]]);
      }
    };

    // create indexed png image
    return camoto.PNG.sync.write({
      ...imageData,
      alpha: false,
      bpp: 1,
      color: true,
      colorType: 3,
      data: Buffer.from(indexedPoints),
      depth: 8,
      gamma: 0,
      height: colorMode === ColorMode.FrameBlend ? imageData.height * 2 : imageData.height,
      interlace: false,
      palette: PALETTE_R_VALUES[0].map(r => [r, 0, 0, 255])
    }, {
      bitDepth: 8,
      inputColorType: 3,
      inputHasAlpha: false,
      colorType: 3
    });
  }

  // convert tile and map data (grit output) to a pixel data array that can be thrown at a CanvasImage element
  imageDataToPixelData(tilesData: string[], mapData: ConversionResultMapData): number[][] {
    const pixelData: number[][] = [];

    const V_FLIP_MASK = 1 << 12;
    const H_FLIP_MASK = 1 << 13;
    for (let mapY = 0; mapY < mapData.height; mapY++) {
      for (let mapX = 0; mapX < mapData.width; mapX++) {

        // combine 4 (TILES_PER_UINT32) adjacent values to get one tile
        let mapDataValue = parseInt(mapData.data[mapX + (mapY * mapData.width)], 16);
        const vFlip = mapDataValue & V_FLIP_MASK;
        const hFlip = mapDataValue & H_FLIP_MASK;
        mapDataValue &= ~V_FLIP_MASK; // set vertical flip bit to 0
        mapDataValue &= ~H_FLIP_MASK; // set horizontal flip bit to 0
        const tileStartIndex = mapDataValue * TILES_PER_UINT32;
        let tileData = '';
        for (let tileSegmentIndex = 0; tileSegmentIndex < TILES_PER_UINT32; tileSegmentIndex++) {
          const tileSegmentData = tilesData[tileStartIndex + tileSegmentIndex];
          const tileSegmentValue = parseInt(`0x${tileSegmentData}`);
          const paddedTileSegmentValue = tileSegmentValue.toString(2).padStart(32, '0');
          tileData = paddedTileSegmentValue + tileData;
        }

        // get current tile's pixels
        for (let tileY = 0; tileY < TILE_HEIGHT; tileY++) {
          const pixelYPosition = vFlip
            ? (mapY * TILE_HEIGHT) + TILE_HEIGHT - tileY - 1
            : (mapY * TILE_HEIGHT) + tileY;
          for (let tileX = 0; tileX < TILE_WIDTH; tileX++) {
            const pixelXPosition = hFlip
              ? (mapX * TILE_WIDTH) + TILE_WIDTH - tileX - 1
              : (mapX * TILE_WIDTH) + tileX;
            // find the current pixel's value by getting 2 offset bits from combined tile data
            // (reverted, first pixel is last in data)
            const pixelIndex = 2 * (PIXELS_BITS_PER_TILE - (tileY * TILE_HEIGHT) - tileX);
            const pixelValue = parseInt(tileData.substring(pixelIndex - 2, pixelIndex), 2);
            // set pixel value
            if (!pixelData[pixelYPosition]) {
              pixelData[pixelYPosition] = [];
            }
            pixelData[pixelYPosition][pixelXPosition] = pixelValue;
          }
        }

      }
    }

    return pixelData;
  };

  protected applyPaletteToPointContainer(
    pointContainer: iq.utils.PointContainer,
    palette: iq.utils.Palette,
    processingSettings: ImageProcessingSettings
  ): iq.utils.PointContainer {
    const imageQuantizer = (processingSettings?.imageQuantizationAlgorithm ?? 'nearest') !== 'nearest'
      ? new iq.image.ErrorDiffusionArray(
        this.getDistanceCalculator(processingSettings?.distanceCalculator ?? DEFAULT_COLOR_DISTANCE_CALCULATOR),
        this.getErrorDiffusionArrayKernel(processingSettings?.imageQuantizationAlgorithm ?? DEFAULT_IMAGE_QUANTIZATION_ALGORITHM),
        processingSettings?.serpentine ?? DEFAULT_DITHER_SERPENTINE,
        processingSettings?.minimumColorDistanceToDither ?? DEFAULT_MINIMUM_COLOR_DISTANCE_TO_DITHER,
      )
      : new iq.image.NearestColor(
        this.getDistanceCalculator(processingSettings?.distanceCalculator ?? DEFAULT_COLOR_DISTANCE_CALCULATOR),
      );

    return imageQuantizer.quantizeSync(pointContainer, palette);
  }

  protected getDistanceCalculator(distanceCalculator: string): iq.distance.AbstractDistanceCalculator {
    switch (distanceCalculator) {
      case 'cie94-graphic-arts':
        return new iq.distance.CIE94GraphicArts();
      case 'ciede2000':
        return new iq.distance.CIEDE2000();
      case 'color-metric':
        return new iq.distance.CMetric();
      case 'euclidean':
      default:
        return new iq.distance.Euclidean();
      case 'euclidean-bt709':
        return new iq.distance.EuclideanBT709();
      case 'euclidean-bt709-noalpha':
        return new iq.distance.EuclideanBT709NoAlpha();
      case 'manhattan':
        return new iq.distance.Manhattan();
      case 'manhattan-bt709':
        return new iq.distance.ManhattanBT709();
      case 'manhattan-nommyde':
        return new iq.distance.ManhattanNommyde();
      case 'pngquant':
        return new iq.distance.PNGQuant();
    }
  }

  protected getErrorDiffusionArrayKernel(imageQuantizationAlgorithm: string): number {
    switch (imageQuantizationAlgorithm) {
      case 'atkinson':
        return iq.image.ErrorDiffusionArrayKernel.Atkinson;
      case 'burkes':
        return iq.image.ErrorDiffusionArrayKernel.Burkes;
      case 'floyd-steinberg':
      default:
        return iq.image.ErrorDiffusionArrayKernel.FloydSteinberg;
      case 'false-floyd-steinberg':
        return iq.image.ErrorDiffusionArrayKernel.FalseFloydSteinberg;
      case 'jarvis':
        return iq.image.ErrorDiffusionArrayKernel.Jarvis;
      case 'sierra':
        return iq.image.ErrorDiffusionArrayKernel.Sierra;
      case 'sierra-lite':
        return iq.image.ErrorDiffusionArrayKernel.SierraLite;
      case 'stucki':
        return iq.image.ErrorDiffusionArrayKernel.Stucki;
      case 'two-sierra':
        return iq.image.ErrorDiffusionArrayKernel.TwoSierra;
    }
  }

  protected async getConvertedFilesData(convertedFolderUri: URI): Promise<ConvertedFileData[]> {
    const generatedFiles = window.electronVesCore.findFiles(await this.fileService.fsPath(convertedFolderUri), '*.c')
      .map(file => convertedFolderUri.resolve(file));

    const convertedFileData: ConvertedFileData[] = [];

    // write all file contents to map
    await Promise.all(generatedFiles.map(async file => {
      const fileContent = (await this.fileService.readFile(file)).value.toString();
      // @ts-ignore
      const name = fileContent.match(/(?<=\/\/{{BLOCK\().+?(?=\))/s) ?? [''];
      const tilesData = fileContent.match(/0x([0-9A-Fa-f]{8}),/g)?.map(hex => hex.substring(2, 10)) ?? [];
      const mapData = fileContent.match(/0x([0-9A-Fa-f]{4}),/g)?.map(hex => hex.substring(2, 6)) ?? [];
      const imageDimensions = fileContent.match(/, ([0-9]+)x([0-9]+)@2/) ?? [0, 0];
      const mapDimensions = fileContent.match(/, not compressed, ([0-9]+)x([0-9]+)/) ?? [0, 0];

      convertedFileData.push({
        name: name[0],
        tiles: {
          count: tilesData.length / 4,
          data: tilesData,
          height: imageDimensions[2] as number,
          width: imageDimensions[1] as number,
        },
        map: {
          data: mapData,
          height: mapDimensions[2] as number,
          width: mapDimensions[1] as number,
        },
      });
    }));

    return convertedFileData
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  protected async handleCompression(imageConfig: ImageConfig, conversionResult: ConversionResult): Promise<void> {
    if (imageConfig.tileset.compression !== ImageCompressionType.NONE) {
      conversionResult.tiles = {
        ...conversionResult.tiles,
        ...compressTiles(
          conversionResult.tiles.data as string[],
          imageConfig.tileset.compression as ImageCompressionType,
          imageConfig.animation,
          imageConfig.animation.isAnimation && imageConfig.animation.individualFiles,
        ),
      };
    }

    if (imageConfig.map.compression !== ImageCompressionType.NONE) {
      // TODO
    }
  }

  /**
   * For unknown (and unnecessary) reasons, grit prepends an empty tile to a charset if there is none already.
   * We check if the empty tile is used and, if not, remove it and update the map indices accordingly.
   * Grit also appends an empty tile to maps with an odd number of chars, which we remove.
   */
  protected removeUnusedEmptyTileAddedByGrit(imageConfig: ImageConfig, convertedFileData: ConvertedFileData[]): void {
    const hasTileSetFile = imageConfig.tileset.shared;
    const forceCleanup = imageConfig.map.generate
      && !imageConfig.map.reduce.flipped
      && !imageConfig.map.reduce.unique;

    // fix maps
    convertedFileData.map(fileData => {
      if (fileData.map.data.length > fileData.map.height * fileData.map.width) {
        fileData.map.data.pop();
      }
    });

    const emptyCharIsUsed = () => hasTileSetFile && convertedFileData.filter(output => output.map.data.includes('0000')).length;
    if (!imageConfig.map.generate || (!forceCleanup && emptyCharIsUsed())) {
      return;
    }

    // remove empty tile at beginning of charset (0x00000000,0x00000000,0x00000000,0x00000000,) and decrement all map indices
    convertedFileData.map(fileData => {
      if (!hasTileSetFile && !forceCleanup && fileData.map.data.includes('0000')) {
        return convertedFileData;
      }

      fileData.tiles.data.splice(0, 4);
      fileData.map.data = fileData.map.data.map(mapData => {
        const decreasedIntValue = parseInt(mapData, 16) - 1;
        return decreasedIntValue.toString(16).toUpperCase().padStart(4, '0000');
      });
      fileData.tiles.count = fileData.tiles.count - 1;
    });
  }

  protected getGritArguments(name: string, config: ImageConfig): string[] {
    const gritArguments = ['-fh!', '-ftc', '-gB2', '-p!', '-mB16:hv_i11'];

    if (config.map.generate) {
      if ((!config.animation.isAnimation || config.animation.individualFiles) &&
        (config.map.reduce.flipped || config.map.reduce.unique)) {
        let mapReduceArg = '-mR';
        if (config.map.reduce.unique) {
          mapReduceArg += 't';
        }
        if (config.map.reduce.flipped) {
          mapReduceArg += 'f';
        }
        gritArguments.push(mapReduceArg);
      } else {
        gritArguments.push('-mR!');
      }
    } else {
      gritArguments.push('-m!');
    }

    if (config.tileset.shared) {
      gritArguments.push('-gS');
      gritArguments.push('-O');
      gritArguments.push('__sharedTiles');
      gritArguments.push('-S');
      gritArguments.push(name);
    }

    return gritArguments;
  }

  protected async getGritUri(): Promise<URI> {
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    return resourcesUri
      .resolve('binaries')
      .resolve('vuengine-studio-tools')
      .resolve(this.vesCommonService.getOs())
      .resolve('grit')
      .resolve(isWindows ? 'grit.exe' : 'grit');
  }

  protected async buildPalettes(): Promise<void> {
    this.targetPalettes = [
      await this.buildPalette(ColorMode.Default),
      await this.buildPalette(ColorMode.FrameBlend),
    ];
  }

  protected async buildPalette(colorMode: ColorMode): Promise<iq.utils.Palette> {
    const paletteColors = PALETTE_R_VALUES[colorMode]
      .map(r => iq.utils.Point.createByRGBA(r, 0, 0, 255));
    const palette = await iq.buildPalette([]);
    paletteColors.forEach(pc => palette.add(pc));
    return palette;
  };
}
