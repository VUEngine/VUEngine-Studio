import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { BrightnessRepeatType } from '../types/BrightnessRepeat';
import { AssetsBrowserWidget } from './assets-browser-widget';

@injectable()
export class BrightnessRepeatAssetsBrowserWidget extends AssetsBrowserWidget {
  static readonly ID: string = `${AssetsBrowserWidget.ID}:brightnessRepeat`;
  static readonly LABEL: string = `${AssetsBrowserWidget.LABEL}: ${BrightnessRepeatType.schema.title}`;

  protected getId(): string {
    return BrightnessRepeatAssetsBrowserWidget.ID;
  }

  protected getLabel(): string {
    return nls.localize('vuengine/projects/brightnessRepeatBrowser', 'Brightness Repeat Browser');
  }

  protected getIcon(): string {
    return BrightnessRepeatType.icon ?? super.getIcon();
  }

  protected getTypes(): string[] {
    return ['BrightnessRepeat'];
  }
}
