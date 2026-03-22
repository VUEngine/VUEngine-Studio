import { injectable } from '@theia/core/shared/inversify';
import { AssetsBrowserWidget } from './assets-browser-widget';
import { LogicType } from '../types/Logic';
import { nls } from '@theia/core';

@injectable()
export class LogicAssetsBrowserWidget extends AssetsBrowserWidget {
  static readonly ID: string = `${AssetsBrowserWidget.ID}:logic`;
  static readonly LABEL: string = `${AssetsBrowserWidget.LABEL}: ${LogicType.schema.title}`;

  protected getId(): string {
    return LogicAssetsBrowserWidget.ID;
  }

  protected getLabel(): string {
    return nls.localize('vuengine/projects/logicBrowser', 'Logic Browser');
  }

  protected getIcon(): string {
    return LogicType.icon ?? super.getIcon();
  }

  protected getTypes(): string[] {
    return ['Logic'];
  }
}
