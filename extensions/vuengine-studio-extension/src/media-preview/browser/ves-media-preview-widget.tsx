import { nls } from '@theia/core';
import { LabelProvider, NavigatableWidget } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import URI from '@theia/core/lib/common/uri';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { MediaFileType, SUPPORTED_AUDIO_FILES, SUPPORTED_IMAGE_FILES, SUPPORTED_VIDEO_FILES } from './ves-media-preview-types';
import { FileService } from '@theia/filesystem/lib/browser/file-service';

export const VesMediaPreviewWidgetOptions = Symbol('VesMediaPreviewWidgetOptions');
export interface VesMediaPreviewWidgetOptions {
  uri: string;
}

export interface vesMediaPreviewWidgetState {
  zoom: number
}

@injectable()
export class VesMediaPreviewWidget extends ReactWidget implements NavigatableWidget {
  @inject(FileService)
  protected readonly fileService: FileService;
  @inject(LabelProvider)
  protected readonly labelProvider: LabelProvider;
  @inject(VesMediaPreviewWidgetOptions)
  protected readonly options: VesMediaPreviewWidgetOptions;

  static readonly ID = 'vesMediaPreviewWidget';
  static readonly LABEL = nls.localize('vuengine/mediaPreview/preview', 'Preview');

  protected uri: URI;
  protected type: string;

  @postConstruct()
  protected init(): void {
    this.uri = new URI(this.options.uri);
    this.id = `${VesMediaPreviewWidget.ID}/${this.options.uri}`;
    this.title.label = this.options
      ? this.uri.path.base
      : VesMediaPreviewWidget.LABEL;
    this.title.closable = true;

    const ext = this.uri.path.ext;
    if (SUPPORTED_IMAGE_FILES.includes(ext)) {
      this.type = MediaFileType.image;
    } else if (SUPPORTED_VIDEO_FILES.includes(ext)) {
      this.type = MediaFileType.video;
    } else if (SUPPORTED_AUDIO_FILES.includes(ext)) {
      this.type = MediaFileType.audio;
    }

    this.update();
  }

  getResourceUri(): URI | undefined {
    return this.uri;
  }

  createMoveToUri(resourceUri: URI): URI | undefined {
    return resourceUri;
  }

  protected onActivateRequest(msg: Message): void {
    this.node.focus();
  }

  protected render(): React.ReactNode {
    this.title.iconClass = `file-icon ${this.labelProvider.getIcon(this.uri)}`;

    return <div className='vesMediaPreview scale-to-fit'>
      {this.type === MediaFileType.image &&
        <img
          src={this.uri.path.fsPath()}
        />
      }
      {this.type === MediaFileType.audio &&
        <audio
          preload="auto"
          src={this.uri.path.fsPath()}
          controls
        />
      }
      {this.type === MediaFileType.video &&
        <video
          src={this.uri.path.fsPath()}
          playsInline
          controls
        />
      }
    </div>;
  }
}
