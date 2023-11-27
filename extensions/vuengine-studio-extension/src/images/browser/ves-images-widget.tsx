import * as React from '@theia/core/shared/react';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { CommandService, nls } from '@theia/core';
import { Message, PreferenceScope, PreferenceService } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { FileDialogService, OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { EditorManager } from '@theia/editor/lib/browser';
import { VesImagesCommands } from './ves-images-commands';
import { VesImagesService } from './ves-images-service';
import { ImagesLogLine, ImagesLogLineType } from './ves-images-types';
import URI from '@theia/core/lib/common/uri';

interface VesImagesWidgetState {
  changedOnly: boolean,
}

@injectable()
export class VesImagesWidget extends ReactWidget {
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
  @inject(VesImagesService)
  private readonly VesImagesService: VesImagesService;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  static readonly ID = 'VesImagesWidget';
  static readonly LABEL = nls.localize('vuengine/imageConverter/imageConverter', 'Image Converter');

  protected state: VesImagesWidgetState = {
    changedOnly: true,
  };

  protected imageConversionLogLastElementRef = React.createRef<HTMLDivElement>();

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    // TODO: the user can't currently scroll in the logs when conversion is active
    this.imageConversionLogLastElementRef.current?.scrollIntoView();
  }

  @postConstruct()
  protected init(): void {
    this.id = VesImagesWidget.ID;
    this.title.iconClass = 'codicon codicon-circuit-board';
    this.title.closable = true;
    this.title.label = VesImagesWidget.LABEL;
    this.title.caption = VesImagesWidget.LABEL;
    this.node.tabIndex = 0; // required for this.node.focus() to work in this.onActivateRequest()
    this.update();
    this.title.className = '';

    this.bindEvents();
  }

  protected bindEvents(): void {
    this.VesImagesService.onDidChangeIsConverting(isConverting => {
      this.title.className = isConverting
        ? 'ves-decorator-progress'
        : this.VesImagesService.progress > 0
          ? 'ves-decorator-success'
          : '';
    });
    this.VesImagesService.onDidChangeLog(() => this.update());
    this.VesImagesService.onDidChangeProgress(() => this.update());
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.update();
    this.node.focus();
  }

  protected render(): React.ReactNode {
    return (
      <>
        <div className="convertActions">
          {this.VesImagesService.isConverting && (
            <div className="convertPanel">
              <div className="vesProgressBar">
                <div style={{ width: this.VesImagesService.progress + '%' }}></div>
                <span>{this.VesImagesService.progress}%</span>
              </div>
            </div>
          )}
          {!this.VesImagesService.isConverting && (
            <div className="convertButtons">
              <button
                className="theia-button large convert"
                disabled={!this.workspaceService.opened}
                onClick={this.convert}
              >
                {nls.localize('vuengine/imageConverter/convert', 'Convert')}
              </button>
              <div>
                <label>
                  <input
                    type="checkbox"
                    className="theia-input"
                    checked={this.state.changedOnly}
                    onChange={this.toggleChangedOnly}
                  />
                  {nls.localize('vuengine/imageConverter/changedImagesOnly', 'Changed images only')}
                </label>
              </div>
            </div>
          )}
          {/* this.VesImagesService.isConverting && (
            <div className="convertButtons">
              <button
                className="theia-button secondary"
                onClick={this.abort}
              >
                Abort
              </button>
            </div>
          ) */}
        </div>
        {this.VesImagesService.log.length > 0 && (
          <>
            <div className="convertLogWrapper">
              <div className="convertLog">
                <div>
                  {this.VesImagesService.log.map(
                    (line: ImagesLogLine, index: number) => (
                      line.text !== ''
                        ? <div className={`convertLogLine ${line.type}${line.uri ? ' hasFileLink' : ''}`}
                          key={`convertLogLine${index}`}
                          onClick={e => this.openFile(e, line.uri)}
                          title={`${new Date(line.timestamp).toTimeString().substring(0, 8)} ${line.text}`}
                        >
                          <span className='icon'>
                            {line.type === ImagesLogLineType.Error
                              ? <i className='codicon codicon-error' />
                              : line.type === ImagesLogLineType.Warning
                                ? <i className='codicon codicon-warning' />
                                : line.type === ImagesLogLineType.Headline
                                  ? <i className='codicon codicon-info' />
                                  : line.type === ImagesLogLineType.Done
                                    ? <i className='codicon codicon-pass-filled' />
                                    : <></>}
                          </span>
                          <span className="text">
                            <span className="timestamp">
                              {new Date(line.timestamp).toTimeString().substring(0, 5)}
                            </span>
                            {line.text}
                          </span>
                        </div>
                        : <div className="convertLogLine" key={`convertLogLine${index}`}></div>
                    )
                  )}
                  <div ref={this.imageConversionLogLastElementRef} key={'convertLogLineLast'}></div>
                </div>
              </div>
            </div>
            <div className="convertLogButtons">
              <button
                className="theia-button secondary"
                onClick={this.clearLog}
                disabled={this.VesImagesService.isConverting}
              >
                {nls.localize('vuengine/imageConverter/clearLogs', 'Clear Logs')}
              </button>
            </div>
          </>
        )}
      </>
    );
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

  protected async openFile(e: React.MouseEvent, uri?: URI): Promise<void> {
    e.stopPropagation();
    e.preventDefault();

    if (uri) {
      await this.editorManager.open(uri, { mode: 'reveal' });
    }
  }

  protected clearLog = () => this.VesImagesService.clearLog();
  protected toggleChangedOnly = () => {
    this.state.changedOnly = !this.state.changedOnly;
    this.update();
  };
  protected convert = async () => {
    if (this.state.changedOnly) {
      this.commandService.executeCommand(VesImagesCommands.CONVERT_CHANGED.id);
    } else {
      this.commandService.executeCommand(VesImagesCommands.CONVERT_ALL.id);
    }
  };
  // protected abort = () => this.VesImagesService.abortConverting();
}
