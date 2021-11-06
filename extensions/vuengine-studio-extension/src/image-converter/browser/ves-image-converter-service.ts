import * as glob from 'glob';
import { deepmerge } from 'deepmerge-ts';
import { basename, dirname, join as joinPath, parse as parsePath } from 'path';
import { Emitter, isOSX, isWindows } from '@theia/core';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { EnvVariablesServer } from '@theia/core/lib/common/env-variables';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import URI from '@theia/core/lib/common/uri';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { FileStatWithMetadata } from '@theia/filesystem/lib/common/files';
import { MemorySection } from '../../build/browser/ves-build-types';
import { VesCodegenService } from '../../codegen/browser/ves-codegen-service';
import { VesProcessService, VesProcessType } from '../../process/common/ves-process-service-protocol';
import { VesProcessWatcher } from '../../process/browser/ves-process-service-watcher';
import {
  FileContentsMap,
  ImageConfigFileToBeConverted,
  ImageConverterConfig,
  ImageConverterLogLine,
  ImageConverterLogLineType,
  StackedFrameData
} from './ves-image-converter-types';

@injectable()
export class VesImageConverterService {
  @inject(EnvVariablesServer)
  protected envVariablesServer: EnvVariablesServer;
  @inject(FileService)
  protected fileService: FileService;
  @inject(VesCodegenService)
  protected vesCodegenService: VesCodegenService;
  @inject(VesProcessService)
  protected vesProcessService: VesProcessService;
  @inject(VesProcessWatcher)
  protected readonly vesProcessWatcher: VesProcessWatcher;

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
    const imageConfigFilesToBeConverted = await this.getImageConfigFilesToBeConverted(changedOnly);

    if (imageConfigFilesToBeConverted.length === 0) {
      this.pushLog({
        timestamp: Date.now(),
        text: 'Did not find any images to convert',
        type: ImageConverterLogLineType.Headline,
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

    const gritPath = await this.getGritPath();
    await this.fixPermissions(gritPath);

    this.pushLog({
      timestamp: Date.now(),
      text: `Starting to convert ${changedOnly ? 'changed' : 'all'} images (${this.totalToConvert})`,
      type: ImageConverterLogLineType.Headline,
    });

    imageConfigFilesToBeConverted.map(async imageConfigFileToBeConverted => {
      this.doConvertFile(imageConfigFileToBeConverted, gritPath);
    });

    return;
  }

  protected async doConvertFile(imageConfigFileToBeConverted: ImageConfigFileToBeConverted, gritPath: string): Promise<void> {
    const fileDir = dirname(imageConfigFileToBeConverted.imageConfigFile);
    const convertedDir = joinPath(fileDir, this.getConvertedDirName());
    const convertedDirUri = new URI(convertedDir);

    if (!(await this.fileService.exists(convertedDirUri))) {
      await this.fileService.createFolder(convertedDirUri);
    }

    const processInfo = await this.vesProcessService.launchProcess(VesProcessType.Raw, {
      command: gritPath,
      args: [
        ...imageConfigFileToBeConverted.images,
        ...imageConfigFileToBeConverted.gritArguments
      ],
      options: {
        cwd: convertedDir
      },
    });

    // wait for converting process to finish, then post process
    const exitListener = this.vesProcessWatcher.onExit(async ({ pId, event }) => {
      if (pId === processInfo.processManagerId) {
        if (imageConfigFileToBeConverted.config.converter.stackFrames) {
          await this.stackFrames(imageConfigFileToBeConverted);
        } else {
          await this.postProcessConvertedImages(imageConfigFileToBeConverted);
        }

        exitListener.dispose();
      }
    });
  }

  protected reportConverted(convertedImagePath: string): void {
    this.pushLog({
      timestamp: Date.now(),
      text: `Created ${basename(convertedImagePath)}`,
      type: ImageConverterLogLineType.Normal,
      uri: new URI(convertedImagePath),
    });

    this.leftToConvert--;
    this.progress = Math.ceil((this.totalToConvert - this.leftToConvert) * 100 / this.totalToConvert);

  }

  protected getGeneratedFiles(imageConfigFileToBeConverted: ImageConfigFileToBeConverted): Array<string> {
    const generatedFiles: Array<string> = [];

    imageConfigFileToBeConverted.images.map(imagePath => {
      generatedFiles.push(this.getGeneratedFile(imageConfigFileToBeConverted.imageConfigFile, imagePath));
    });

    return generatedFiles;
  }

  protected getGeneratedFile(imageConfigFile: string, imagePath: string): string {
    return joinPath(
      dirname(imageConfigFile),
      this.getConvertedDirName(),
      `${parsePath(imagePath).name}.c`
    );
  }

  protected async stackFrames(imageConfigFileToBeConverted: ImageConfigFileToBeConverted): Promise<void> {
    const generatedFiles = this.getGeneratedFiles(imageConfigFileToBeConverted);
    const name = imageConfigFileToBeConverted.config.name
      ? imageConfigFileToBeConverted.config.name
      : parsePath(imageConfigFileToBeConverted.imageConfigFile).name;
    const targetFileUri = new URI(joinPath(
      dirname(imageConfigFileToBeConverted.imageConfigFile),
      this.getConvertedDirName(),
      `${name}.c`
    ));
    const templateFileUri = new URI(joinPath(
      await this.getResourcesPath(),
      'templates',
      'stacked.c.nj',
    ));

    // read tile and map data from all converted files and find largest frame
    let largestFrame = 0;
    const numberOfFrames = generatedFiles.length;
    const frames: Array<StackedFrameData> = [];
    await Promise.all(generatedFiles.map(async file => {
      const fileUri = new URI(file);
      const fileContent = (await this.fileService.readFile(fileUri)).value.toString();

      const tiles = fileContent.match(/0x([0-9A-Fa-f]{8}),/g) ?? [];
      const maps = fileContent.match(/0x([0-9A-Fa-f]{4}),/g) ?? [];

      const numberOfTiles = tiles.length;
      if (numberOfTiles > largestFrame) {
        largestFrame = numberOfTiles;
      }

      frames.push({ filename: basename(file), tiles, maps });
    }));

    // pad all tiles and maps to largest frame's size
    frames.forEach((part, idx) => {
      frames[idx].tiles = Array.from({ ...part.tiles, length: largestFrame }, (v, i) => v || '0x00000000,');
    });

    // sort frames by filename
    frames.sort((a, b) => a.filename > b.filename && 1 || -1);

    this.vesCodegenService.writeTemplate(targetFileUri, templateFileUri, {
      name,
      largestFrame,
      numberOfFrames,
      frames,
      section: imageConfigFileToBeConverted.config.section,
    });

    // delete frame files and report done
    await Promise.all(generatedFiles.map(async file => {
      const fileUri = new URI(file);
      await this.fileService.delete(fileUri);
      this.reportConverted(file);
    }));
  }

  protected async postProcessConvertedImages(imageConfigFileToBeConverted: ImageConfigFileToBeConverted): Promise<void> {
    const generatedFiles = this.getGeneratedFiles(imageConfigFileToBeConverted);

    // write all file contents to map and clean on the way
    const fileContents: FileContentsMap = {};
    await Promise.all(generatedFiles.map(async file => {
      const fileUri = new URI(file);
      const fileContent = (await this.fileService.readFile(fileUri)).value.toString();
      fileContents[file] = this.cleanFileContent(fileContent, imageConfigFileToBeConverted.config.section);
    }));

    let tilesetFile = '';
    if (imageConfigFileToBeConverted.config.converter.tileset.shared) {
      const name = imageConfigFileToBeConverted.config.name
        ? imageConfigFileToBeConverted.config.name
        : parsePath(imageConfigFileToBeConverted.imageConfigFile).name;
      tilesetFile = joinPath(
        dirname(imageConfigFileToBeConverted.imageConfigFile),
        this.getConvertedDirName(),
        `${name}.c`
      );
      const tilesetFileContent = (await this.fileService.readFile(new URI(tilesetFile))).value.toString();
      fileContents[tilesetFile] = this.cleanFileContent(tilesetFileContent, imageConfigFileToBeConverted.config.section);
    }

    // remove prepended empty tile
    this.removeUnusedEmptyTilePrependedByGrit(fileContents, imageConfigFileToBeConverted, tilesetFile);

    // write back all contents to files
    await Promise.all(Object.keys(fileContents).map(async file => {
      this.fileService.writeFile(new URI(file), BinaryBuffer.fromString(fileContents[file]));
      this.reportConverted(file);
    }));
  }

  protected cleanFileContent(fileContent: string, section: MemorySection): string {
    // remove "time-stamp"
    fileContent = fileContent.split('\n').filter(line => line.indexOf('Time-stamp:') === -1).join('\n');

    // remove "external tile file"
    fileContent = fileContent.split('\n').filter(line => line.indexOf('External tile file: (null)') === -1).join('\n');

    // remove block comments
    fileContent = fileContent.split('\n').filter(line =>
      line.indexOf('//{{BLOCK(') === -1 && line.indexOf('//}}BLOCK(') === -1
    ).join('\n');

    // fix types
    fileContent = fileContent
      .replace('const unsigned int', 'const uint32')
      .replace('const unsigned short', 'const uint16');

    // change memory section to exp if configured
    if (section === MemorySection.EXPANSION_SPACE) {
      fileContent = fileContent.replace(' __attribute__((aligned(4)))', ' __attribute__((aligned(4))) __attribute((section(".expdata")))');
    }
    // remove surrounding whitespaces and newlines
    fileContent = fileContent.trim() + '\n';

    return fileContent;
  }

  /**
   * For unknown (and unnecessary) reasons, grit prepends an empty tile to a charset if there is none already.
   * We check if the empty is used and, if not, remove it and update the map indices accordingly.
   */
  protected removeUnusedEmptyTilePrependedByGrit(fileContents: FileContentsMap, imageConfigFileToBeConverted: ImageConfigFileToBeConverted, tilesetFile: string): FileContentsMap {
    const hasTileSetFile = tilesetFile !== '';
    const forceCleanup = imageConfigFileToBeConverted.config.converter.map.generate
      && !imageConfigFileToBeConverted.config.converter.map.reduce.flipped
      && !imageConfigFileToBeConverted.config.converter.map.reduce.unique;

    const emptyCharIsUsed = () => hasTileSetFile && Object.values(fileContents).filter(fileContent => fileContent.includes('0x0000,')).length;
    if (!imageConfigFileToBeConverted.config.converter.map.generate || (!forceCleanup && emptyCharIsUsed())) {
      return fileContents;
    }

    Object.keys(fileContents).map(file => {
      let fileContent = fileContents[file];
      if (!hasTileSetFile && !forceCleanup && fileContent.includes('0x0000,')) {
        return;
      }

      if (fileContent.includes('Tiles[')) {
        // remove empty tile at beginning of charset
        fileContent = fileContent.replace('{\n\t0x00000000,0x00000000,0x00000000,0x00000000,', '{\n\t');

        // decrement reported tile count
        fileContent = fileContent.replace(/ (\d+) tiles/, (match, number) => match.replace(number, (parseInt(number) - 1).toString()));

        // decrease tile count in charset definition
        fileContent = fileContent.replace(/Tiles\[(\d+)\] /, (match, number) => match.replace(number, (parseInt(number) - 4).toString()));

        // decrease reported total size
        fileContent = fileContent.replace(/Total size: (\d+) /, (match, number) => match.replace(number, (parseInt(number) - 16).toString()));
        fileContent = fileContent.replace(/ = (\d+)/, (match, number) => match.replace(number, (parseInt(number) - 16).toString()));
      }

      if (fileContent.includes('Map[')) {
        // decrement all map indices
        fileContent = fileContent.replace(/0x([0-9A-Fa-f]{4}),/g, (match, number) => {
          let value = parseInt(number.replace(',', ''), 16);
          value = value > 0 ? value - 1 : value;
          return match.replace(number, value.toString(16).padStart(4, '0'));
        });

        // TODO: Grit also appends an empty tile to maps with an odd number of chars. Remove?
      }

      fileContents[file] = fileContent;
    });

    return fileContents;
  }

  protected async getImageConfigFilesToBeConverted(changedOnly: boolean): Promise<Array<ImageConfigFileToBeConverted>> {
    const workspaceRoot = this.getWorkspaceRoot();

    const imageConfigFilesToBeConverted: Array<ImageConfigFileToBeConverted> = [];

    // TODO: refactor to use fileservice instead of glob
    const fileMatcher = joinPath(workspaceRoot, '**', '*.image.json');
    await Promise.all(glob.sync(fileMatcher).map(async imageConfigFile => {
      const config = await this.getConverterConfig(new URI(imageConfigFile));
      const name = config.name ? config.name : parsePath(imageConfigFile).name;

      const images = await this.getRelevantImageFiles(changedOnly, imageConfigFile, config, name);
      if (images.length === 0) {
        // console.log(`No relevant images for ${imageConfigFile}`);
        return;
      }

      const gritArguments = this.getGritArguments(name, config, images);

      imageConfigFilesToBeConverted.push({ imageConfigFile, images, name, config, gritArguments });
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

  protected async getRelevantImageFiles(changedOnly: boolean, imageConfigFile: string, config: ImageConverterConfig, name: string): Promise<Array<string>> {
    let foundImages: Array<string> = [];
    const imageConfigFileDir = dirname(imageConfigFile);
    await Promise.all(config.images.map(async image => {
      if (image === '.') {
        const resolved = await this.fileService.resolve(new URI(imageConfigFileDir));
        if (resolved.children) {
          await Promise.all(resolved.children.map(async child => {
            if (child.name.endsWith('.png') && await this.fileService.exists(child.resource)) {
              foundImages.push(child.resource.path.toString());
            }
          }));
        }
      } else {
        const filepath = joinPath(imageConfigFileDir, image);
        if (image.endsWith('.png') && await this.fileService.exists(new URI(filepath))) {
          foundImages.push(filepath);
        }
      }
    }));

    // if changedOnly flag is set, remove files that have not been changed
    if (changedOnly) {
      foundImages = await this.getOnlyChangedImages(foundImages, config, imageConfigFile, imageConfigFileDir, name);
    }

    // remove duplicates and return
    return [...new Set(foundImages)];
  }

  protected async getOnlyChangedImages(
    foundImages: Array<string>,
    config: ImageConverterConfig,
    imageConfigFile: string,
    imageConfigFileDir: string,
    name: string,
  ): Promise<Array<string>> {
    if (config.converter.stackFrames || config.converter.tileset.shared) {
      if (!await this.atLeastOneImageNewerThanCollectiveConvertedFile(foundImages, imageConfigFileDir, name)) {
        return [];
      }
    } else {
      const changedImages: Array<string> = [];
      await Promise.all(foundImages.map(async foundImage => {
        const foundImageStat = await this.fileService.resolve(new URI(foundImage), { resolveMetadata: true });
        const convertedFile = this.getGeneratedFile(imageConfigFile, foundImage);
        const convertedFileStat = await this.fileService.resolve(new URI(convertedFile), { resolveMetadata: true });
        if (this.imageHasChanged(foundImageStat, convertedFileStat)) {
          changedImages.push(foundImage);
        }
      }));
      return changedImages;
    }

    return foundImages;
  }

  protected imageHasChanged(imageStat: FileStatWithMetadata, convertedFileStat: FileStatWithMetadata): boolean {
    // if an image has been edited (mtime) or has been moved or copied to this folder (ctime)
    // after the converted file has been generated/last edited, consider it a change
    return (imageStat.ctime > convertedFileStat.mtime || imageStat.mtime > convertedFileStat.mtime);
  }

  protected async atLeastOneImageNewerThanCollectiveConvertedFile(images: Array<string>, dir: string, name: string): Promise<boolean> {
    const convertedFile = new URI(joinPath(dir, this.getConvertedDirName(), `${name}.c`));
    if (!await this.fileService.exists(convertedFile)) {
      return true;
    }

    let atLeastOneImageNewer = false;
    const convertedFileStat = await this.fileService.resolve(convertedFile, { resolveMetadata: true });
    await Promise.all(images.map(async image => {
      if (!atLeastOneImageNewer) {
        const imageStat = await this.fileService.resolve(new URI(image), { resolveMetadata: true });
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

  protected getGritArguments(name: string, config: ImageConverterConfig, files: Array<string>): Array<string> {
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
  async fixPermissions(gritPath: string): Promise<void> {
    if (!isWindows) {
      if (await this.fileService.exists(new URI(gritPath))) {
        await this.vesProcessService.launchProcess(VesProcessType.Raw, {
          command: 'chmod',
          args: ['a+x', gritPath]
        });
      }
    }
  }

  protected getWorkspaceRoot(): string {
    const substrNum = isWindows ? 2 : 1;

    return window.location.hash.slice(-9) === 'workspace'
      ? dirname(window.location.hash.substring(substrNum))
      : window.location.hash.substring(substrNum);
  }

  protected getOs(): string {
    return isWindows ? 'win' : isOSX ? 'osx' : 'linux';
  }

  protected async getResourcesPath(): Promise<string> {
    const envVar = await this.envVariablesServer.getValue('THEIA_APP_PROJECT_PATH');
    const applicationPath = envVar && envVar.value ? envVar.value : '';
    return applicationPath;
  }

  protected async getGritPath(): Promise<string> {
    return joinPath(
      await this.getResourcesPath(),
      'binaries',
      'vuengine-studio-tools',
      this.getOs(),
      'grit',
      isWindows ? 'grit.exe' : 'grit'
    );
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

  // TODO: REMOVE ME AFTER CONVERTING ALL PROJECTS
  async convertSpecNames(): Promise<void> {
    console.log('Starting to search for spec names...');
    let matches: string[] = [];

    const workspaceRoot = this.getWorkspaceRoot();
    const fileMatcher = joinPath(workspaceRoot, '**', '*Spec.c');
    await Promise.all(glob.sync(fileMatcher).map(async specFile => {
      const specFileContent = (await this.fileService.readFile(new URI(specFile))).value.toString();
      matches = [...matches, ...specFileContent.match(/[\s\S]StageROMSpec ((?=.*_+)[xA-Z0-9_]*) \=/g)?.map(match => match.split(' ')[1]) ?? []];

      matches = [...matches, ...specFileContent.match(/[\s\S]extern ([a-zA-Z]*) ((?=.*_+)[xA-Z0-9_]*);/g)?.map(match => match.split(' ')[2].replace(';', '')) ?? []];
      matches = [...matches, ...specFileContent.match(/[\s\S]extern ([a-zA-Z]*) ((?=.*_+)[xA-Z0-9_]*)\[/g)?.map(match => match.split(' ')[2].replace('[', '')) ?? []];
      matches = [...matches, ...specFileContent.match(/[\s\S]([a-zA-Z]*)Spec ((?=.*_+)[xA-Z0-9_]*)\[/g)?.map(match => match.split(' ')[1].replace('[', '')) ?? []];
      matches = [...matches, ...specFileContent.match(/[\s\S]([a-zA-Z]*)Spec ((?=.*_+)[xA-Z0-9_]*) \=/g)?.map(match => match.split(' ')[1]) ?? []];
      matches = [...matches, ...specFileContent.match(/[\s\S]([a-zA-Z]*)Spec\* const ((?=.*_+)[xA-Z0-9_]*)\[/g)?.map(match => match.split(' ')[2].replace('[', '')) ?? []];
      matches = [...matches, ...specFileContent.match(/[\s\S]([a-zA-Z]*)ROM ((?=.*_+)[xA-Z0-9_]*) \=/g)?.map(match => match.split(' ')[1]) ?? []];
      matches = [...matches, ...specFileContent.match(/[\s\S]([a-zA-Z]*)ROM\* ((?=.*_+)[xA-Z0-9_]*)\[/g)?.map(match => match.split(' ')[1].replace('[', '')) ?? []];
    }));

    matches = [...new Set(matches)].sort((a, b) => a < b && 1 || -1);
    console.log(`Found ${matches.length} names`);

    const convertSpecName = (name: string): string => {
      name = name.replace('_AC_', '_');
      name = name.replace('_IM_', '_');
      name = name.replace('_SND_', '_SOUND_');
      name = name.replace('_STAGE_ST_', '_STAGE_');
      name = name.replace('_EN_ANIM', '_ENGLISH_ANIM');
      name = name.replace('_DE_ANIM', '_GERMAN_ANIM');
      name = name.replace('_ES_ANIM', '_SPANISH_ANIM');
      name = name.replace('_FR_ANIM', '_FRENCH_ANIM');
      name = name.replace('_JP_ANIM', '_JAPANESE_ANIM');

      if (name.endsWith('_ANIM')) { name = name.slice(0, -4) + 'ANIMATION'; }
      if (name.endsWith('_ANIMS')) { name = name.slice(0, -5) + 'ANIMATIONS'; }
      if (name.endsWith('_CH')) { name = name.slice(0, -2) + 'CHARSET'; }
      if (name.endsWith('_EN') || name.endsWith('_AC') || name.endsWith('_AG') || name.endsWith('_IM') || name.endsWith('_LB')) { name = name.slice(0, -2) + 'ENTITY'; }
      if (name.endsWith('_EP')) { name = name.slice(0, -2) + 'ENTRY_POINT'; }
      if (name.endsWith('_LV')) { name = name.slice(0, -3); }
      if (name.endsWith('_PS')) { name = name.slice(0, -2) + 'PARTICLE_SYSTEM'; }
      if (name.endsWith('_BHV')) { name = name.slice(0, -3) + 'BEHAVIORS'; }
      if (name.endsWith('_SND')) { name = name.slice(0, -3) + 'SOUND'; }
      if (name.endsWith('_SP')) { name = name.slice(0, -2) + 'SPRITE'; }
      if (name.endsWith('_SPS')) { name = name.slice(0, -3) + 'SPRITES'; }
      if (name.endsWith('_SHPS')) { name = name.slice(0, -4) + 'SHAPES'; }
      if (name.endsWith('_PHYS_PROP')) { name = name.slice(0, -9) + 'Physics'; }
      if (name.endsWith('_STAGE_ST')) { name = name.slice(0, -3); }
      if (name.endsWith('_TX')) { name = name.slice(0, -2) + 'TEXTURE'; }

      name = name.split('_').map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join('');

      name = name.replace('Vuengine', 'VUEngine');

      return name;
    };

    console.log('Starting to replace occurences in files...');
    const files = glob.sync(joinPath(workspaceRoot, '**', '*.*'));
    await Promise.all(files.map(async file => {
      if (file.includes('/build/')) {
        return;
      }

      const fileContentOriginal = (await this.fileService.readFile(new URI(file))).value.toString();
      let fileContentChanged = fileContentOriginal;

      matches.map(match => {
        const convertedSpecName = convertSpecName(match);
        fileContentChanged = fileContentChanged.replace(new RegExp(match, 'g'), convertedSpecName);
      });

      fileContentChanged = fileContentChanged.replace(new RegExp('__FONTS', 'g'), '_fonts');
      fileContentChanged = fileContentChanged.replace(new RegExp('__LANGUAGES', 'g'), '_languages');

      fileContentChanged = fileContentChanged.replace(new RegExp('_CHANNELS', 'g'), 'Channels');

      if (fileContentChanged !== fileContentOriginal) {
        await this.fileService.writeFile(new URI(file), BinaryBuffer.fromString(fileContentChanged));
      }
    }));

    console.log('DONE');
  }
}
