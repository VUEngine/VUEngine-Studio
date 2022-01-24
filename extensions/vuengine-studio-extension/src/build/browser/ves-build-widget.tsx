import { CommandService, isWindows } from '@theia/core';
import { KeybindingRegistry, Message, PreferenceScope, PreferenceService } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { EditorManager } from '@theia/editor/lib/browser';
import { FileDialogService, OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesCommonService } from '../../branding/browser/ves-common-service';
import { VesDocumentationCommands } from '../../documentation/browser/ves-documentation-commands';
import { VesEmulatorCommands } from '../../emulator/browser/ves-emulator-commands';
import { VesExportCommands } from '../../export/browser/ves-export-commands';
import { VesFlashCartCommands } from '../../flash-cart/browser/ves-flash-cart-commands';
import { VesPluginsPreferenceIds } from '../../plugins/browser/ves-plugins-preferences';
import { VesBuildCommands } from './ves-build-commands';
import { VesBuildPreferenceIds } from './ves-build-preferences';
import { VesBuildService } from './ves-build-service';
import { BuildLogLine, BuildLogLineFileLink, BuildLogLineType, BuildMode, BuildResult } from './ves-build-types';

interface VesBuildWidgetState {
  logFilter: BuildLogLineType
  timerInterval: NodeJS.Timer | undefined
  outputRomExists: boolean
  autoScroll: boolean
}

@injectable()
export class VesBuildWidget extends ReactWidget {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(FileService)
  private readonly fileService: FileService;
  @inject(FileDialogService)
  private readonly fileDialogService: FileDialogService;
  @inject(EditorManager)
  private readonly editorManager: EditorManager;
  @inject(KeybindingRegistry)
  protected readonly keybindingRegistry!: KeybindingRegistry;
  @inject(PreferenceService)
  private readonly preferenceService: PreferenceService;
  @inject(VesBuildService)
  private readonly vesBuildService: VesBuildService;
  @inject(VesCommonService)
  private readonly vesCommonService: VesCommonService;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  static readonly ID = 'vesBuildWidget';
  static readonly LABEL = VesBuildCommands.BUILD.label || 'Build';

  protected state: VesBuildWidgetState = {
    logFilter: BuildLogLineType.Normal,
    timerInterval: undefined,
    outputRomExists: false,
    autoScroll: true,
  };

  protected buildLogLastElementRef = React.createRef<HTMLDivElement>();

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    if (this.state.autoScroll) {
      this.buildLogLastElementRef.current?.scrollIntoView();
    }
  }

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesBuildWidget.ID;
    this.title.iconClass = 'codicon codicon-tools';
    this.title.closable = true;
    this.title.label = VesBuildWidget.LABEL;
    this.title.caption = VesBuildWidget.LABEL;
    this.node.tabIndex = 0; // required for this.node.focus() to work in this.onActivateRequest()
    this.title.className = '';
    this.state.outputRomExists = await this.vesBuildService.outputRomExists();

    this.update();
    this.bindEvents();
  }

  protected bindEvents(): void {
    this.vesBuildService.onDidChangeIsCleaning(() => this.update());
    this.vesBuildService.onDidChangeIsQueued(isQueued => this.title.className = isQueued ? 'ves-decorator-queued' : '');
    this.vesBuildService.onDidChangeRomSize(() => this.update());
    this.vesBuildService.onDidChangeBuildStatus(() => this.update());
    this.vesBuildService.onDidChangeBuildMode(() => this.update());
    this.vesBuildService.onDidStartBuild(() => {
      this.startTimerInterval();
      this.state.logFilter = BuildLogLineType.Normal;
      this.title.className = 'ves-decorator-progress';
    });
    this.vesBuildService.onDidSucceedBuild(async () => {
      this.stopTimerInterval();
      this.title.className = this.vesBuildService.getNumberOfWarnings() > 0
        ? 'ves-decorator-warning'
        : 'ves-decorator-success';
      this.state.outputRomExists = await this.vesBuildService.outputRomExists();
      this.update();
    });
    this.vesBuildService.onDidFailBuild(async () => {
      this.stopTimerInterval();
      this.title.className = 'ves-decorator-error';
      this.state.outputRomExists = await this.vesBuildService.outputRomExists();
      this.update();
    });
    this.preferenceService.onPreferenceChanged(({ preferenceName }) => {
      switch (preferenceName) {
        case VesBuildPreferenceIds.BUILD_MODE:
        case VesBuildPreferenceIds.DUMP_ELF:
        case VesBuildPreferenceIds.ENGINE_CORE_PATH:
        case VesPluginsPreferenceIds.ENGINE_PLUGINS_PATH:
        case VesPluginsPreferenceIds.USER_PLUGINS_PATH:
        case VesBuildPreferenceIds.PEDANTIC_WARNINGS:
          this.update();
          break;
      }
    });
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.update();
    this.node.focus();
  }

  // TODO: allow queueing run, flash and export
  protected render(): React.ReactNode {
    const buildMode = this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE) as BuildMode;
    return (
      <>
        <div className='buildActions'>
          {this.vesBuildService.buildStatus.active &&
            this.vesBuildService.buildStatus.progress > -1 && (
              <div className='buildPanel'>
                <div className={`vesProgressBar ${this.vesBuildService.getNumberOfWarnings() > 0 && 'withWarnings'}`}>
                  <div style={{ width: this.vesBuildService.buildStatus.progress + '%' }}></div>
                  <span>
                    {this.vesBuildService.buildStatus.progress === 100 ? (
                      <>
                        <i className='fa fa-check'></i> Done
                      </>
                    ) : (
                      <>{this.vesBuildService.buildStatus.progress}%</>
                    )}
                  </span>
                </div>
              </div>
            )}
          {!this.vesBuildService.buildStatus.active && (
            <>
              <div className='buildButtons'>
                <button
                  className='theia-button large build'
                  disabled={!this.workspaceService.opened}
                  onClick={this.build}
                >
                  Build
                </button>
              </div>
            </>
          )}
          <div className='buildButtons'>
            <button
              className='theia-button secondary'
              disabled={!this.vesBuildService.buildStatus.active}
              onClick={this.abort}
              title="Abort build"
            >
              <i className='fa fa-ban'></i>
            </button>
            <button
              className='theia-button secondary'
              disabled={this.vesBuildService.buildStatus.active || !this.state.outputRomExists}
              onClick={this.run}
              title={`${VesEmulatorCommands.RUN.label}${this.getKeybindingLabel(VesEmulatorCommands.RUN.id, true)}`}
            >
              <i className='fa fa-play'></i>
            </button>
            <button
              className='theia-button secondary'
              disabled={this.vesBuildService.buildStatus.active || !this.state.outputRomExists}
              onClick={this.flash}
              title={`${VesFlashCartCommands.FLASH.label}${this.getKeybindingLabel(VesFlashCartCommands.FLASH.id, true)}`}
            >
              <i className='fa fa-microchip'></i>
            </button>
            <button
              className='theia-button secondary'
              disabled={this.vesBuildService.buildStatus.active || !this.state.outputRomExists}
              onClick={this.export}
              title={`${VesExportCommands.EXPORT.label}${this.getKeybindingLabel(VesExportCommands.EXPORT.id, true)}`}
            >
              <i className='fa fa-share-square-o'></i>
            </button>
            <button
              className='theia-button secondary'
              disabled={this.vesBuildService.buildStatus.active || !this.vesBuildService.buildFolderExists[buildMode]}
              onClick={this.clean}
              title={`${VesBuildCommands.CLEAN.label}${this.getKeybindingLabel(VesBuildCommands.CLEAN.id, true)}`}
            >
              <i className='fa fa-trash'></i>
            </button>
          </div>
          {isWindows && !this.vesCommonService.isWslInstalled && (
            <div>
              <i className='fa fa-exclamation-triangle'></i> Please consider <a href='#' onClick={this.openWslDocs}>installing WSL</a> to massively improve build times.
            </div>
          )}
        </div>
        <div className='buildMeta'>
          {this.vesBuildService.buildStatus.log.length > 0 && (
            <div className='buildStatus'>
              {this.vesBuildService.buildStatus.active ? (
                <div>
                  <i className='fa fa-cog fa-spin'></i>{' '}
                  {this.vesBuildService.buildStatus.step}...
                </div>
              ) : this.vesBuildService.buildStatus.step === BuildResult.done ? (
                <div className={this.vesBuildService.getNumberOfWarnings() > 0 ? 'warning' : 'success'}>
                  {this.vesBuildService.getNumberOfWarnings() > 0
                    ? <><i className='fa fa-exclamation-triangle'></i> Build successful (with warnings)</>
                    : <><i className='fa fa-check'></i> Build successful</>}
                  {this.vesBuildService.getNumberOfWarnings() > 0 && ''}
                </div>
              ) : (
                <div className='error'>
                  <i className='fa fa-times-circle-o'></i> Build{' '}
                  {this.vesBuildService.buildStatus.step}
                </div>
              )}
              <div className='buildStatusMeta'>
                <span><i className='fa fa-clock-o'></i> {this.getDuration()}</span>
                <span><i className='fa fa-wrench'></i> {this.vesBuildService.buildStatus.buildMode}</span>
                {this.vesBuildService.buildStatus.active && this.vesBuildService.buildStatus.processId > 0 &&
                  <span><i className='fa fa-terminal'></i> PID {this.vesBuildService.buildStatus.processId}</span>}
                {this.vesCommonService.isWslInstalled &&
                  <span><i className='fa fa-linux'></i> WSL</span>}
                {!this.vesBuildService.buildStatus.active && this.vesBuildService.romSize > 0 &&
                  <span><i className='fa fa-microchip'></i> {this.vesBuildService.bytesToMbit(this.vesBuildService.romSize)} MBit</span>}
              </div>
            </div>
          )}
        </div>
        <div
          className={
            this.state.logFilter !== BuildLogLineType.Normal
              ? `buildLogWrapper filter${this.state.logFilter
                .charAt(0)
                .toUpperCase()}${this.state.logFilter.slice(1)}`
              : 'buildLogWrapper'
          }
        >
          {this.vesBuildService.buildStatus.log.length > 0 && (
            <div className='buildLog'>
              <div>
                {this.vesBuildService.buildStatus.log.map(
                  // TODO: context menu with option to copy (full) error message
                  (line: BuildLogLine, index: number) => (
                    line.text !== ''
                      ? <div
                        className={`buildLogLine ${line.type}${line.file ? ' hasFileLink' : ''}`}
                        key={`buildLogLine${index}`}
                        onClick={e => this.openFile(e, line.file)}
                        title={`${new Date(line.timestamp).toTimeString().substr(0, 8)} ${line.text}`}
                      >
                        <span className='icon'>
                          {line.type === BuildLogLineType.Error
                            ? <i className='codicon codicon-error' />
                            : line.type === BuildLogLineType.Warning
                              ? <i className='codicon codicon-warning' />
                              : line.type === BuildLogLineType.Headline
                                ? <i className='codicon codicon-info' />
                                : line.type === BuildLogLineType.Done
                                  ? <i className='codicon codicon-pass-filled' />
                                  : <></>}
                        </span>
                        <span className='text'>
                          {line.optimizedText ? line.optimizedText : line.text}
                        </span>
                      </div>
                      : <div className='buildLogLine' key={`buildLogLine${index}`}></div>
                  )
                )}
                <div ref={this.buildLogLastElementRef} key={'buildLogLineLast'}></div>
              </div>
            </div>
          )}
        </div>
        {this.vesBuildService.buildStatus.log.length > 0 && (
          <div className='buildLogButtons'>
            <button
              className="theia-button secondary"
              title='Toggle automatic scrolling'
              onClick={() => this.toggleAutoScroll()}
            >
              <i className={this.state.autoScroll
                ? 'fa fa-fw fa-long-arrow-down'
                : 'fa fa-fw fa-minus'
              }></i>
            </button>
            {/* TODO: allow to filter for both warnings AND problems */}
            <button
              className={
                this.state.logFilter === BuildLogLineType.Warning
                  ? 'theia-button'
                  : 'theia-button secondary'
              }
              title='Show only warnings'
              onClick={() => this.toggleFilter(BuildLogLineType.Warning)}
            >
              <i className='fa fa-exclamation-triangle'></i>{' '}
              {this.vesBuildService.getNumberOfWarnings()}
            </button>
            <button
              className={
                this.state.logFilter === BuildLogLineType.Error
                  ? 'theia-button'
                  : 'theia-button secondary'
              }
              title='Show only errors'
              onClick={() => this.toggleFilter(BuildLogLineType.Error)}
            >
              <i className='fa fa-times-circle-o'></i>{' '}
              {this.vesBuildService.getNumberOfErrors()}
            </button>
          </div>
        )}
        {/* <div className='buildSelector'>
          <select className='theia-select' title='Build'>
            <option value='latest'>
              {`✔ – ${new Date(
                          this.vesBuildService.buildStatus.log[0]?.timestamp
                        ).toUTCString()} – ${this.vesBuildService.buildStatus.buildMode}`}
            </option>
          </select>
        </div> */}
      </>
    );
  }

  protected startTimerInterval(): void {
    this.stopTimerInterval();
    const self = this;
    this.state.timerInterval = setInterval(() => {
      self.update();
    }, 1000);
  }

  protected stopTimerInterval(): void {
    if (this.state.timerInterval !== undefined) {
      clearInterval(this.state.timerInterval);
      this.state.timerInterval = undefined;
    }
  }

  protected getDuration(): string {
    const startDate = this.vesBuildService.buildStatus.startDate || new Date();
    const endDate = this.vesBuildService.buildStatus.endDate || startDate;
    const duration = endDate.getTime() - startDate.getTime();
    const durationDate = new Date(duration);

    return `${durationDate
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${durationDate
        .getSeconds()
        .toString()
        .padStart(2, '0')}`;
  }

  protected toggleFilter = (type: BuildLogLineType): void => {
    this.state.logFilter =
      this.state.logFilter !== type ? type : BuildLogLineType.Normal;
    this.update();
  };

  protected toggleAutoScroll = (): void => {
    this.state.autoScroll = !this.state.autoScroll;
    this.update();
  };

  protected selectFolder = async (title: string, preferenceId: string): Promise<void> => {
    const props: OpenFileDialogProps = {
      title,
      canSelectFolders: true,
      canSelectFiles: false
    };
    const destinationFolderUri = await this.fileDialogService.showOpenDialog(props);
    if (destinationFolderUri) {
      const destinationFolder = await this.fileService.resolve(destinationFolderUri);
      if (destinationFolder.isDirectory) {
        this.preferenceService.set(preferenceId, destinationFolder.resource.path.toString(), PreferenceScope.User);
      }
    }
  };

  protected openFile = async (e: React.MouseEvent, fileLink?: BuildLogLineFileLink): Promise<void> => {
    e.stopPropagation();
    e.preventDefault();

    if (fileLink) {
      const editorWidget = await this.editorManager.open(fileLink.uri, { mode: 'reveal' });
      editorWidget.editor.cursor = {
        line: fileLink.line > 0 ? fileLink.line - 1 : 0,
        character: fileLink.column > 0 ? fileLink.column - 1 : 0,
      };
      editorWidget.editor.revealPosition(editorWidget.editor.cursor);
    }
  };

  // TODO: move to common service
  protected getKeybindingLabel(
    commandId: string,
    wrapInBrackets: boolean = false
  ): string {
    const keybinding = this.keybindingRegistry.getKeybindingsForCommand(commandId)[0];
    let keybindingAccelerator = keybinding
      ? this.keybindingRegistry.acceleratorFor(keybinding, '+').join(', ')
      : '';

    keybindingAccelerator = keybindingAccelerator
      .replace(' ', 'Space');

    if (wrapInBrackets && keybindingAccelerator !== '') {
      keybindingAccelerator = ` (${keybindingAccelerator})`;
    }

    return keybindingAccelerator;
  }

  protected build = () => {
    this.state.logFilter = BuildLogLineType.Normal;
    this.commandService.executeCommand(VesBuildCommands.BUILD.id);
  };

  protected abort = async () => this.vesBuildService.abortBuild();
  protected run = () => this.commandService.executeCommand(VesEmulatorCommands.RUN.id);
  protected flash = () => this.commandService.executeCommand(VesFlashCartCommands.FLASH.id);
  protected export = () => this.commandService.executeCommand(VesExportCommands.EXPORT.id);
  protected clean = () => this.commandService.executeCommand(VesBuildCommands.CLEAN.id);

  protected openWslDocs = () => this.commandService.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id, 'setup/enhancing-build-times-on-windows', false);
}
