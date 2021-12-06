import { Emitter, isWindows } from '@theia/core';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStatWithMetadata } from '@theia/filesystem/lib/common/files';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { deepmerge } from 'deepmerge-ts';
import * as glob from 'glob';
import { join } from 'path';
import { VesCommonService } from '../../branding/browser/ves-common-service';
import { MemorySection } from '../../build/browser/ves-build-types';
import { VesCodeGenService } from '../../codegen/browser/ves-codegen-service';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import { VesProcessService, VesProcessType } from '../../process/common/ves-process-service-protocol';
import { ImageConfigFileToBeConverted, ImageConverterCompressor, ImageConverterConfig, ImageConverterLogLine, ImageConverterLogLineType } from './ves-image-converter-types';

@injectable()
export class VesImageConverterService {
  @inject(FileService)
  protected fileService: FileService;
  @inject(VesCodeGenService)
  protected vesCodeGenService: VesCodeGenService;
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
      text: `Convert ${changedOnly ? 'changed' : 'all'} images`,
      type: ImageConverterLogLineType.Headline,
    });

    const imageConfigFilesToBeConverted = await this.getImageConfigFilesToBeConverted(changedOnly);

    if (imageConfigFilesToBeConverted.length === 0) {
      this.pushLog({
        timestamp: Date.now(),
        text: 'None found',
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
      text: `Found ${this.totalToConvert} images`,
      type: ImageConverterLogLineType.Normal,
    });

    const gritUri = await this.getGritUri();
    await this.fixPermissions(gritUri);

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
    const exitListener = this.vesProcessWatcher.onDidExitProcess(async ({ pId }) => {
      if (pId === processInfo.processManagerId) {
        imageConfigFileToBeConverted = await this.appendConvertedFilesData(imageConfigFileToBeConverted);
        imageConfigFileToBeConverted = this.removeUnusedEmptyTileAddedByGrit(imageConfigFileToBeConverted);

        // TODO: this can only be done at this point for stacked frames when they no longer need to be padded to the same size
        imageConfigFileToBeConverted = await this.compress(imageConfigFileToBeConverted);

        if (imageConfigFileToBeConverted.config.converter.stackFrames) {
          await this.stackFrames(imageConfigFileToBeConverted);
        } else {
          // render files, overwrite original converted ones
          const resourcesUri = await this.vesCommonService.getResourcesUri();
          const templateFileUri = resourcesUri.resolve('templates').resolve('image.c.nj');
          const templateString = (await this.fileService.readFile(templateFileUri)).value.toString();
          await Promise.all(imageConfigFileToBeConverted.output.map(async output => {
            await this.vesCodeGenService.renderTemplateToFile(output.fileUri, templateString, {
              name: output.name,
              tilesData: output.tilesData,
              tilesCompression: imageConfigFileToBeConverted.config.converter.tileset.compress,
              mapData: output.mapData,
              mapCompression: imageConfigFileToBeConverted.config.converter.map.compress,
              section: imageConfigFileToBeConverted.config.section,
              meta: output.meta,
            });
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
      const tilesData = fileContent.match(/0x([0-9A-Fa-f]{8}),/g)?.map(hex => hex.substr(2, 8)) ?? [];
      const mapData = fileContent.match(/0x([0-9A-Fa-f]{4}),/g)?.map(hex => hex.substr(2, 4)) ?? [];
      const imageDimensions = fileContent.match(/, ([0-9]+)x([0-9]+)@2/) ?? [0, 0];
      const mapDimensions = fileContent.match(/, not compressed, ([0-9]+)x([0-9]+)/) ?? [0, 0];
      const meta = {
        tilesCount: tilesData.length / 4,
        imageHeight: imageDimensions[2] as number,
        imageWidth: imageDimensions[1] as number,
        mapHeight: mapDimensions[2] as number,
        mapWidth: mapDimensions[1] as number,
        mapReduceFlipped: imageConfigFileToBeConverted.config.converter.map.reduce.flipped,
        mapReduceUnique: imageConfigFileToBeConverted.config.converter.map.reduce.unique,
      };
      imageConfigFileToBeConverted.output.push({ name: name[1], fileUri, tilesData, mapData, meta });
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
      generatedFiles.push(this.getGeneratedFileUri(imageConfigFileToBeConverted.imageConfigFileUri, imageUri));
    });

    // there might be a separate file containing only tiles
    if (imageConfigFileToBeConverted.config.converter.tileset.shared) {
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

  protected getGeneratedFileUri(imageConfigFileUri: URI, imageUri: URI): URI {
    return imageConfigFileUri.parent
      .resolve(this.getConvertedDirName())
      .resolve(`${imageUri.path.name}.c`);
  }

  protected async stackFrames(imageConfigFileToBeConverted: ImageConfigFileToBeConverted): Promise<void> {
    const name = imageConfigFileToBeConverted.config.name
      ? imageConfigFileToBeConverted.config.name
      : imageConfigFileToBeConverted.imageConfigFileUri.path.name;
    const targetFileUri = imageConfigFileToBeConverted.imageConfigFileUri.parent
      .resolve(this.getConvertedDirName())
      .resolve(`${name}.c`);
    const resourcesUri = await this.vesCommonService.getResourcesUri();
    const templateFileUri = resourcesUri.resolve('templates').resolve('image.c.nj');

    // find largest frame
    let largestFrame = 0;
    const numberOfFrames = imageConfigFileToBeConverted.output.filter(output => output.mapData.length > 0).length;
    imageConfigFileToBeConverted.output.map(async output => {
      const numberOfTiles = output.tilesData.length;
      if (numberOfTiles > largestFrame) {
        largestFrame = numberOfTiles;
      }
    });

    // pad all tiles and maps to largest frame's size
    imageConfigFileToBeConverted.output.map(async output => {
      output.tilesData = Array.from({ ...output.tilesData, length: largestFrame }, (v, i) => v || '00000000');
    });

    // sort frames by filename
    imageConfigFileToBeConverted.output.sort((a, b) => a.fileUri.path.base > b.fileUri.path.base && 1 || -1);

    // delete frame files and report done
    await Promise.all(imageConfigFileToBeConverted.output.map(async output => {
      await this.fileService.delete(output.fileUri);
      this.reportConverted(output.fileUri);
    }));

    let tilesData: Array<string> = [];
    let mapData: Array<string> = [];
    imageConfigFileToBeConverted.output.map(output => {
      tilesData = tilesData.concat(output.tilesData);
      mapData = mapData.concat(output.mapData);
    });

    // render stacked file
    const templateString = (await this.fileService.readFile(templateFileUri)).value.toString();
    this.vesCodeGenService.renderTemplateToFile(targetFileUri, templateString, {
      name,
      tilesData,
      tilesCompression: imageConfigFileToBeConverted.config.converter.tileset.compress,
      mapData,
      mapCompression: imageConfigFileToBeConverted.config.converter.map.compress,
      section: imageConfigFileToBeConverted.config.section,
      meta: {
        ...imageConfigFileToBeConverted.output[0].meta,
        numberOfFrames,
        largestFrame,
      },
    });
  }

  protected async compress(imageConfigFileToBeConverted: ImageConfigFileToBeConverted): Promise<ImageConfigFileToBeConverted> {
    if (imageConfigFileToBeConverted.config.converter.tileset.compress === ImageConverterCompressor.RLE) {
      imageConfigFileToBeConverted = this.compressTilesRle(imageConfigFileToBeConverted);
    }
    if (imageConfigFileToBeConverted.config.converter.map.compress === ImageConverterCompressor.RLE) {
      imageConfigFileToBeConverted = this.compressMapRle(imageConfigFileToBeConverted);
    }

    return imageConfigFileToBeConverted;
  }

  // Normal RLE applied to pixel pairs (4 bits or 1 hexadecimal digit)
  protected compressTilesRle(imageConfigFileToBeConverted: ImageConfigFileToBeConverted): ImageConfigFileToBeConverted {
    const addToCompressedData = () => {
      currentBlock += (counter - 1).toString(16).toUpperCase() + previousDigit;

      if (currentBlock.length === 8) {
        compressedData.push(currentBlock);
        currentBlock = '';
      }

      previousDigit = '';
      counter = 0;
    };

    let uncompressedLength = 0;
    let compressedData: Array<string> = [];
    let currentBlock = '';
    let counter = 0;
    let previousDigit = '';

    imageConfigFileToBeConverted.output.map(output => {
      uncompressedLength = output.tilesData.length;
      compressedData = [];
      // currentBlock = '01'; // initialize with a custom compression algorithm flag, 01 meaning RLE
      currentBlock = '';
      counter = 0;
      previousDigit = '';

      output.tilesData.map(tileData => {
        for (const digit of tileData) {
          if (digit === previousDigit) {
            if (++counter === 16) {
              addToCompressedData();
            }
          } else {
            if (previousDigit !== '') {
              addToCompressedData();
            }
            previousDigit = digit;
            counter = 1;
          }
        }
      });

      if (counter > 0) {
        addToCompressedData();
        compressedData.push(currentBlock.padEnd(8, '0'));
      }

      output.tilesData = compressedData;
      output.meta.tilesCompressionRatio = (100 - ((uncompressedLength - compressedData.length) / uncompressedLength * 100)).toFixed(2);
    });

    return imageConfigFileToBeConverted;
  }

  protected compressMapRle(imageConfigFileToBeConverted: ImageConfigFileToBeConverted): ImageConfigFileToBeConverted {
    return imageConfigFileToBeConverted;
  }

  /**
   * For unknown (and unnecessary) reasons, grit prepends an empty tile to a charset if there is none already.
   * We check if the empty tile is used and, if not, remove it and update the map indices accordingly.
   * Grit also appends an empty tile to maps with an odd number of chars, which we remove.
   */
  protected removeUnusedEmptyTileAddedByGrit(imageConfigFileToBeConverted: ImageConfigFileToBeConverted): ImageConfigFileToBeConverted {
    const hasTileSetFile = imageConfigFileToBeConverted.config.converter.tileset.shared;
    const forceCleanup = imageConfigFileToBeConverted.config.converter.map.generate
      && !imageConfigFileToBeConverted.config.converter.map.reduce.flipped
      && !imageConfigFileToBeConverted.config.converter.map.reduce.unique;

    // fix maps
    imageConfigFileToBeConverted.output.map(output => {
      if (output.mapData.length > output.meta.mapHeight * output.meta.mapWidth) {
        output.mapData.pop();
      }
    });

    const emptyCharIsUsed = () => hasTileSetFile && imageConfigFileToBeConverted.output.filter(output => output.mapData.includes('0000')).length;
    if (!imageConfigFileToBeConverted.config.converter.map.generate || (!forceCleanup && emptyCharIsUsed())) {
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
    const workspaceRootUri = this.workspaceService.tryGetRoots()[0].resource;

    const imageConfigFilesToBeConverted: Array<ImageConfigFileToBeConverted> = [];

    // TODO: refactor to use fileservice instead of glob
    const fileMatcher = join(await this.fileService.fsPath(workspaceRootUri), '**', '*.image.json');
    await Promise.all(glob.sync(fileMatcher).map(async imageConfigFile => {
      const imageConfigFileUri = new URI(imageConfigFile).withScheme('file');
      const config = await this.getConverterConfig(imageConfigFileUri);
      const name = config.name ? config.name : imageConfigFileUri.path.name;

      const images = await this.getRelevantImageFiles(changedOnly, imageConfigFileUri, config, name);
      if (images.length === 0) {
        // console.log(`No relevant images for ${imageConfigFileUri.path.base}`);
        return;
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
    }));

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
    if (config.converter.stackFrames || config.converter.tileset.shared) {
      if (!await this.atLeastOneImageNewerThanCollectiveConvertedFile(foundImages, imageConfigFileUri, name)) {
        return [];
      }
    } else {
      const changedImages: Array<URI> = [];
      await Promise.all(foundImages.map(async foundImage => {
        const foundImageStat = await this.fileService.resolve(foundImage, { resolveMetadata: true });
        const convertedFileUri = this.getGeneratedFileUri(imageConfigFileUri, foundImage);
        const convertedFileStat = await this.fileService.exists(convertedFileUri)
          ? await this.fileService.resolve(convertedFileUri, { resolveMetadata: true })
          : undefined;
        if (this.imageHasChanged(foundImageStat, convertedFileStat)) {
          changedImages.push(foundImage);
        }
      }));
      return changedImages;
    }

    return foundImages;
  }

  protected imageHasChanged(imageStat: FileStatWithMetadata, convertedFileStat?: FileStatWithMetadata): boolean {
    // if an image has been edited (mtime) or has been moved or copied to this folder (ctime)
    // after the converted file has been generated/last edited, consider it a change
    return (!convertedFileStat || imageStat.ctime > convertedFileStat.mtime || imageStat.mtime > convertedFileStat.mtime);
  }

  protected async atLeastOneImageNewerThanCollectiveConvertedFile(images: Array<URI>, imageConfigFileUri: URI, name: string): Promise<boolean> {
    const convertedFileUri = imageConfigFileUri.parent.resolve(this.getConvertedDirName()).resolve(`${name}.c`);
    if (!await this.fileService.exists(convertedFileUri)) {
      return true;
    }

    let atLeastOneImageNewer = false;
    const convertedFileStat = await this.fileService.exists(convertedFileUri)
      ? await this.fileService.resolve(convertedFileUri, { resolveMetadata: true })
      : undefined;
    await Promise.all(images.map(async image => {
      if (!atLeastOneImageNewer) {
        const imageStat = await this.fileService.resolve(image, { resolveMetadata: true });
        if (this.imageHasChanged(imageStat, convertedFileStat)) {
          atLeastOneImageNewer = true;
        }
      }
    }));

    return atLeastOneImageNewer;
  }

  protected async getConverterConfig(file: URI): Promise<ImageConverterConfig> {
    const fileContents = await this.fileService.readFile(file);
    const config = JSON.parse(fileContents.value.toString());

    const defaultConverterConfig = {
      images: [],
      converter: {
        tileset: {
          shared: false,
          reduce: true
        },
        map: {
          generate: true,
          reduce: {
            flipped: true,
            unique: true
          }
        },
        stackFrames: false
      },
      name: '',
      section: MemorySection.ROM
    };

    const merged = deepmerge(defaultConverterConfig, config);

    if (!Array.isArray(merged.images) || !merged.images.length) {
      merged.images = ['.'];
    }

    return merged;
  }

  protected getGritArguments(name: string, config: ImageConverterConfig): Array<string> {
    const gritArguments = ['-fh!', '-ftc', '-gB2', '-p!'];

    if (config.converter.tileset.reduce) {
      gritArguments.push('-mB16:hv_i11');
    } else {
      gritArguments.push('-mB16:i11');
    }

    if (config.converter.map.generate) {
      if (config.converter.map.reduce.flipped || config.converter.map.reduce.unique) {
        let mapReduceArg = '-mR';
        if (config.converter.map.reduce.unique) {
          mapReduceArg += 't';
        }
        if (config.converter.map.reduce.flipped) {
          mapReduceArg += 'f';
        }
        gritArguments.push(mapReduceArg);
      } else {
        gritArguments.push('-mR!');
      }
    } else {
      gritArguments.push('-m!');
    }

    if (config.converter.tileset.shared) {
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
  async fixPermissions(gritUri: URI): Promise<void> {
    if (!isWindows) {
      if (await this.fileService.exists(gritUri)) {
        await this.vesProcessService.launchProcess(VesProcessType.Raw, {
          command: 'chmod',
          args: ['a+x', await this.fileService.fsPath(gritUri)]
        });
      }
    }
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
          text: 'Done',
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
