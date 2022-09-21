import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { ContextKeyService, ContextKey } from '@theia/core/lib/browser/context-key-service';

@injectable()
export class VesScriptEditorContextKeyService {
  @inject(ContextKeyService)
  protected readonly contextKeyService: ContextKeyService;

  protected _scriptEditorFocus: ContextKey<boolean>;
  get scriptEditorFocus(): ContextKey<boolean> {
    return this._scriptEditorFocus;
  }

  @postConstruct()
  protected init(): void {
    this._scriptEditorFocus = this.contextKeyService.createKey<boolean>(
      'scriptEditorFocus',
      false
    );
  }
}
