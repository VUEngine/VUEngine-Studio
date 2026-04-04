import { injectable } from '@theia/core/shared/inversify';
import { AssetsBrowserWidget } from './assets-browser-widget';
import { PixelType } from '../types/Pixel';
import { nls } from '@theia/core';

@injectable()
export class PixelAssetsBrowserWidget extends AssetsBrowserWidget {
  static readonly ID: string = `${AssetsBrowserWidget.ID}:Pixel`;
  static readonly LABEL: string = `${AssetsBrowserWidget.LABEL}: ${PixelType.schema.title}`;

  protected getId(): string {
    return PixelAssetsBrowserWidget.ID;
  }

  protected getLabel(): string {
    return nls.localize('vuengine/projects/pixelBrowser', 'Pixel Browser');
  }

  protected getIcon(): string {
    return PixelType.icon ?? super.getIcon();
  }

  protected getTypes(): string[] {
    return ['Pixel'];
  }
}
