import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { FontType } from '../types/Font';
import { AssetsBrowserWidget } from './assets-browser-widget';

@injectable()
export class FontAssetsBrowserWidget extends AssetsBrowserWidget {
  static readonly ID: string = `${AssetsBrowserWidget.ID}:Font`;
  static readonly LABEL: string = `${AssetsBrowserWidget.LABEL}: ${FontType.schema.title}`;

  protected getId(): string {
    return FontAssetsBrowserWidget.ID;
  }

  protected getLabel(): string {
    return nls.localize('vuengine/projects/fontBrowser', 'Fonts');
  }

  protected getIcon(): string {
    return FontType.icon ?? super.getIcon();
  }

  protected getTypes(): string[] {
    return ['Font'];
  }
}
