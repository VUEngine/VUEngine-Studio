import * as React from '@theia/core/shared/react';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { CommandService, isWindows } from '@theia/core';
import { Message, PreferenceScope, PreferenceService } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { FileDialogService, OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesPluginsPreferenceIds, VesPluginsPreferenceSchema } from '../../plugins/browser/ves-plugins-preferences';
import { VesBuildCommands } from './ves-build-commands';
import { BuildLogLine, BuildLogLineFileLink, BuildLogLineType, BuildMode, BuildResult } from './ves-build-types';
import { VesBuildPreferenceIds, VesBuildPreferenceSchema } from './ves-build-preferences';
import { VesBuildService } from './ves-build-service';
import { EditorManager } from '@theia/editor/lib/browser';

interface buildWidgetState {
  showOptions: boolean,
  logFilter: BuildLogLineType,
  timerInterval: NodeJS.Timer | undefined,
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
  @inject(PreferenceService)
  private readonly preferenceService: PreferenceService;
  @inject(VesBuildService)
  private readonly vesBuildService: VesBuildService;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  static readonly ID = 'vesBuildWidget';
  static readonly LABEL = VesBuildCommands.BUILD.label || 'Build';

  protected state: buildWidgetState = {
    showOptions: false,
    logFilter: BuildLogLineType.Normal,
    timerInterval: undefined,
  };

  protected buildLogLastElementRef = React.createRef<HTMLDivElement>();

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    // TODO: the user can't currently scroll in the logs when build is active
    this.buildLogLastElementRef.current?.scrollIntoView();
  }

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesBuildWidget.ID;
    this.title.iconClass = 'codicon codicon-tools';
    this.title.closable = true;
    this.title.label = VesBuildWidget.LABEL;
    this.title.caption = VesBuildWidget.LABEL;
    this.node.tabIndex = 0; // required for this.node.focus() to work in this.onActivateRequest()
    this.update();
    this.title.className = '';

    this.bindEvents();
  }

  protected bindEvents(): void {
    this.vesBuildService.onDidChangeIsQueued(isQueued => this.title.className = isQueued ? 'ves-decorator-queued' : '');
    this.vesBuildService.onDidChangeRomSize(() => this.update());
    this.vesBuildService.onDidChangeBuildStatus(() => this.update());
    this.vesBuildService.onDidChangeBuildMode(() => this.update());
    this.vesBuildService.onDidStartBuild(() => {
      this.startTimerInterval();
      this.state.logFilter = BuildLogLineType.Normal;
      this.title.className = 'ves-decorator-progress';
    });
    this.vesBuildService.onDidSucceedBuild(() => {
      this.stopTimerInterval();
      this.title.className = this.vesBuildService.getNumberOfWarnings() > 0
        ? 'ves-decorator-warning'
        : 'ves-decorator-success';
    });
    this.vesBuildService.onDidFailBuild(() => {
      this.stopTimerInterval();
      this.title.className = 'ves-decorator-error';
    });
    this.preferenceService.onPreferenceChanged(({ preferenceName }) => {
      switch (preferenceName) {
        case VesBuildPreferenceIds.BUILD_MODE:
        case VesBuildPreferenceIds.DUMP_ELF:
        case VesBuildPreferenceIds.ENGINE_CORE_PATH:
        case VesPluginsPreferenceIds.ENGINE_PLUGINS_PATH:
        case VesPluginsPreferenceIds.USER_PLUGINS_PATH:
        case VesBuildPreferenceIds.ENABLE_WSL:
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

  protected render(): React.ReactNode {
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
              {this.state.showOptions && (
                <div className='buildOptions theia-settings-container'>
                  <div className='single-pref' key={`pref-${VesBuildPreferenceIds.BUILD_MODE}`}>
                    <div className='pref-name'>Build Mode</div>
                    <div className='pref-content-container string'>
                      <div className='pref-input'>
                        <select
                          className='theia-select'
                          value={this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE)}
                          onChange={e => this.setMode(e.currentTarget.value)}
                        >
                          {Object.keys(BuildMode).map((value, index) => (
                            <option value={value}>
                              {Object.values(BuildMode)[index]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className='single-pref' key={`pref-${VesBuildPreferenceIds.DUMP_ELF}`}>
                    <div className='pref-name'>Dump Elf</div>
                    <div className='pref-content-container boolean'>
                      <div className='pref-description'>
                        {VesBuildPreferenceSchema.properties[VesBuildPreferenceIds.DUMP_ELF].description}
                      </div>
                      <div className='pref-input'>
                        <label>
                          <input
                            type='checkbox'
                            className='theia-input'
                            checked={this.preferenceService.get(VesBuildPreferenceIds.DUMP_ELF)}
                            onChange={this.toggleDumpElf}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className='single-pref' key={`pref-${VesBuildPreferenceIds.PEDANTIC_WARNINGS}`}>
                    <div className='pref-name'>Pedantic Warnings</div>
                    <div className='pref-content-container boolean'>
                      <div className='pref-description'>
                        {VesBuildPreferenceSchema.properties[VesBuildPreferenceIds.PEDANTIC_WARNINGS].description}
                      </div>
                      <div className='pref-input'>
                        <label>
                          <input
                            type='checkbox'
                            className='theia-input'
                            checked={this.preferenceService.get(VesBuildPreferenceIds.PEDANTIC_WARNINGS)}
                            onChange={this.togglePedanticWarnings}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  {isWindows && <div className='single-pref' key={`pref-${VesBuildPreferenceIds.ENABLE_WSL}`}>
                    <div className='pref-name'>Enable WSL</div>
                    <div className='pref-content-container boolean'>
                      <div className='pref-description'>
                        {VesBuildPreferenceSchema.properties[VesBuildPreferenceIds.ENABLE_WSL].description}
                      </div>
                      <div className='pref-input'>
                        <label>
                          <input
                            type='checkbox'
                            className='theia-input'
                            checked={this.preferenceService.get(VesBuildPreferenceIds.ENABLE_WSL)}
                            onChange={this.toggleEnableWsl}
                          />
                        </label>
                      </div>
                    </div>
                  </div>}
                  <div className='single-pref' key={`pref-${VesBuildPreferenceIds.ENGINE_CORE_PATH}`}>
                    <div className='pref-name'>Engine Path</div>
                    <div className='pref-content-container string'>
                      <div className='pref-description'>
                        {VesBuildPreferenceSchema.properties[VesBuildPreferenceIds.ENGINE_CORE_PATH].description}
                      </div>
                      <div className='pref-input'>
                        <input
                          type='text'
                          className='theia-input'
                          value={this.preferenceService.get(VesBuildPreferenceIds.ENGINE_CORE_PATH)}
                          // TODO: this should not fire on every single keypress. use timeout?
                          onChange={e => this.setEngineCorePath(e.currentTarget.value)}
                        />
                        <button
                          className='theia-button secondary'
                          onClick={() => this.selectFolder('Select core engine root folder', VesBuildPreferenceIds.ENGINE_CORE_PATH)}
                        >
                          <i className='fa fa-ellipsis-h' />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className='single-pref' key={`pref-${VesPluginsPreferenceIds.ENGINE_PLUGINS_PATH}`}>
                    <div className='pref-name'>Plugins Library Path</div>
                    <div className='pref-content-container string'>
                      <div className='pref-description'>
                        {VesPluginsPreferenceSchema.properties[VesPluginsPreferenceIds.ENGINE_PLUGINS_PATH].description}
                      </div>
                      <div className='pref-input'>
                        <input
                          type='text'
                          className='theia-input'
                          value={this.preferenceService.get(VesPluginsPreferenceIds.ENGINE_PLUGINS_PATH)}
                          // TODO: this should not fire on every single keypress. use timeout?
                          onChange={e => this.setEnginePluginsPath(e.currentTarget.value)}
                        />
                        <button
                          className='theia-button secondary'
                          onClick={() => this.selectFolder('Select plugins root folder', VesPluginsPreferenceIds.ENGINE_PLUGINS_PATH)}
                        >
                          <i className='fa fa-ellipsis-h' />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className='single-pref' key={`pref-${VesPluginsPreferenceIds.USER_PLUGINS_PATH}`}>
                    <div className='pref-name'>User Plugins Path</div>
                    <div className='pref-content-container string'>
                      <div className='pref-description'>
                        {VesPluginsPreferenceSchema.properties[VesPluginsPreferenceIds.USER_PLUGINS_PATH].description}
                      </div>
                      <div className='pref-input'>
                        <input
                          type='text'
                          className='theia-input'
                          value={this.preferenceService.get(VesPluginsPreferenceIds.USER_PLUGINS_PATH)}
                          // TODO: this should not fire on every single keypress. use timeout?
                          onChange={e => this.setUserPluginsPath(e.currentTarget.value)}
                        />
                        <button
                          className='theia-button secondary'
                          onClick={() => this.selectFolder('Select plugins root folder', VesPluginsPreferenceIds.USER_PLUGINS_PATH)}
                        >
                          <i className='fa fa-ellipsis-h' />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          {this.vesBuildService.buildStatus.active && (
            <>
              <div className='buildButtons'>
                <button
                  className='theia-button secondary'
                  onClick={this.abort}
                >
                  Abort
                </button>
              </div>
            </>
          )}
        </div>
        <div className='buildMeta'>
          {this.vesBuildService.buildStatus.log.length > 0 && (
            <>
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
                  {!this.vesBuildService.buildStatus.active && this.vesBuildService.romSize > 0 &&
                    <span><i className='fa fa-microchip'></i> {this.vesBuildService.bytesToMbit(this.vesBuildService.romSize)} MBit</span>}
                </div>
              </div>
              <div className='buildProblems'>
                {/* TODO: allow to filter for both warnings AND problems */}
                {this.vesBuildService.getNumberOfWarnings() > 0 && <button
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
                </button>}
                {this.vesBuildService.getNumberOfErrors() > 0 && <button
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
                </button>}
              </div>
            </>
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

  toggleBuildOptions(): void {
    this.state.showOptions = !this.state.showOptions;
    this.update();
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

  protected build = () => {
    this.state.logFilter = BuildLogLineType.Normal;
    this.commandService.executeCommand(VesBuildCommands.BUILD.id);
  };

  protected abort = async () => this.vesBuildService.abortBuild();

  protected setMode = (mode: string) => this.commandService.executeCommand(VesBuildCommands.SET_MODE.id, mode);
  protected toggleDumpElf = () => this.commandService.executeCommand(VesBuildCommands.TOGGLE_DUMP_ELF.id);
  protected togglePedanticWarnings = () => this.commandService.executeCommand(VesBuildCommands.TOGGLE_PEDANTIC_WARNINGS.id);
  protected toggleEnableWsl = () => this.commandService.executeCommand(VesBuildCommands.TOGGLE_ENABLE_WSL.id);
  protected setEngineCorePath = (path: string) => this.preferenceService.set(VesBuildPreferenceIds.ENGINE_CORE_PATH, path, PreferenceScope.User);
  protected setEnginePluginsPath = (path: string) => this.preferenceService.set(VesPluginsPreferenceIds.ENGINE_PLUGINS_PATH, path, PreferenceScope.User);
  protected setUserPluginsPath = (path: string) => this.preferenceService.set(VesPluginsPreferenceIds.USER_PLUGINS_PATH, path, PreferenceScope.User);
}
