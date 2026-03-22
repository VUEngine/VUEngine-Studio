import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { ColumnTableType } from '../types/ColumnTable';
import { AssetsBrowserWidget } from './assets-browser-widget';

@injectable()
export class ColumnTableAssetsBrowserWidget extends AssetsBrowserWidget {
  static readonly ID: string = `${AssetsBrowserWidget.ID}:columnTable`;
  static readonly LABEL: string = `${AssetsBrowserWidget.LABEL}: ${ColumnTableType.schema.title}`;

  protected getId(): string {
    return ColumnTableAssetsBrowserWidget.ID;
  }

  protected getLabel(): string {
    return nls.localize('vuengine/projects/columnTableBrowser', 'Column Table Browser');
  }

  protected getIcon(): string {
    return ColumnTableType.icon ?? super.getIcon();
  }

  protected getTypes(): string[] {
    return ['ColumnTable'];
  }
}
