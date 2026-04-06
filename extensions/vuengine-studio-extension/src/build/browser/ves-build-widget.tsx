import { CommandService, isWindows, nls, PreferenceScope, PreferenceService } from '@theia/core';
import { Message } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { EditorManager } from '@theia/editor/lib/browser';
import NoWorkspaceOpened from '../../core/browser/components/NoWorkspaceOpened';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesCoreCommands } from '../../core/browser/ves-core-commands';
import { VesWorkspaceService } from '../../core/browser/ves-workspace-service';
import Input from '../../editors/browser/components/Common/Base/Input';
import { VesPluginsPreferenceIds } from '../../plugins/browser/ves-plugins-preferences';
import NoBuildInCollaboration from './components/NoBuildInCollaboration';
import { VesBuildCommands } from './ves-build-commands';
import { VesBuildPreferenceIds } from './ves-build-preferences';
import { VesBuildService } from './ves-build-service';
import { BUILD_MODE_DESCRIPTIONS, BuildLogLine, BuildLogLineFileLink, BuildLogLineType, BuildMode, BuildResult } from './ves-build-types';

interface VesBuildWidgetState {
  filterErrors: boolean
  filterWarnings: boolean
  timerInterval: NodeJS.Timeout | undefined
  outputRomExists: boolean
  autoScroll: boolean
  searchTerm: string
  lineWrap: boolean
  useWsl: boolean
}

@injectable()
export class VesBuildWidget extends ReactWidget {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(EditorManager)
  private readonly editorManager: EditorManager;
  @inject(PreferenceService)
  private readonly preferenceService: PreferenceService;
  @inject(VesBuildService)
  private readonly vesBuildService: VesBuildService;
  @inject(VesCommonService)
  private readonly vesCommonService: VesCommonService;
  @inject(VesWorkspaceService)
  private readonly workspaceService: VesWorkspaceService;

  static readonly ID = 'vesBuildWidget';
  static readonly LABEL = nls.localize('vuengine/build/buildProject', 'Build Project');

  protected state: VesBuildWidgetState = {
    filterErrors: false,
    filterWarnings: false,
    timerInterval: undefined,
    outputRomExists: false,
    autoScroll: true,
    searchTerm: '',
    lineWrap: true, // properly initialize later when preferences service is ready
    useWsl: false, // properly initialize later when preferences service is ready
  };

  protected buildLogLastElementRef = React.createRef<HTMLDivElement>();

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    if (this.state.autoScroll) {
      this.buildLogLastElementRef.current?.scrollIntoView();
    }
  }

  @postConstruct()
  protected init(): void {
    this.doInit();
    this.bindEvents();

    this.id = VesBuildWidget.ID;
    this.title.iconClass = 'codicon codicon-tools';
    this.title.closable = false;
    this.title.label = VesBuildWidget.LABEL;
    this.title.caption = VesBuildWidget.LABEL;
    this.title.className = '';

    this.update();
  }

  protected async doInit(): Promise<void> {
    await this.preferenceService.ready;
    this.state.lineWrap = this.preferenceService.get(VesBuildPreferenceIds.LOG_LINE_WRAP) ?? this.state.lineWrap;
    if (isWindows) {
      this.state.useWsl = this.preferenceService.get(VesBuildPreferenceIds.USE_WSL) ?? this.state.useWsl;
    }

    this.state.outputRomExists = await this.vesBuildService.outputRomExists();
    this.update();
  }

  protected async bindEvents(): Promise<void> {
    await this.workspaceService.ready;

    this.workspaceService.onDidChangeRoots((isCollaboration: boolean) => {
      if (isCollaboration) {
        this.update();
      }
    });
    this.preferenceService.onPreferenceChanged(({ preferenceName }) => {
      switch (preferenceName) {
        case VesBuildPreferenceIds.DUMP_ELF:
        case VesBuildPreferenceIds.ENGINE_PATH:
        case VesBuildPreferenceIds.PEDANTIC_WARNINGS:
        case VesPluginsPreferenceIds.USER_PLUGINS_PATH:
          this.update();
          break;
        case VesBuildPreferenceIds.LOG_LINE_WRAP:
          this.state.lineWrap = this.preferenceService.get(VesBuildPreferenceIds.LOG_LINE_WRAP) as boolean;
          this.update();
          break;
        case VesBuildPreferenceIds.USE_WSL:
          this.state.useWsl = this.preferenceService.get(VesBuildPreferenceIds.USE_WSL) as boolean;
          this.update();
          break;
      }
    });

    this.vesBuildService.onDidChangeIsCleaning(() => this.update());

    this.vesBuildService.onDidChangeIsQueued(isQueued => this.title.className = isQueued ? 'ves-decorator-queued' : '');

    this.vesBuildService.onDidChangeRomSize(() => this.update());

    this.vesBuildService.onDidChangeBuildMode(() => this.update());

    this.vesBuildService.onDidStartBuild(() => {
      this.startTimerInterval();
      this.state.filterErrors = false;
      this.state.filterWarnings = false;
      this.title.className = 'ves-decorator-progress';
    });

    this.vesBuildService.onDidSucceedBuild(async () => {
      this.stopTimerInterval();
      const numberOfWarnings = this.vesBuildService.getNumberOfWarnings();
      this.title.className = numberOfWarnings > 0
        ? 'ves-decorator-warning'
        : 'ves-decorator-success';
      this.state.outputRomExists = await this.vesBuildService.outputRomExists();
      if (numberOfWarnings > 0 && this.preferenceService.get(VesBuildPreferenceIds.AUTO_FILTER_LOGS_ON_WARNING)) {
        this.state.filterWarnings = true;
      }
      this.update();
    });

    this.vesBuildService.onDidFailBuild(async () => {
      this.stopTimerInterval();
      this.title.className = 'ves-decorator-error';
      this.state.outputRomExists = await this.vesBuildService.outputRomExists();
      if (this.preferenceService.get(VesBuildPreferenceIds.AUTO_FILTER_LOGS_ON_ERROR)) {
        this.state.filterErrors = true;
      }
      this.update();
    });
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.update();
    this.node.tabIndex = 0;
    this.node.focus();
  }

  protected render(): React.ReactNode {
    const doUseWsl = this.state.useWsl && this.vesCommonService.isWslInstalled;

    return !this.workspaceService.opened
      ? <NoWorkspaceOpened
        commandService={this.commandService}
      />
      : this.workspaceService.isCollaboration()
        ? (
          <NoBuildInCollaboration />
        )
        : (
          <div className='buildWidget'>
            <div className='buildActions'>
              {this.vesBuildService.buildStatus.active &&
                this.vesBuildService.buildStatus.progress > -1 && (
                  <div className='buildPanel'>
                    <div className={`vesProgressBar ${this.vesBuildService.getNumberOfWarnings() && 'withWarnings'}`}>
                      <div style={{ width: this.vesBuildService.buildStatus.progress + '%' }}></div>
                      <span>
                        {this.vesBuildService.buildStatus.progress}%
                      </span>
                    </div>
                    <button
                      className='theia-button secondary codicon codicon-circle-slash'
                      disabled={!this.vesBuildService.buildStatus.active}
                      onClick={this.abort}
                      title={nls.localize('vuengine/build/abortBuild', 'Abort build')}
                    />
                  </div>
                )}
              {!this.vesBuildService.buildStatus.active && (
                <>
                  <button
                    className='theia-button large build'
                    disabled={!this.workspaceService.opened}
                    onClick={this.build}
                  >
                    {nls.localize('vuengine/build/build', 'Build')}
                  </button>
                </>
              )}
              <SelectComponent
                options={Object.keys(BuildMode).map(m => ({
                  value: m,
                  description: BUILD_MODE_DESCRIPTIONS[m as BuildMode],
                  label: m,
                }))}
                defaultValue={this.vesBuildService.getBuildMode()}
                onChange={option => this.vesBuildService.setBuildMode(option.value as BuildMode)}
              />
            </div>
            {isWindows && !doUseWsl && (
              <div>
                <i className='fa fa-exclamation-triangle'></i> {nls.localize('vuengine/build/pleaseInstallWsl',
                  'Please consider installing WSL to massively improve build times.')} (
                <a href="#" onClick={this.openWslDocs}>{nls.localize('vuengine/general/documentation',
                  'Documentation')}</a>
                )
              </div>
            )}
            {this.vesBuildService.buildStatus.log.length > 0 && (
              <div className='buildMeta'>
                <div className='buildStatus'>
                  {this.vesBuildService.buildStatus.active ? (
                    <div className='buildStatusActivity'>
                      <i className='fa fa-cog fa-spin'></i>{' '}{this.vesBuildService.buildStatus.step}
                    </div>
                  ) : this.vesBuildService.buildStatus.step === BuildResult.done ? (
                    <div className={this.vesBuildService.getNumberOfWarnings() > 0 ? 'warning' : 'success'}>
                      {this.vesBuildService.getNumberOfWarnings() > 0
                        ? <><i className='fa fa-exclamation-triangle'></i> {nls.localize('vuengine/build/buildSuccessfulWithWarnings', 'Build successful (with warnings)')}</>
                        : <><i className='fa fa-check'></i> {nls.localize('vuengine/build/buildSuccessful', 'Build successful')}</>}
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
                    {doUseWsl &&
                      <span><i className='fa fa-linux'></i> WSL</span>}
                    {!this.vesBuildService.buildStatus.active && this.vesBuildService.romSize > 0 &&
                      <span><i className='fa fa-microchip'></i> {this.vesBuildService.bytesToMbit(this.vesBuildService.romSize)} MBit</span>}
                  </div>
                </div>
              </div>
            )}
            <div className='buildLogWrapper'>
              <div className={`buildLog${this.state.lineWrap ? ' linewrap' : ''}`}>
                <div>
                  {this.vesBuildService.buildStatus.log
                    .filter(l => (
                      (
                        (!this.state.filterErrors && !this.state.filterWarnings) ||
                        (this.state.filterErrors && l.type === BuildLogLineType.Error) ||
                        (this.state.filterWarnings && l.type === BuildLogLineType.Warning)
                      ) &&
                      (this.state.searchTerm === '' || l.text.toLowerCase().includes(this.state.searchTerm.toLowerCase()))
                    ))
                    .map(
                      // TODO: context menu with option to copy (full) error message
                      (line: BuildLogLine, index: number) => (
                        line.text !== ''
                          ? <div
                            className={`buildLogLine ${line.type}${line.file ? ' hasFileLink' : ''}`}
                            key={`buildLogLine${index}`}
                            onClick={e => this.openFile(e, line.file)}
                            title={`${new Date(line.timestamp).toTimeString().substring(0, 8)} ${line.text}`}
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
            </div>
            <div className='buildLogButtons'>
              <button
                className="theia-button secondary"
                title={nls.localize('vuengine/build/toggleAutomaticScrolling', 'Toggle automatic scrolling')}
                onClick={() => this.toggleAutoScroll()}
              >
                <i className={this.state.autoScroll
                  ? 'fa fa-fw fa-long-arrow-down'
                  : 'fa fa-fw fa-minus'
                }></i>
              </button>
              <button
                className="theia-button secondary"
                title={nls.localize('vuengine/build/toggleLineWrap', 'Toggle line wrap')}
                onClick={this.toggleLineWrap}
              >
                <i className={this.state.lineWrap
                  ? 'codicon codicon-word-wrap'
                  : 'codicon codicon-list-selection'
                }></i>
              </button>
              <button
                className={
                  this.state.filterWarnings
                    ? 'theia-button'
                    : 'theia-button secondary'
                }
                title={nls.localize('vuengine/build/showOnlyWarnings', 'Show only warnings')}
                onClick={this.toggleFilterWarnings}
              >
                <i className='fa fa-exclamation-triangle'></i>{' '}
                {this.vesBuildService.getNumberOfWarnings()}
              </button>
              <button
                className={
                  this.state.filterErrors
                    ? 'theia-button'
                    : 'theia-button secondary'
                }
                title={nls.localize('vuengine/build/showOnlyErrors', 'Show only errors')}
                onClick={this.toggleFilterErrors}
              >
                <i className='fa fa-times-circle-o'></i>{' '}
                {this.vesBuildService.getNumberOfErrors()}
              </button>
              <Input
                placeholder={nls.localize('vuengine/build/searchLogPlaceholder', 'Search Log...')}
                value={this.state.searchTerm}
                setValue={v => this.setSearchTerm(v as string)}
                grow={1}
              />
              <button
                className='theia-button secondary'
                title={nls.localize('vuengine/build/clearLog', 'Clear Log')}
                onClick={() => {
                  this.vesBuildService.clearLogs();
                  this.update();
                }}
              >
                <i className='fa fa-trash-o'></i>
              </button>
            </div>
          </div>
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
    let duration = 0;
    const startDate = this.vesBuildService.buildStatus.startDate;
    if (startDate) {
      const endDate = this.vesBuildService.buildStatus.endDate || new Date();
      duration = endDate.getTime() - startDate.getTime();
    }
    const durationDate = new Date(duration);

    return `${durationDate
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${durationDate
        .getSeconds()
        .toString()
        .padStart(2, '0')}`;
  }

  protected toggleFilterErrors = (): void => {
    this.state.filterErrors = !this.state.filterErrors;
    this.update();
  };

  protected toggleFilterWarnings = (): void => {
    this.state.filterWarnings = !this.state.filterWarnings;
    this.update();
  };

  protected toggleAutoScroll = (): void => {
    this.state.autoScroll = !this.state.autoScroll;
    this.update();
  };

  protected toggleLineWrap = (): Promise<void> => {
    const current = this.preferenceService.get(VesBuildPreferenceIds.LOG_LINE_WRAP);
    return this.preferenceService.set(VesBuildPreferenceIds.LOG_LINE_WRAP, !current, PreferenceScope.User);
  };

  protected setSearchTerm = (searchTerm: string): void => {
    this.state.searchTerm = searchTerm;
    this.update();
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
    this.commandService.executeCommand(VesBuildCommands.BUILD.id);
  };

  protected abort = async () => this.vesBuildService.abortBuild();

  protected openWslDocs = () => this.commandService.executeCommand(VesCoreCommands.OPEN_DOCUMENTATION.id, 'setup/enhancing-build-times', false);
}
