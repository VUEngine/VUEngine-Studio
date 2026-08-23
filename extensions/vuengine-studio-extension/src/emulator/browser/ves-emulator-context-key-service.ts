import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { ContextKeyService, ContextKey } from '@theia/core/lib/browser/context-key-service';

/** The `when` clause every emulator input mapping is scoped to. */
export const EMULATOR_FOCUS_CONTEXT = 'emulatorFocus';

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
