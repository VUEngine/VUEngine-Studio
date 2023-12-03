import { Emitter, isWindows, nls } from '@theia/core';
import { LabelProvider } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStatWithMetadata } from '@theia/filesystem/lib/common/files';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { deepmerge } from 'deepmerge-ts';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProcessService, VesProcessType } from '../../process/common/ves-process-service-protocol';
import {
  DEFAULT_IMAGE_CONVERTER_CONFIG,
  ImageConfigFileToBeConverted,
  ImageConfig,
  ImagesLogLine,
  ImagesLogLineType,
  ConvertedFileData,
  COMPRESSION_FLAG_LENGTH,
  ConversionResult,
  ImageCompressionType
} from './ves-images-types';
import { compressTiles } from './ves-images-compressor';

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

  // is converting
  protected _isConverting: boolean = false;
  protected readonly onDidChangeIsConvertingEmitter = new Emitter<boolean>();
  readonly onDidChangeIsConverting = this.onDidChangeIsConvertingEmitter.event;
  set isConverting(isConverting: boolean) {
    this._isConverting = isConverting;
    this.onDidChangeIsConvertingEmitter.fire(this._isConverting);
  }
  get isConverting(): boolean {
    return this._isConverting;
  }

  // progress
  protected _progress: number = 0;
  protected readonly onDidChangeProgressEmitter = new Emitter<number>();
  readonly onDidChangeProgress = this.onDidChangeProgressEmitter.event;
  set progress(progress: number) {
    this._progress = progress > 100
      ? 100
      : progress > 0
        ? progress
        : 0;
    this.onDidChangeProgressEmitter.fire(this._progress);
  }
  get progress(): number {
    return this._progress;
  }

  // total images to convert
  protected _totalToConvert: number = 0;
  protected readonly onDidChangeTotalToConvertEmitter = new Emitter<number>();
  readonly onDidChangeTotalToConvert = this.onDidChangeTotalToConvertEmitter.event;
  set totalToConvert(totalToConvert: number) {
    this._totalToConvert = totalToConvert;
    this.onDidChangeTotalToConvertEmitter.fire(this._totalToConvert);
  }
  get totalToConvert(): number {
    return this._totalToConvert;
  }

  // images left to convert
  protected _leftToConvert: number = 0;
  protected readonly onDidChangeLeftToConvertEmitter = new Emitter<number>();
  readonly onDidChangeLeftToConvert = this.onDidChangeLeftToConvertEmitter.event;
  set leftToConvert(leftToConvert: number) {
    this._leftToConvert = leftToConvert;
    this.onDidChangeLeftToConvertEmitter.fire(this._leftToConvert);
  }
  get leftToConvert(): number {
    return this._leftToConvert;
  }

  // log
  protected _log: ImagesLogLine[] = [];
  protected readonly onDidChangeLogEmitter = new Emitter<ImagesLogLine[]>();
  readonly onDidChangeLog = this.onDidChangeLogEmitter.event;
  set log(log: ImagesLogLine[]) {
    this._log = log;
    this.onDidChangeLogEmitter.fire(this._log);
  }
  get log(): ImagesLogLine[] {
    return this._log;
  }
  protected pushLog(line: ImagesLogLine): void {
    this.log.push(line);
    this.onDidChangeLogEmitter.fire(this._log);
  }
  clearLog(): void {
    this.log = [];
    this.onDidChangeLogEmitter.fire(this._log);
  }

  @postConstruct()
  protected init(): void {
    this.bindEvents();
  }

  async convertAll(changedOnly: boolean): Promise<void> {
    if (this.isConverting) {
      return;
    }

    await this.doConvertFiles(changedOnly);
  }

  protected async doConvertFiles(changedOnly: boolean): Promise<void> {
    this.pushLog({
      timestamp: Date.now(),
      text: changedOnly
        ? nls.localize('vuengine/imageConverter/startingToConvertChanged', 'Starting to convert changed images...')
        : nls.localize('vuengine/imageConverter/startingToConvertAll', 'Starting to convert all images...'),
      type: ImagesLogLineType.Headline,
    });

    const imageConfigFilesToBeConverted = await this.getImageConfigFilesToBeConverted(changedOnly);

    if (imageConfigFilesToBeConverted.length === 0) {
      this.pushLog({
        timestamp: Date.now(),
        text: nls.localize('vuengine/imageConverter/noneFound', 'None found.'),
        type: ImagesLogLineType.Normal,
      });
      this.pushLog({
        timestamp: Date.now(),
        text: '',
        type: ImagesLogLineType.Normal,
      });

      return;
    }

    this.progress = 0;
    this.isConverting = true;
    this.totalToConvert = imageConfigFilesToBeConverted.length;
    this.leftToConvert = this.totalToConvert;

    this.pushLog({
      timestamp: Date.now(),
      text: nls.localize('vuengine/imageConverter/foundXImages', 'Found {0} images', this.totalToConvert),
      type: ImagesLogLineType.Normal,
    });

    await Promise.all(imageConfigFilesToBeConverted.map(async imageConfigFileToBeConverted => {
      const conversionResult = await this.convertImage(imageConfigFileToBeConverted.configFileUri, imageConfigFileToBeConverted.config);
      // TODO: trigger template render
      console.log(conversionResult);
    }));
  }

  async convertImage(imageConfigFileUri: URI, imageConfig: ImageConfig): Promise<ConversionResult> {
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

    // throw at grit
    const gritUri = await this.getGritUri();
    const imagePaths: string[] = [];
    if (imageConfig.tileset.shared || (imageConfig.animation.isAnimation && imageConfig.animation.individualFiles)) {
      const paths = await Promise.all(window.electronVesCore.findFiles(await this.fileService.fsPath(imageConfigFileUri.parent), '*.png')
        .map(async filePath => this.fileService.fsPath(imageConfigFileUri.parent.resolve(filePath))));
      imagePaths.push(...paths);
    } else if (imageConfig.sourceFile) {
      await this.workspaceService.ready;
      const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;
      imagePaths.push(workspaceRootUri.resolve(imageConfig.sourceFile).path.toString());
    }
    const name = imageConfig.name ? imageConfig.name : imageConfigFileUri.path.name;
    const gritArguments = this.getGritArguments(name, imageConfig);
    const tempDirName = `__${this.vesCommonService.nanoid()}`;
    const tempDirUri = imageConfigFileUri.parent.resolve(tempDirName);
    if (!(await this.fileService.exists(tempDirUri))) {
      await this.fileService.createFolder(tempDirUri);
    }

    const processInfo = await this.vesProcessService.launchProcess(VesProcessType.Raw, {
      command: await this.fileService.fsPath(gritUri),
      args: [
        ...imagePaths,
        ...gritArguments
      ],
      options: {
        cwd: await this.fileService.fsPath(tempDirUri)
      },
    });

    return new Promise(resolve => {
      // wait for converting process to finish, then process further
      // TODO: dispose listener once done
      const exitListener = this.vesProcessWatcher.onDidExitProcess(async ({ pId }) => {
        if (pId === processInfo.processManagerId) {
          const convertedFileData = await this.getConvertedFilesData(tempDirUri);
          this.fileService.delete(tempDirUri, { recursive: true });

          this.removeUnusedEmptyTileAddedByGrit(imageConfig, convertedFileData);

          // compute frame offsets for spritesheet animations
          // TODO: do only for __ANIMATED_SINGLE
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

          if (imageConfig.animation.isAnimation
            && imageConfig.animation.individualFiles) {

            let totalTilesCount = 0;
            let tilesData: string[] = [];
            let mapData: string[] = [];

            let frameTileOffsets: number[] = [COMPRESSION_FLAG_LENGTH];
            let largestFrame = 0;
            convertedFileData.map(output => {
              totalTilesCount += output.tiles.count;
              tilesData = tilesData.concat(output.tiles.data);
              mapData = mapData.concat(output.map.data);
              frameTileOffsets = frameTileOffsets.concat(tilesData.length + 1);
              if (output.tiles.count > largestFrame) {
                largestFrame = output.tiles.count;
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
              height: 0, // TODO
              name,
              width: 0, // TODO
            };
            result.maps.push({
              data: mapData,
              height: 0, // TODO
              name,
              width: 0, // TODO
            });
            result.animation = {
              largestFrame
            };
            this.reportConverted(imageConfigFileUri);

          } else {
            convertedFileData.map(output => {
              if (output.tiles.data.length) {
                result.tiles = {
                  ...output.tiles,
                  name: output.name
                };
              }
              if (output.map.data.length) {
                result.maps.push({
                  ...output.map,
                  name: output.name
                });
              }
              this.reportConverted(imageConfigFileUri);
            });
          }

          await this.handleCompression(imageConfig, result);

          exitListener.dispose();
          resolve(result);
        }
      });
    });
  }

  protected async getConvertedFilesData(convertedFolderUri: URI): Promise<ConvertedFileData[]> {
    const generatedFiles = window.electronVesCore.findFiles(await this.fileService.fsPath(convertedFolderUri), '*.c')
      .map(file => convertedFolderUri.resolve(file));

    const convertedFileData: ConvertedFileData[] = [];

    // write all file contents to map
    await Promise.all(generatedFiles.map(async file => {
      const fileContent = (await this.fileService.readFile(file)).value.toString();
      const name = fileContent.match(/\/\/\t(\w+)\, ([0-9]+)x([0-9]+)@2/) ?? ['', ''];
      const tilesData = fileContent.match(/0x([0-9A-Fa-f]{8}),/g)?.map(hex => hex.substring(2, 10)) ?? [];
      const mapData = fileContent.match(/0x([0-9A-Fa-f]{4}),/g)?.map(hex => hex.substring(2, 6)) ?? [];
      const imageDimensions = fileContent.match(/, ([0-9]+)x([0-9]+)@2/) ?? [0, 0];
      const mapDimensions = fileContent.match(/, not compressed, ([0-9]+)x([0-9]+)/) ?? [0, 0];

      convertedFileData.push({
        name: name[1],
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

    return convertedFileData;
  }

  protected reportConverted(convertedImageUri: URI): void {
    this.pushLog({
      timestamp: Date.now(),
      text: `Converted ${convertedImageUri.path.base}`,
      type: ImagesLogLineType.Normal,
      uri: convertedImageUri,
    });

    this.leftToConvert--;
    this.progress = Math.ceil((this.totalToConvert - this.leftToConvert) * 100 / this.totalToConvert);

  }

  protected getGeneratedFileUri(imageConfigFileUri: URI, imageUri: URI): URI {
    return imageConfigFileUri.parent
      .resolve('Converted')
      .resolve(`${imageUri.path.name}.c`);
  }

  protected async handleCompression(imageConfig: ImageConfig, conversionResult: ConversionResult): Promise<void> {
    if (imageConfig.tileset.compression !== ImageCompressionType.NONE) {
      conversionResult.tiles = {
        ...conversionResult.tiles,
        ...compressTiles(
          conversionResult.tiles.data,
          imageConfig.tileset.compression as ImageCompressionType,
          imageConfig.animation,
          imageConfig.animation.isAnimation && imageConfig.animation.individualFiles
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

  protected async getImageConfigFilesToBeConverted(changedOnly: boolean): Promise<ImageConfigFileToBeConverted[]> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;

    const imageConfigFilesToBeConverted: ImageConfigFileToBeConverted[] = [];
    const imageConfigFiles = window.electronVesCore.findFiles(await this.fileService.fsPath(workspaceRootUri), '**/*.imageConv', {
      dot: false,
      ignore: ['build/**'],
      nodir: true
    });
    for (const imageConfigFile of imageConfigFiles) {
      const imageConfigFileUri = workspaceRootUri.resolve(imageConfigFile);
      const config = await this.getConverterConfig(imageConfigFileUri);

      const name = config.name ? config.name : imageConfigFileUri.path.name;

      const images = await this.getRelevantImageFiles(changedOnly, imageConfigFileUri, config, name);
      if (images.length === 0) {
        // console.log(`No relevant images for ${imageConfigFileUri.path.base}`);
        continue;
      }

      imageConfigFilesToBeConverted.push({
        configFileUri: imageConfigFileUri,
        config,
      });
    }

    return imageConfigFilesToBeConverted;
  }

  protected async getRelevantImageFiles(changedOnly: boolean, imageConfigFileUri: URI, config: ImageConfig, name: string): Promise<URI[]> {
    let foundImages: URI[] = [];
    if (config.tileset.shared || (config.animation.isAnimation && config.animation.individualFiles)) {
      const resolved = await this.fileService.resolve(imageConfigFileUri.parent);
      if (resolved.children) {
        await Promise.all(resolved.children.map(async child => {
          if (child.name.endsWith('.png') && await this.fileService.exists(child.resource)) {
            foundImages.push(child.resource);
          }
        }));
      }
    } else {
      const fileUri = imageConfigFileUri.parent.resolve(config.sourceFile);
      if (config.sourceFile.endsWith('.png') && await this.fileService.exists(fileUri)) {
        foundImages.push(fileUri);
      }
    }

    // if changedOnly flag is set, remove files that have not been changed
    if (changedOnly) {
      foundImages = await this.getOnlyChangedImages(foundImages, config, imageConfigFileUri, name);
    }

    // remove duplicates and return
    return [...new Set(foundImages)];
  }

  protected async getOnlyChangedImages(
    foundImages: URI[],
    config: ImageConfig,
    imageConfigFileUri: URI,
    name: string,
  ): Promise<URI[]> {
    const imageConfigFileStat = await this.fileService.resolve(imageConfigFileUri, { resolveMetadata: true });
    if ((config.animation.isAnimation && config.animation.individualFiles) || config.tileset.shared) {
      /*
      TODO:
      if (!await this.newerThanCollectiveConvertedFile(foundImages, imageConfigFileUri, imageConfigFileStat, name)) {
        return [];
      }
      */
    } else {
      const changedImages: URI[] = [];
      await Promise.all(foundImages.map(async foundImage => {
        const foundImageStat = await this.fileService.resolve(foundImage, { resolveMetadata: true });
        const convertedFileUri = this.getGeneratedFileUri(imageConfigFileUri, foundImage);
        const convertedFileStat = await this.fileService.exists(convertedFileUri)
          ? await this.fileService.resolve(convertedFileUri, { resolveMetadata: true })
          : undefined;
        if (this.fileHasChanged(imageConfigFileStat, foundImageStat, convertedFileStat)) {
          changedImages.push(foundImage);
        }
      }));
      return changedImages;
    }

    return foundImages;
  }

  protected async isChanged(
    imageUri: URI,
    config: ImageConfig,
    imageConfigFileUri: URI,
    name: string,
  ): Promise<boolean> {
    const imageConfigFileStat = await this.fileService.resolve(imageConfigFileUri, { resolveMetadata: true });
    if ((config.animation.isAnimation && config.animation.individualFiles) || config.tileset.shared) {
      return this.newerThanCollectiveConvertedFile(imageUri, imageConfigFileUri, imageConfigFileStat, name);
    } else {
      const imageUriStat = await this.fileService.resolve(imageUri, { resolveMetadata: true });
      const convertedFileUri = this.getGeneratedFileUri(imageConfigFileUri, imageUri);
      const convertedFileStat = await this.fileService.exists(convertedFileUri)
        ? await this.fileService.resolve(convertedFileUri, { resolveMetadata: true })
        : undefined;
      return this.fileHasChanged(imageConfigFileStat, imageUriStat, convertedFileStat);
    }
  }

  protected fileHasChanged(imageConfigFileStat: FileStatWithMetadata, fileStat: FileStatWithMetadata, convertedFileStat?: FileStatWithMetadata): boolean {
    // if an image file (or the image config file) has been edited (mtime) or has been moved or copied to this folder (ctime)
    // after the converted file has been generated/last edited, consider it a change
    return (!convertedFileStat
      || fileStat.ctime > convertedFileStat.mtime
      || fileStat.mtime > convertedFileStat.mtime
      || imageConfigFileStat.ctime > convertedFileStat.mtime
      || imageConfigFileStat.mtime > convertedFileStat.mtime
    );
  }

  protected async newerThanCollectiveConvertedFile(
    file: URI,
    imageConfigFileUri: URI,
    imageConfigFileStat: FileStatWithMetadata,
    name: string): Promise<boolean> {
    const convertedFileUri = imageConfigFileUri.parent.resolve('Converted').resolve(`${name}.c`);
    if (!await this.fileService.exists(convertedFileUri)) {
      return true;
    }

    let atLeastOneFileNewer = false;
    const convertedFileStat = await this.fileService.exists(convertedFileUri)
      ? await this.fileService.resolve(convertedFileUri, { resolveMetadata: true })
      : undefined;

    if (!atLeastOneFileNewer) {
      const fileStat = await this.fileService.resolve(file, { resolveMetadata: true });
      if (this.fileHasChanged(imageConfigFileStat, fileStat, convertedFileStat)) {
        atLeastOneFileNewer = true;
      }
    }

    return atLeastOneFileNewer;
  }

  protected async getConverterConfig(file: URI): Promise<ImageConfig> {
    const fileContents = await this.fileService.readFile(file);
    const config = JSON.parse(fileContents.value.toString());
    const merged = deepmerge(DEFAULT_IMAGE_CONVERTER_CONFIG, config);

    if (!Array.isArray(merged.images) || !merged.images.length) {
      merged.images = ['.'];
    }

    return merged;
  }

  protected getGritArguments(name: string, config: ImageConfig): string[] {
    const gritArguments = ['-fh!', '-ftc', '-gB2', '-p!', '-mB16:hv_i11'];

    if (config.map.generate) {
      if (config.map.reduce.flipped || config.map.reduce.unique) {
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
      gritArguments.push('-s');
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

  protected bindEvents(): void {
    this.onDidChangeLeftToConvert(left => {
      if (left === 0) {
        this.isConverting = false;
        this.progress = 100;
        this.pushLog({
          timestamp: Date.now(),
          text: nls.localize('vuengine/imageConverter/done', 'Done'),
          type: ImagesLogLineType.Done,
        });
        this.pushLog({
          timestamp: Date.now(),
          text: '',
          type: ImagesLogLineType.Normal,
        });
      }
    });
  }
}
