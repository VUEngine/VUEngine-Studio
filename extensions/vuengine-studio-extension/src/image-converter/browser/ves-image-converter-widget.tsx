import * as React from '@theia/core/shared/react';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { CommandService } from '@theia/core';
import { Message, PreferenceScope, PreferenceService } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { FileDialogService, OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { EditorManager } from '@theia/editor/lib/browser';
import { VesImageConverterCommands } from './ves-image-converter-commands';
import { VesImageConverterService } from './ves-image-converter-service';
import { ImageConverterLogLine, ImageConverterLogLineType } from './ves-image-converter-types';
import URI from '@theia/core/lib/common/uri';

@injectable()
export class VesImageConverterWidget extends ReactWidget {
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
  @inject(VesImageConverterService)
  private readonly vesImageConverterService: VesImageConverterService;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  static readonly ID = 'vesImageConverterWidget';
  static readonly LABEL = 'Image Converter';

  protected imageConversionLogLastElementRef = React.createRef<HTMLDivElement>();

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    // TODO: the user can't currently scroll in the logs when conversion is active
    this.imageConversionLogLastElementRef.current?.scrollIntoView();
  }

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesImageConverterWidget.ID;
    this.title.iconClass = 'codicon codicon-circuit-board';
    this.title.closable = true;
    this.title.label = VesImageConverterWidget.LABEL;
    this.title.caption = VesImageConverterWidget.LABEL;
    this.node.tabIndex = 0; // required for this.node.focus() to work in this.onActivateRequest()
    this.update();
    this.title.className = '';

    this.bindEvents();
  }

  protected bindEvents(): void {
    this.vesImageConverterService.onDidChangeIsConverting(isConverting => {
      this.title.className = isConverting
        ? 'ves-decorator-progress'
        : this.vesImageConverterService.progress > 0
          ? 'ves-decorator-success'
          : '';
    });
    this.vesImageConverterService.onDidChangeLog(() => this.update());
    this.vesImageConverterService.onDidChangeProgress(() => this.update());
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
          {this.vesImageConverterService.isConverting && (
            <div className="convertPanel">
              <div className="vesProgressBar">
                <div style={{ width: this.vesImageConverterService.progress + '%' }}></div>
                <span>{this.vesImageConverterService.progress}%</span>
              </div>
            </div>
          )}
          {!this.vesImageConverterService.isConverting && (
            <>
              <div className="convertButtons">
                <button
                  className="theia-button large convert"
                  disabled={!this.workspaceService.opened}
                  onClick={this.convertAll}
                >
                  Convert
                </button>
              </div>
            </>
          )}
          {/* this.vesImageConverterService.isConverting && (
            <>
              <div className="convertButtons">
                <button
                  className="theia-button secondary"
                  onClick={this.abort}
                >
                  Abort
                </button>
              </div>
            </>
          ) */}
        </div>
        {this.vesImageConverterService.log.length > 0 && (
          <>
            <div className="convertLogWrapper">
              <div className="convertLog">
                <div>
                  {this.vesImageConverterService.log.map(
                    (line: ImageConverterLogLine, index: number) => (
                      line.text !== ''
                        ? <div className={`convertLogLine ${line.type}${line.uri ? ' hasFileLink' : ''}`}
                          key={`convertLogLine${index}`}
                          onClick={e => this.openFile(e, line.uri)}
                          title={`${new Date(line.timestamp).toTimeString().substr(0, 8)} ${line.text}`}
                        >
                          <span className='icon'>
                            {line.type === ImageConverterLogLineType.Error
                              ? <i className='codicon codicon-error' />
                              : line.type === ImageConverterLogLineType.Warning
                                ? <i className='codicon codicon-warning' />
                                : line.type === ImageConverterLogLineType.Headline
                                  ? <i className='codicon codicon-info' />
                                  : line.type === ImageConverterLogLineType.Done
                                    ? <i className='codicon codicon-pass-filled' />
                                    : <></>}
                          </span>
                          <span className="text">
                            <span className="timestamp">
                              {new Date(line.timestamp).toTimeString().substr(0, 5)}
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
                disabled={this.vesImageConverterService.isConverting}
              >
                Clear Logs
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

  protected convertAll = async () => this.commandService.executeCommand(VesImageConverterCommands.CONVERT_ALL.id);
  protected clearLog = () => this.vesImageConverterService.clearLog();
  // protected abort = () => this.vesImageConverterService.abortConverting();
}
