import { nls } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { ActorType } from '../types/Actor';
import { AssetsBrowserWidget } from './assets-browser-widget';

@injectable()
export class ActorAssetsBrowserWidget extends AssetsBrowserWidget {
  static readonly ID: string = `${AssetsBrowserWidget.ID}:Actor`;
  static readonly LABEL: string = `${AssetsBrowserWidget.LABEL}: ${ActorType.schema.title}`;

  protected getId(): string {
    return ActorAssetsBrowserWidget.ID;
  }

  protected getLabel(): string {
    return nls.localize('vuengine/projects/actorBrowser', 'Actors');
  }

  protected getIcon(): string {
    return ActorType.icon ?? super.getIcon();
  }

  protected getTypes(): string[] {
    return ['Actor'];
  }
}
