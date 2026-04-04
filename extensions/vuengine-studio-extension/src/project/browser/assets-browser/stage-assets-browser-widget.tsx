import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { StageType } from '../types/Stage';
import { AssetsBrowserWidget } from './assets-browser-widget';

@injectable()
export class StageAssetsBrowserWidget extends AssetsBrowserWidget {
  static readonly ID: string = `${AssetsBrowserWidget.ID}:Stage`;
  static readonly LABEL: string = `${AssetsBrowserWidget.LABEL}: ${StageType.schema.title}`;

  protected getId(): string {
    return StageAssetsBrowserWidget.ID;
  }

  protected getLabel(): string {
    return nls.localize('vuengine/projects/stageBrowser', 'Stage Browser');
  }

  protected getIcon(): string {
    return StageType.icon ?? super.getIcon();
  }

  protected getTypes(): string[] {
    return ['Stage'];
  }
}
