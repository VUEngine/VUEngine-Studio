import * as React from '@theia/core/shared/react';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { CommandService, isWindows } from '@theia/core';
import { ApplicationShell, Message, PreferenceScope, PreferenceService } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { FileDialogService, OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';

import { VesBuildCommands } from './ves-build-commands';
import { BuildLogLine, BuildLogLineType, BuildMode, BuildResult } from './ves-build-types';
import { VesBuildPreferenceIds, VesBuildPreferenceSchema } from './ves-build-preferences';
import { VesBuildService } from './ves-build-service';

@injectable()
export class VesBuildWidget extends ReactWidget {
  @inject(ApplicationShell) protected readonly applicationShell: ApplicationShell;
  @inject(CommandService) private readonly commandService: CommandService;
  @inject(FileService) private readonly fileService: FileService;
  @inject(FileDialogService) private readonly fileDialogService: FileDialogService;
  @inject(PreferenceService) private readonly preferenceService: PreferenceService;
  @inject(VesBuildService) private readonly vesBuildService: VesBuildService;
  @inject(WorkspaceService) private readonly workspaceService: WorkspaceService;

  static readonly ID = 'vesBuildWidget';
  static readonly LABEL = VesBuildCommands.BUILD.label || 'Build';

  protected state = {
    isWide: false,
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
        case VesBuildPreferenceIds.ENGINE_PLUGINS_PATH:
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
                {this.applicationShell.getAreaFor(this) === 'right' && <button
                  className='theia-button secondary'
                  onClick={() => this.toggleWidgetWidth()}
                >
                  <i className={this.state.isWide ? 'fa fa-chevron-right' : 'fa fa-chevron-left'}></i>
                </button>}
                <button
                  className='theia-button build'
                  disabled={!this.workspaceService.opened}
                  onClick={() =>
                    this.commandService.executeCommand(VesBuildCommands.BUILD.id)
                  }
                >
                  <i className='fa fa-wrench'></i> Build
                </button>
                <button
                  className={this.state.showOptions ? 'theia-button primary' : 'theia-button secondary'}
                  onClick={() => this.toggleBuildOptions()}
                >
                  <i className='fa fa-cog'></i>
                </button>
                {this.applicationShell.getAreaFor(this) === 'left' && <button
                  className='theia-button secondary'
                  onClick={() => this.toggleWidgetWidth()}
                >
                  <i className={this.state.isWide ? 'fa fa-chevron-left' : 'fa fa-chevron-right'}></i>
                </button>}
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
                            onClick={() =>
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
                            onClick={() =>
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
                            onClick={() =>
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
                        {VesBuildPreferenceSchema.properties[VesBuildPreferenceIds.ENGINE_PLUGINS_PATH].description}
                      </div>
                      <div className='pref-input'>
                        <input
                          type='text'
                          className='theia-input'
                          value={this.preferenceService.get(VesBuildPreferenceIds.ENGINE_PLUGINS_PATH)}
                          // TODO: this should not fire on every single keypress. use timeout?
                          onChange={e => this.preferenceService.set(VesBuildPreferenceIds.ENGINE_PLUGINS_PATH, e.currentTarget.value, PreferenceScope.User)}
                        />
                        <button
                          className='theia-button secondary'
                          onClick={() => this.selectFolder('Select plugins root folder', VesBuildPreferenceIds.ENGINE_PLUGINS_PATH)}
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
                {this.applicationShell.getAreaFor(this) === 'right' && <button
                  className='theia-button secondary'
                  onClick={() => this.toggleWidgetWidth()}
                >
                  <i className={this.state.isWide ? 'fa fa-chevron-right' : 'fa fa-chevron-left'}></i>
                </button>}
                <button
                  className='theia-button secondary'
                  onClick={() => this.vesBuildService.abortBuild()}
                >
                  Abort
                </button>
                {this.applicationShell.getAreaFor(this) === 'left' && <button
                  className='theia-button secondary'
                  onClick={() => this.toggleWidgetWidth()}
                >
                  <i className={this.state.isWide ? 'fa fa-chevron-left' : 'fa fa-chevron-right'}></i>
                </button>}
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
                <div>
                  {this.getDuration()} – {this.vesBuildService.buildStatus.buildMode} –
                  PID {this.vesBuildService.buildStatus.processId}
                </div>
              </div>
              <div className='buildProblems'>
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
                  {
                    this.vesBuildService.buildStatus.log.filter(
                      l => l.type === BuildLogLineType.Warning
                    ).length
                  }
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
                  {
                    this.vesBuildService.buildStatus.log.filter(
                      l => l.type === BuildLogLineType.Error
                    ).length
                  }
                </button>
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
                  (line: BuildLogLine, index: number) => (
                    line.text !== ''
                      ? <div
                        className={`buildLogLine ${line.type}`}
                        key={`buildLogLine${index}`}
                      >
                        <span className='timestamp'>
                          {new Date(line.timestamp).toTimeString().substr(0, 8)}
                        </span>
                        <span className='text'>{line.text}</span>
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

  protected toggleBuildOptions(): void {
    this.state.showOptions = !this.state.showOptions;
    this.update();
  }

  protected toggleWidgetWidth(): void {
    this.state.isWide = !this.state.isWide;
    this.update();
    const targetWidth = this.state.isWide
      ? window.innerWidth
      : Math.round(window.innerWidth * 0.25);
    const widgetArea = this.applicationShell.getAreaFor(this);
    if (widgetArea) {
      this.applicationShell.resize(targetWidth, widgetArea);
    }
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
}
