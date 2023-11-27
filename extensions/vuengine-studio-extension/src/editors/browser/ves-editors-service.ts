import { injectable } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/shared/vscode-languageserver-protocol';

export enum IsGeneratingFilesStatus {
  active = 0,
  done = 1,
  hide = 2,
}

const SHOW_DONE_DURATION = 5000;

@injectable()
export class VesEditorsService {
  protected timeout: number = 0;

  protected numberOfGeneratedFiles = 0;

  protected _isGeneratingFiles: IsGeneratingFilesStatus = IsGeneratingFilesStatus.hide;
  protected readonly onDidChangeIsGeneratingFilesEmitter = new Emitter<IsGeneratingFilesStatus>();
  readonly onDidChangeIsGeneratingFiles = this.onDidChangeIsGeneratingFilesEmitter.event;
  set isGeneratingFiles(status: IsGeneratingFilesStatus) {
    this._isGeneratingFiles = status;
    this.onDidChangeIsGeneratingFilesEmitter.fire(this._isGeneratingFiles);

    window.clearTimeout(this.timeout);
    if (status === IsGeneratingFilesStatus.done) {
      this.timeout = window.setTimeout(() => {
        this.isGeneratingFiles = IsGeneratingFilesStatus.hide;
      }, SHOW_DONE_DURATION);
    }
  }
  get isGeneratingFiles(): IsGeneratingFilesStatus {
    return this._isGeneratingFiles;
  }

  setNumberOfGeneratedFiles(numberOfGeneratedFiles: number): void {
    this.numberOfGeneratedFiles = numberOfGeneratedFiles;
  }

  getNumberOfGeneratedFiles(): number {
    return this.numberOfGeneratedFiles;
  }
}
