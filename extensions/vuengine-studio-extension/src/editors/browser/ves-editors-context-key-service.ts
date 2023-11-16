import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { ContextKeyService, ContextKey } from '@theia/core/lib/browser/context-key-service';

@injectable()
export class VesEditorsContextKeyService {
    @inject(ContextKeyService)
    protected readonly contextKeyService: ContextKeyService;

    protected _graphicalEditorFocus: ContextKey<boolean>;
    get graphicalEditorFocus(): ContextKey<boolean> {
        return this._graphicalEditorFocus;
    }

    @postConstruct()
    protected init(): void {
        this._graphicalEditorFocus = this.contextKeyService.createKey<boolean>(
            'graphicalEditorFocus',
            false
        );
    }
}
