import { injectable } from '@theia/core/shared/inversify';
import { RumbleEffectType } from '../types/RumbleEffect';
import { AssetsBrowserWidget } from './assets-browser-widget';
import { nls } from '@theia/core';

@injectable()
export class RumbleEffectAssetsBrowserWidget extends AssetsBrowserWidget {
  static readonly ID: string = `${AssetsBrowserWidget.ID}:rumbleEffect`;
  static readonly LABEL: string = `${AssetsBrowserWidget.LABEL}: ${RumbleEffectType.schema.title}`;

  protected getId(): string {
    return RumbleEffectAssetsBrowserWidget.ID;
  }

  protected getLabel(): string {
    return nls.localize('vuengine/projects/rumbleEffectBrowser', 'Rumble Effect Browser');
  }

  protected getIcon(): string {
    return RumbleEffectType.icon ?? super.getIcon();
  }

  protected getTypes(): string[] {
    return ['RumbleEffect'];
  }
}
