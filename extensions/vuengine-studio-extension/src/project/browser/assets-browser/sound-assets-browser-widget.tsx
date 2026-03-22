import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { SoundType } from '../types/Sound';
import { AssetsBrowserWidget } from './assets-browser-widget';

@injectable()
export class SoundAssetsBrowserWidget extends AssetsBrowserWidget {
  static readonly ID: string = `${AssetsBrowserWidget.ID}:sound`;
  static readonly LABEL: string = `${AssetsBrowserWidget.LABEL}: ${SoundType.schema.title}`;

  protected getId(): string {
    return SoundAssetsBrowserWidget.ID;
  }

  protected getLabel(): string {
    return nls.localize('vuengine/projects/soundBrowser', 'Sound Browser');
  }

  protected getIcon(): string {
    return SoundType.icon ?? super.getIcon();
  }

  protected getTypes(): string[] {
    return ['Sound'];
  }
}
