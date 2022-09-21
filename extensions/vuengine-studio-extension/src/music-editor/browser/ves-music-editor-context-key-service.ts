import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { ContextKeyService, ContextKey } from '@theia/core/lib/browser/context-key-service';

@injectable()
export class VesMusicEditorContextKeyService {
  @inject(ContextKeyService)
  protected readonly contextKeyService: ContextKeyService;

  protected _musicEditorFocus: ContextKey<boolean>;
  get musicEditorFocus(): ContextKey<boolean> {
    return this._musicEditorFocus;
  }

  @postConstruct()
  protected init(): void {
    this._musicEditorFocus = this.contextKeyService.createKey<boolean>(
      'musicEditorFocus',
      false
    );
  }
}
