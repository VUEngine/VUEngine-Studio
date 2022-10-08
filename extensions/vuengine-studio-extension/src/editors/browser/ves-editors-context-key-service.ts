import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { ContextKeyService, ContextKey } from '@theia/core/lib/browser/context-key-service';

@injectable()
export class VesEditorsContextKeyService {
    @inject(ContextKeyService)
    protected readonly contextKeyService: ContextKeyService;

    protected _graphicalEditorsFocus: ContextKey<boolean>;
    get graphicalEditorsFocus(): ContextKey<boolean> {
        return this._graphicalEditorsFocus;
    }

    @postConstruct()
    protected init(): void {
        this._graphicalEditorsFocus = this.contextKeyService.createKey<boolean>(
            'graphicalEditorFocus',
            false
        );
    }
}
