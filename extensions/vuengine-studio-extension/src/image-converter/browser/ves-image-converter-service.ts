import { Emitter, isWindows, nls } from '@theia/core';
import { LabelProvider } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStatWithMetadata } from '@theia/filesystem/lib/common/files';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { deepmerge } from 'deepmerge-ts';
import { VesCodeGenService } from '../../codegen/browser/ves-codegen-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesGlobService } from '../../glob/common/ves-glob-service-protocol';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProcessService, VesProcessType } from '../../process/common/ves-process-service-protocol';
import { compressTiles } from './ves-image-converter-compressor';
import {
  COMPRESSION_FLAG_LENGTH,
  CONVERTED_FILE_ENDING,
  DEFAULT_IMAGE_CONVERTER_CONFIG,
  ImageConfigFileToBeConverted,
  ImageConverterCompressor,
  ImageConverterConfig,
  ImageConverterLogLine,
  ImageConverterLogLineType
} from './ves-image-converter-types';

@injectable()
export class VesImageConverterService {
  @inject(FileService)
  protected fileService: FileService;
  @inject(LabelProvider)
  protected readonly labelProvider: LabelProvider;
  @inject(VesCodeGenService)
  protected vesCodeGenService: VesCodeGenService;
  @inject(VesCommonService)
  protected vesCommonService: VesCommonService;
  @inject(VesGlobService)
  protected vesGlobService: VesGlobService;
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
  protected _log: Array<ImageConverterLogLine> = [];
  protected readonly onDidChangeLogEmitter = new Emitter<Array<ImageConverterLogLine>>();
  readonly onDidChangeLog = this.onDidChangeLogEmitter.event;
  set log(log: Array<ImageConverterLogLine>) {
    this._log = log;
    this.onDidChangeLogEmitter.fire(this._log);
  }
  get log(): Array<ImageConverterLogLine> {
    return this._log;
  }
  protected pushLog(line: ImageConverterLogLine): void {
    this.log.push(line);
    this.onDidChangeLogEmitter.fire(this._log);
  }
  clearLog(): void {
    this.log = [];
    this.onDidChangeLogEmitter.fire(this._log);
  }

  @postConstruct()
  protected async init(): Promise<void> {
    this.bindEvents();
  }

  // TODO: add file watcher to detect changes of .image.json or image files and automatically convert
  // TODO: add queue for to be converted images.
  // this will be mainly needed for when an image file gets changed while a conversion is already running and the
  // file watcher needs to queue the conversion for that image.

  async convertAll(changedOnly: boolean): Promise<void> {
    if (this.isConverting) {
      return;
    }

    await this.doConvertFiles(changedOnly);
  }

  getConvertedDirName(): string {
    return 'Converted';
  }

  protected async doConvertFiles(changedOnly: boolean): Promise<void> {
    this.pushLog({
      timestamp: Date.now(),
      text: changedOnly
        ? nls.localize('vuengine/imageConverter/startingToConvertChanged', 'Starting to convert changed images...')
        : nls.localize('vuengine/imageConverter/startingToConvertAll', 'Starting to convert all images...'),
      type: ImageConverterLogLineType.Headline,
    });

    const imageConfigFilesToBeConverted = await this.getImageConfigFilesToBeConverted(changedOnly);

    if (imageConfigFilesToBeConverted.length === 0) {
      this.pushLog({
        timestamp: Date.now(),
        text: nls.localize('vuengine/imageConverter/noneFound', 'None found.'),
        type: ImageConverterLogLineType.Normal,
      });
      this.pushLog({
        timestamp: Date.now(),
        text: '',
        type: ImageConverterLogLineType.Normal,
      });

      return;
    }

    this.progress = 0;
    this.isConverting = true;
    this.totalToConvert = this.getTotalImagesToBeConverted(imageConfigFilesToBeConverted);
    this.leftToConvert = this.totalToConvert;

    this.pushLog({
      timestamp: Date.now(),
      text: nls.localize('vuengine/imageConverter/foundXImages', 'Found {0} images', this.totalToConvert),
      type: ImageConverterLogLineType.Normal,
    });

    const gritUri = await this.getGritUri();
    await this.fixFilePermissions(gritUri);

    await Promise.all(imageConfigFilesToBeConverted.map(async imageConfigFileToBeConverted => {
      await this.doConvertFile(imageConfigFileToBeConverted, gritUri);
    }));

    return;
  }

  protected async doConvertFile(imageConfigFileToBeConverted: ImageConfigFileToBeConverted, gritUri: URI): Promise<void> {
    const convertedDirUri = imageConfigFileToBeConverted.imageConfigFileUri.parent.resolve(this.getConvertedDirName());

    if (!(await this.fileService.exists(convertedDirUri))) {
      await this.fileService.createFolder(convertedDirUri);
    }

    const imagePaths: Array<string> = [];
    await Promise.all(imageConfigFileToBeConverted.images.map(async image => {
      const imagePath = await this.fileService.fsPath(image);
      imagePaths.push(imagePath);
    }));

    // throw at grit
    const processInfo = await this.vesProcessService.launchProcess(VesProcessType.Raw, {
      command: await this.fileService.fsPath(gritUri),
      args: [
        ...imagePaths,
        ...imageConfigFileToBeConverted.gritArguments
      ],
      options: {
        cwd: await this.fileService.fsPath(convertedDirUri)
      },
    });

    // wait for converting process to finish, then process further
    // TODO: dispose listener once done
    const exitListener = this.vesProcessWatcher.onDidExitProcess(async ({ pId }) => {
      if (pId === processInfo.processManagerId) {
        await this.workspaceService.ready;
        const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;

        imageConfigFileToBeConverted = await this.appendConvertedFilesData(imageConfigFileToBeConverted);
        imageConfigFileToBeConverted = this.removeUnusedEmptyTileAddedByGrit(imageConfigFileToBeConverted);

        // sort by filename
        imageConfigFileToBeConverted.output.sort((a, b) => a.fileUri.path.base > b.fileUri.path.base && 1 || -1);

        // compute frame offsets for spritesheet animations
        if (imageConfigFileToBeConverted.config.animation.isAnimation && !imageConfigFileToBeConverted.config.animation.individualFiles) {
          const frameSize = (4 * imageConfigFileToBeConverted.config.animation.frameHeight * imageConfigFileToBeConverted.config.animation.frameWidth) || 4;
          imageConfigFileToBeConverted.output.map(async output => {
            const frameCount = output.tilesData.length / frameSize;
            output.frameTileOffsets = [COMPRESSION_FLAG_LENGTH];
            for (let i = 1; i < frameCount; i++) {
              output.frameTileOffsets.push(COMPRESSION_FLAG_LENGTH + (frameSize * i));
            }
          });
        }

        imageConfigFileToBeConverted = await this.handleCompression(imageConfigFileToBeConverted);

        if (imageConfigFileToBeConverted.config.animation.isAnimation
          && imageConfigFileToBeConverted.config.animation.individualFiles) {
          // TODO: discard compression results if they're larger than the original size

          // delete source files and report done
          await Promise.all(imageConfigFileToBeConverted.output.map(async output => {
            await this.fileService.delete(output.fileUri);
            this.reportConverted(output.fileUri);
          }));

          let totalTilesCount = 0;
          let tilesData: Array<string> = [];
          let mapData: Array<string> = [];
          let frameTileOffsets: Array<number> = [COMPRESSION_FLAG_LENGTH];
          let largestFrame = 0;
          imageConfigFileToBeConverted.output.map(output => {
            totalTilesCount += output.meta.tilesCount;
            tilesData = tilesData.concat(output.tilesData);
            mapData = mapData.concat(output.mapData);
            frameTileOffsets = frameTileOffsets.concat(tilesData.length + 1);
            if (output.meta.tilesCount > largestFrame) {
              largestFrame = output.meta.tilesCount;
            }
          });

          const compressedLength = tilesData.length;
          const uncompressedLength = totalTilesCount * 4;
          const tilesCompressionRatio = - ((uncompressedLength - compressedLength) / uncompressedLength * 100);

          // remove last element from frameTileOffsets
          frameTileOffsets.pop();

          // render animation file
          const name = imageConfigFileToBeConverted.config.name
            ? imageConfigFileToBeConverted.config.name
            : imageConfigFileToBeConverted.imageConfigFileUri.path.name;
          const targetFileUri = imageConfigFileToBeConverted.imageConfigFileUri.parent
            .resolve(this.getConvertedDirName())
            .resolve(`${name}.${CONVERTED_FILE_ENDING}`);
          const resourcesUri = await this.vesCommonService.getResourcesUri();
          const templateFileUri = resourcesUri.resolve('templates').resolve('image.c.nj');

          const templateString = (await this.fileService.readFile(templateFileUri)).value.toString();
          this.vesCodeGenService.renderTemplateToFile('Image.c', targetFileUri, templateString, {
            name,
            tilesData,
            tilesCompression: imageConfigFileToBeConverted.config.tileset.compress,
            mapData,
            mapCompression: imageConfigFileToBeConverted.config.map.compress,
            frameTileOffsets,
            section: imageConfigFileToBeConverted.config.section,
            meta: {
              ...imageConfigFileToBeConverted.output[0].meta,
              tilesCount: totalTilesCount,
              tilesCompressionRatio: tilesCompressionRatio,
              animation: {
                ...imageConfigFileToBeConverted.output[0].meta.animation,
                largestFrame
              }
            },
          });

          // remove object file
          const relativeFilePath = workspaceRootUri.relative(imageConfigFileToBeConverted.imageConfigFileUri);
          const objectFileUri = workspaceRootUri
            .resolve('build')
            .resolve('working')
            .resolve('assets')
            .resolve(workspaceRootUri.path.name)
            .resolve(relativeFilePath?.dir!)
            .resolve(this.getConvertedDirName())
            .resolve(`${name}.o`);
          if (await this.fileService.exists(objectFileUri)) {
            await this.fileService.delete(objectFileUri);
          }

          this.reportConverted(targetFileUri);
        } else {
          // render asset files, delete original grit converted c files
          const resourcesUri = await this.vesCommonService.getResourcesUri();
          const templateFileUri = resourcesUri.resolve('templates').resolve('image.c.nj');
          const templateString = (await this.fileService.readFile(templateFileUri)).value.toString();

          await Promise.all(imageConfigFileToBeConverted.output.map(async output => {
            await this.fileService.delete(output.fileUri);
            const assetFileUri = output.fileUri.parent.resolve(`${output.fileUri.path.name}.${CONVERTED_FILE_ENDING}`);
            await this.vesCodeGenService.renderTemplateToFile('Image.c', assetFileUri, templateString, {
              name: output.name,
              tilesData: output.tilesData,
              tilesCompression: imageConfigFileToBeConverted.config.tileset.compress,
              mapData: output.mapData,
              mapCompression: imageConfigFileToBeConverted.config.map.compress,
              frameTileOffsets: output.frameTileOffsets,
              section: imageConfigFileToBeConverted.config.section,
              meta: output.meta,
            });

            // remove object file
            const relativeFilePath = workspaceRootUri.relative(output.fileUri);
            const objectFileUri = workspaceRootUri
              .resolve('build')
              .resolve('working')
              .resolve('assets')
              .resolve(workspaceRootUri.path.name)
              .resolve(relativeFilePath?.dir!)
              .resolve(`${output.fileUri.path.name}.o`);
            if (await this.fileService.exists(objectFileUri)) {
              await this.fileService.delete(objectFileUri);
            }

            this.reportConverted(output.fileUri);
          }));
        }

        exitListener.dispose();
      }
    });
  }

  protected async appendConvertedFilesData(imageConfigFileToBeConverted: ImageConfigFileToBeConverted): Promise<ImageConfigFileToBeConverted> {
    const generatedFiles = await this.getGeneratedFiles(imageConfigFileToBeConverted);

    // write all file contents to map
    await Promise.all(generatedFiles.map(async file => {
      const fileUri = file;
      const fileContent = (await this.fileService.readFile(fileUri)).value.toString();
      const name = fileContent.match(/\/\/\t(\w+)\, ([0-9]+)x([0-9]+)@2/) ?? ['', ''];
      const tilesData = fileContent.match(/0x([0-9A-Fa-f]{8}),/g)?.map(hex => hex.substring(2, 10)) ?? [];
      const mapData = fileContent.match(/0x([0-9A-Fa-f]{4}),/g)?.map(hex => hex.substring(2, 6)) ?? [];
      const imageDimensions = fileContent.match(/, ([0-9]+)x([0-9]+)@2/) ?? [0, 0];
      const mapDimensions = fileContent.match(/, not compressed, ([0-9]+)x([0-9]+)/) ?? [0, 0];
      const meta = {
        tilesCount: tilesData.length / 4,
        imageHeight: imageDimensions[2] as number,
        imageWidth: imageDimensions[1] as number,
        mapHeight: mapDimensions[2] as number,
        mapWidth: mapDimensions[1] as number,
        mapReduceFlipped: imageConfigFileToBeConverted.config.map.reduce.flipped,
        mapReduceUnique: imageConfigFileToBeConverted.config.map.reduce.unique,
        animation: {
          ...imageConfigFileToBeConverted.config.animation,
          largestFrame: 0
        },
      };
      imageConfigFileToBeConverted.output.push({
        name: name[1],
        fileUri,
        tilesData,
        mapData,
        meta,
        frameTileOffsets: [],
      });
    }));

    return imageConfigFileToBeConverted;
  }

  protected reportConverted(convertedImageUri: URI): void {
    this.pushLog({
      timestamp: Date.now(),
      text: `Created ${convertedImageUri.path.base}`,
      type: ImageConverterLogLineType.Normal,
      uri: convertedImageUri,
    });

    this.leftToConvert--;
    this.progress = Math.ceil((this.totalToConvert - this.leftToConvert) * 100 / this.totalToConvert);

  }

  protected async getGeneratedFiles(imageConfigFileToBeConverted: ImageConfigFileToBeConverted): Promise<Array<URI>> {
    const generatedFiles: Array<URI> = [];

    imageConfigFileToBeConverted.images.map(imageUri => {
      generatedFiles.push(this.getGritGeneratedFileUri(imageConfigFileToBeConverted.imageConfigFileUri, imageUri));
    });

    // there might be a separate file containing only tiles
    if (imageConfigFileToBeConverted.config.tileset.shared) {
      const filename = imageConfigFileToBeConverted.config.name
        ? imageConfigFileToBeConverted.config.name
        : imageConfigFileToBeConverted.imageConfigFileUri.path.name;
      const tilesetFileUri = imageConfigFileToBeConverted.imageConfigFileUri.parent
        .resolve(this.getConvertedDirName())
        .resolve(`${filename}.c`);
      if (await this.fileService.exists(tilesetFileUri)) {
        generatedFiles.push(tilesetFileUri);
      }
    }

    return generatedFiles;
  }

  protected getGritGeneratedFileUri(imageConfigFileUri: URI, imageUri: URI): URI {
    return imageConfigFileUri.parent
      .resolve(this.getConvertedDirName())
      .resolve(`${imageUri.path.name}.c`);
  }

  protected getGeneratedAssetFileUri(imageConfigFileUri: URI, imageUri: URI): URI {
    return imageConfigFileUri.parent
      .resolve(this.getConvertedDirName())
      .resolve(`${imageUri.path.name}.${CONVERTED_FILE_ENDING}`);
  }

  protected async handleCompression(imageConfigFileToBeConverted: ImageConfigFileToBeConverted): Promise<ImageConfigFileToBeConverted> {
    if (imageConfigFileToBeConverted.config.tileset.compress !== false) {
      imageConfigFileToBeConverted.output.map(output => {
        const compressionResult = compressTiles(
          output.tilesData,
          imageConfigFileToBeConverted.config.tileset.compress as ImageConverterCompressor,
          imageConfigFileToBeConverted.config.animation
        );

        output.meta.tilesCompressionRatio = compressionResult.compressionRatio;
        // discard compression results if they're larger than the original size
        if (compressionResult.compressionRatio < 0 ||
          (imageConfigFileToBeConverted.config.animation.isAnimation &&
            imageConfigFileToBeConverted.config.animation.individualFiles)) {
          output.tilesData = compressionResult.tilesData;
          output.frameTileOffsets = compressionResult.frameTileOffsets;
        }
      });
    }

    if (imageConfigFileToBeConverted.config.map.compress !== false) {
      // TODO
    }

    return imageConfigFileToBeConverted;
  }

  /**
   * For unknown (and unnecessary) reasons, grit prepends an empty tile to a charset if there is none already.
   * We check if the empty tile is used and, if not, remove it and update the map indices accordingly.
   * Grit also appends an empty tile to maps with an odd number of chars, which we remove.
   */
  protected removeUnusedEmptyTileAddedByGrit(imageConfigFileToBeConverted: ImageConfigFileToBeConverted): ImageConfigFileToBeConverted {
    const hasTileSetFile = imageConfigFileToBeConverted.config.tileset.shared;
    const forceCleanup = imageConfigFileToBeConverted.config.map.generate
      && !imageConfigFileToBeConverted.config.map.reduce.flipped
      && !imageConfigFileToBeConverted.config.map.reduce.unique;

    // fix maps
    imageConfigFileToBeConverted.output.map(output => {
      if (output.mapData.length > output.meta.mapHeight * output.meta.mapWidth) {
        output.mapData.pop();
      }
    });

    const emptyCharIsUsed = () => hasTileSetFile && imageConfigFileToBeConverted.output.filter(output => output.mapData.includes('0000')).length;
    if (!imageConfigFileToBeConverted.config.map.generate || (!forceCleanup && emptyCharIsUsed())) {
      return imageConfigFileToBeConverted;
    }

    // remove empty tile at beginning of charset (0x00000000,0x00000000,0x00000000,0x00000000,) and decrement all map indices
    imageConfigFileToBeConverted.output.map(output => {
      if (!hasTileSetFile && !forceCleanup && output.mapData.includes('0000')) {
        return imageConfigFileToBeConverted;
      }

      output.tilesData.splice(0, 4);
      output.mapData = output.mapData.map(mapData => {
        const decreasedIntValue = parseInt(mapData, 16) - 1;
        return decreasedIntValue.toString(16).toUpperCase().padStart(4, '0000');
      });
      output.meta.tilesCount = output.meta.tilesCount - 1;
    });

    return imageConfigFileToBeConverted;
  }

  protected async getImageConfigFilesToBeConverted(changedOnly: boolean): Promise<Array<ImageConfigFileToBeConverted>> {
    await this.workspaceService.ready;
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0]?.resource;

    const imageConfigFilesToBeConverted: Array<ImageConfigFileToBeConverted> = [];
    const imageConfigFiles = await this.vesGlobService.find(await this.fileService.fsPath(workspaceRootUri), '**/*.image.json');
    for (const imageConfigFile of imageConfigFiles) {
      const imageConfigFileUri = new URI(imageConfigFile).withScheme('file');
      const config = await this.getConverterConfig(imageConfigFileUri);

      if (!this.validateImageConverterConfig(config, imageConfigFileUri)) {
        continue;
      }

      const name = config.name ? config.name : imageConfigFileUri.path.name;

      const images = await this.getRelevantImageFiles(changedOnly, imageConfigFileUri, config, name);
      if (images.length === 0) {
        // console.log(`No relevant images for ${imageConfigFileUri.path.base}`);
        continue;
      }

      const gritArguments = this.getGritArguments(name, config);

      imageConfigFilesToBeConverted.push({
        imageConfigFileUri,
        images,
        name,
        config,
        gritArguments,
        output: []
      });
    }

    return imageConfigFilesToBeConverted;
  }

  protected getTotalImagesToBeConverted(imageConfigFilesToBeConverted: Array<ImageConfigFileToBeConverted>): number {
    let totalImagesToBeConverted = 0;
    imageConfigFilesToBeConverted.map(imageConfigFileToBeConverted => {
      totalImagesToBeConverted += imageConfigFileToBeConverted.images.length;
    });

    return totalImagesToBeConverted;
  }

  protected async getRelevantImageFiles(changedOnly: boolean, imageConfigFileUri: URI, config: ImageConverterConfig, name: string): Promise<Array<URI>> {
    let foundImages: Array<URI> = [];
    await Promise.all(config.images.map(async image => {
      if (image === '.') {
        const resolved = await this.fileService.resolve(imageConfigFileUri.parent);
        if (resolved.children) {
          await Promise.all(resolved.children.map(async child => {
            if (child.name.endsWith('.png') && await this.fileService.exists(child.resource)) {
              foundImages.push(child.resource);
            }
          }));
        }
      } else {
        const fileUri = imageConfigFileUri.parent.resolve(image);
        if (image.endsWith('.png') && await this.fileService.exists(fileUri)) {
          foundImages.push(fileUri);
        }
      }
    }));

    // if changedOnly flag is set, remove files that have not been changed
    if (changedOnly) {
      foundImages = await this.getOnlyChangedImages(foundImages, config, imageConfigFileUri, name);
    }

    // remove duplicates and return
    return [...new Set(foundImages)];
  }

  protected async getOnlyChangedImages(
    foundImages: Array<URI>,
    config: ImageConverterConfig,
    imageConfigFileUri: URI,
    name: string,
  ): Promise<Array<URI>> {
    const imageConfigFileStat = await this.fileService.resolve(imageConfigFileUri, { resolveMetadata: true });
    if ((config.animation.isAnimation && config.animation.individualFiles) || config.tileset.shared) {
      if (!await this.atLeastOneFileNewerThanCollectiveConvertedFile(foundImages, imageConfigFileUri, imageConfigFileStat, name)) {
        return [];
      }
    } else {
      const changedImages: Array<URI> = [];
      await Promise.all(foundImages.map(async foundImage => {
        const foundImageStat = await this.fileService.resolve(foundImage, { resolveMetadata: true });
        const convertedFileUri = this.getGeneratedAssetFileUri(imageConfigFileUri, foundImage);
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

  protected async atLeastOneFileNewerThanCollectiveConvertedFile(
    files: Array<URI>,
    imageConfigFileUri: URI,
    imageConfigFileStat: FileStatWithMetadata,
    name: string): Promise<boolean> {
    const convertedFileUri = imageConfigFileUri.parent.resolve(this.getConvertedDirName()).resolve(`${name}.${CONVERTED_FILE_ENDING}`);
    if (!await this.fileService.exists(convertedFileUri)) {
      return true;
    }

    let atLeastOneFileNewer = false;
    const convertedFileStat = await this.fileService.exists(convertedFileUri)
      ? await this.fileService.resolve(convertedFileUri, { resolveMetadata: true })
      : undefined;
    await Promise.all(files.map(async file => {
      if (!atLeastOneFileNewer) {
        const fileStat = await this.fileService.resolve(file, { resolveMetadata: true });
        if (this.fileHasChanged(imageConfigFileStat, fileStat, convertedFileStat)) {
          atLeastOneFileNewer = true;
        }
      }
    }));

    return atLeastOneFileNewer;
  }

  protected async getConverterConfig(file: URI): Promise<ImageConverterConfig> {
    const fileContents = await this.fileService.readFile(file);
    const config = JSON.parse(fileContents.value.toString());
    const merged = deepmerge(DEFAULT_IMAGE_CONVERTER_CONFIG, config);

    if (!Array.isArray(merged.images) || !merged.images.length) {
      merged.images = ['.'];
    }

    return merged;
  }

  // check converter config for validity
  protected validateImageConverterConfig(config: ImageConverterConfig, imageConfigFileUri: URI): boolean {
    if (config.animation.isAnimation && !config.animation.individualFiles
      && config.animation.frameHeight * config.animation.frameWidth === 0) {
      this.pushLog({
        timestamp: Date.now(),
        text: `${this.labelProvider.getName(imageConfigFileUri)}: No frame dimensions specified for spritesheet animation.`,
        type: ImageConverterLogLineType.Error,
        uri: imageConfigFileUri
      });
      return false;
    }

    return true;
  }

  protected getGritArguments(name: string, config: ImageConverterConfig): Array<string> {
    const gritArguments = ['-fh!', '-ftc', '-gB2', '-p!'];

    if (config.tileset.reduce) {
      // TODO: what is this doing exactly?
      gritArguments.push('-mB16:hv_i11');
    } else {
      gritArguments.push('-mB16:i11');
    }

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
      gritArguments.push(name);
    }

    return gritArguments;
  }

  /**
   * Give executables respective permission on UNIX systems.
   * Must be executed before every run to ensure permissions are right,
   * even right after reconfiguring paths.
   */
  async fixFilePermissions(gritUri: URI): Promise<void> {
    let command = 'chmod';
    let args = ['-R', 'a+x'];

    if (isWindows) {
      if (this.vesCommonService.isWslInstalled) {
        command = 'wsl.exe';
        args = ['chmod'].concat(args);
      } else {
        return;
      }
    }

    await this.vesProcessService.launchProcess(VesProcessType.Raw, {
      command,
      args: args.concat(await this.fileService.fsPath(gritUri)),
    });
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
          type: ImageConverterLogLineType.Done,
        });
        this.pushLog({
          timestamp: Date.now(),
          text: '',
          type: ImageConverterLogLineType.Normal,
        });
      }
    });
  }
}
