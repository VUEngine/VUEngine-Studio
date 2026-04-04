import { injectable } from '@theia/core/shared/inversify';
import { ImageType } from '../types/Image';
import { AssetsBrowserWidget } from './assets-browser-widget';
import { nls } from '@theia/core';

@injectable()
export class ImageAssetsBrowserWidget extends AssetsBrowserWidget {
  static readonly ID: string = `${AssetsBrowserWidget.ID}:Image`;
  static readonly LABEL: string = `${AssetsBrowserWidget.LABEL}: ${ImageType.schema.title}`;

  protected getId(): string {
    return ImageAssetsBrowserWidget.ID;
  }

  protected getLabel(): string {
    return nls.localize('vuengine/projects/imageBrowser', 'Image Browser');
  }

  protected getIcon(): string {
    return ImageType.icon ?? super.getIcon();
  }

  protected getTypes(): string[] {
    return ['Image'];
  }
}
