import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { ContextKeyService, ContextKey } from '@theia/core/lib/browser/context-key-service';
import { EMULATOR_FOCUS_CONTEXT } from 'vueport-core/lib/browser/emulator-commands';

export { EMULATOR_FOCUS_CONTEXT };

@injectable()
export class VesEmulatorContextKeyService {
  @inject(ContextKeyService)
  protected readonly contextKeyService: ContextKeyService;

  protected _emulatorFocus: ContextKey<boolean>;
  get emulatorFocus(): ContextKey<boolean> {
    return this._emulatorFocus;
  }

  @postConstruct()
  protected init(): void {
    this._emulatorFocus = this.contextKeyService.createKey<boolean>(
      EMULATOR_FOCUS_CONTEXT,
      false
    );
  }
}
