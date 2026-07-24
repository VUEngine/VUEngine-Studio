import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { PcmType } from '../types/PCM';
import { AssetsBrowserWidget } from './assets-browser-widget';

@injectable()
export class PcmAssetsBrowserWidget extends AssetsBrowserWidget {
  static readonly ID: string = `${AssetsBrowserWidget.ID}:PCM`;
  static readonly LABEL: string = `${AssetsBrowserWidget.LABEL}: ${PcmType.schema.title}`;

  protected getId(): string {
    return PcmAssetsBrowserWidget.ID;
  }

  protected getLabel(): string {
    return nls.localize('vuengine/projects/pcmBrowser', 'PCM');
  }

  protected getIcon(): string {
    return PcmType.icon ?? super.getIcon();
  }

  protected getTypes(): string[] {
    return ['PCM'];
  }
}
