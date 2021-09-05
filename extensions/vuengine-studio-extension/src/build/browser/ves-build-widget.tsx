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

@injectable()
export class VesBuildWidget extends ReactWidget {
  @inject(CommandService) private readonly commandService: CommandService;
  @inject(FileService) private readonly fileService: FileService;
  @inject(FileDialogService) private readonly fileDialogService: FileDialogService;
  @inject(EditorManager) private readonly editorManager: EditorManager;
  @inject(PreferenceService) private readonly preferenceService: PreferenceService;
  @inject(VesBuildService) private readonly vesBuildService: VesBuildService;
  @inject(WorkspaceService) private readonly workspaceService: WorkspaceService;

  static readonly ID = 'vesBuildWidget';
  static readonly LABEL = VesBuildCommands.BUILD.label || 'Build';

  protected state = {
    showOptions: false,
    logFilter: BuildLogLineType.Normal,
  };

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    // TODO: only scroll into view if it already is in view,
    // otherwise the user can't scroll in the logs which build is active
    this.buildLogLastElementRef.current?.scrollIntoView();
  }

  protected buildLogLastElementRef = React.createRef<HTMLDivElement>();

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesBuildWidget.ID;
    this.title.iconClass = 'fa fa-wrench';
    this.title.closable = true;
    this.title.label = VesBuildWidget.LABEL;
    this.title.caption = VesBuildWidget.LABEL;
    this.node.tabIndex = 0; // required for this.node.focus() to work in this.onActivateRequest()
    this.update();

    this.vesBuildService.onDidChangeBuildStatus(() => this.update());
    this.vesBuildService.onDidChangeBuildMode(() => this.update());
    this.preferenceService.onPreferenceChanged(({ preferenceName }) => {
      switch (preferenceName) {
        case VesBuildPreferenceIds.BUILD_MODE:
        case VesBuildPreferenceIds.DUMP_ELF:
        case VesBuildPreferenceIds.ENGINE_CORE_PATH:
        case VesPluginsPreferenceIds.ENGINE_PLUGINS_PATH:
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
                <div className='vesProgressBar'>
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
                  onClick={() => {
                    this.state.logFilter = BuildLogLineType.Normal;
                    this.commandService.executeCommand(VesBuildCommands.BUILD.id);
                  }}
                >
                  <i className='fa fa-wrench'></i> Build
                </button>
              </div>
              {this.state.showOptions && (
                <div className='buildOptions theia-settings-container'>
                  <div className='single-pref'>
                    <div className='pref-name'>Build Mode</div>
                    <div className='pref-content-container string'>
                      <div className='pref-input'>
                        <select
                          className='theia-select'
                          value={this.preferenceService.get(VesBuildPreferenceIds.BUILD_MODE)}
                          onChange={e => {
                            this.commandService.executeCommand(
                              VesBuildCommands.SET_MODE.id,
                              e.currentTarget.value
                            );
                          }}
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
                  <div className='single-pref'>
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
                            onChange={() =>
                              this.commandService.executeCommand(
                                VesBuildCommands.TOGGLE_DUMP_ELF.id
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className='single-pref'>
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
                            onChange={() =>
                              this.commandService.executeCommand(
                                VesBuildCommands.TOGGLE_PEDANTIC_WARNINGS.id
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                  {isWindows && <div className='single-pref'>
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
                            onChange={() =>
                              this.commandService.executeCommand(
                                VesBuildCommands.TOGGLE_ENABLE_WSL.id
                              )
                            }
                          />
                        </label>
                      </div>
                    </div>
                  </div>}
                  <div className='single-pref'>
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
                          onChange={e => this.preferenceService.set(VesBuildPreferenceIds.ENGINE_CORE_PATH, e.currentTarget.value, PreferenceScope.User)}
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
                  <div className='single-pref'>
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
                          onChange={e => this.preferenceService.set(VesPluginsPreferenceIds.ENGINE_PLUGINS_PATH, e.currentTarget.value, PreferenceScope.User)}
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
                </div>
              )}
            </>
          )}
          {this.vesBuildService.buildStatus.active && (
            <>
              <div className='buildButtons'>
                <button
                  className='theia-button secondary'
                  onClick={async () => this.vesBuildService.abortBuild()}
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
                  <div className='success'>
                    <i className='fa fa-check'></i> Build successful
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
                  {this.vesBuildService.buildStatus.romSize > 0 &&
                    <span><i className='fa fa-microchip'></i> {this.vesBuildService.bytesToMbit(this.vesBuildService.buildStatus.romSize)} MBit</span>}
                </div>
              </div>
              <div className='buildProblems'>
                {this.getNumberOfWarnings() > 0 && <button
                  className={
                    this.state.logFilter === BuildLogLineType.Warning
                      ? 'theia-button'
                      : 'theia-button secondary'
                  }
                  title='Show only warnings'
                  onClick={() => this.toggleFilter(BuildLogLineType.Warning)}
                >
                  <i className='fa fa-exclamation-triangle'></i>{' '}
                  {this.getNumberOfWarnings()}
                </button>}
                {this.getNumberOfErrors() > 0 && <button
                  className={
                    this.state.logFilter === BuildLogLineType.Error
                      ? 'theia-button'
                      : 'theia-button secondary'
                  }
                  title='Show only errors'
                  onClick={() => this.toggleFilter(BuildLogLineType.Error)}
                >
                  <i className='fa fa-times-circle-o'></i>{' '}
                  {this.getNumberOfErrors()}
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
                        className={`buildLogLine ${line.type} ${line.file && 'hasFileLink'}`}
                        key={`buildLogLine${index}`}
                        onClick={(e: React.MouseEvent) => line.file && this.openFile(e, line.file)}
                        title={`${new Date(line.timestamp).toTimeString().substr(0, 8)} ${line.text}`}
                      >
                        <span className='timestamp'>
                          {line.type === BuildLogLineType.Error
                            ? <i className='fa fa-times-circle-o' />
                            : line.type === BuildLogLineType.Warning
                              ? <i className='fa fa-exclamation-triangle' />
                              : line.type === BuildLogLineType.Headline
                                ? <i className='fa fa-arrow-circle-right' />
                                : line.type === BuildLogLineType.Done
                                  ? <i className='fa fa-check' />
                                  : <></>}
                        </span>
                        <span className='text'>
                          {line.optimizedText ? line.optimizedText : line.text}
                        </span>
                      </div>
                      : <div className='buildLogLine'></div>
                  )
                )}
                <div ref={this.buildLogLastElementRef}></div>
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

  toggleBuildOptions(): void {
    this.state.showOptions = !this.state.showOptions;
    this.update();
  }

  protected getDuration(): string {
    const startTimestamp = this.vesBuildService.buildStatus.log[0]?.timestamp || 0;
    const endTimestamp =
      this.vesBuildService.buildStatus.log[this.vesBuildService.buildStatus.log.length - 1]
        ?.timestamp || 0;
    const duration = endTimestamp - startTimestamp;
    const durationDate = new Date(duration);

    return `${durationDate
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${durationDate
        .getSeconds()
        .toString()
        .padStart(2, '0')}`;
  }

  protected toggleFilter(type: BuildLogLineType): void {
    this.state.logFilter =
      this.state.logFilter !== type ? type : BuildLogLineType.Normal;
    this.update();
  }

  protected async selectFolder(title: string, preferenceId: string): Promise<void> {
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
  }

  protected getNumberOfWarnings(): number {
    return this.vesBuildService.buildStatus.log.filter(
      l => l.type === BuildLogLineType.Warning
    ).length;
  }

  protected getNumberOfErrors(): number {
    return this.vesBuildService.buildStatus.log.filter(
      l => l.type === BuildLogLineType.Error
    ).length;
  }

  protected async openFile(e: React.MouseEvent, fileLink: BuildLogLineFileLink): Promise<void> {
    e.stopPropagation();
    e.preventDefault();

    const editorWidget = await this.editorManager.open(fileLink.uri, { mode: 'reveal' });
    editorWidget.editor.cursor = {
      line: fileLink.line > 0 ? fileLink.line - 1 : 0,
      character: fileLink.column > 0 ? fileLink.column - 1 : 0,
    };
    editorWidget.editor.revealPosition(editorWidget.editor.cursor);
  }
}
