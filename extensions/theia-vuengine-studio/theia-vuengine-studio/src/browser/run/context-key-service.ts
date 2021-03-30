import { injectable, inject, interfaces, postConstruct } from "inversify";
import {
  ContextKeyService,
  ContextKey,
} from "@theia/core/lib/browser/context-key-service";

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
      "emulatorFocus",
      false
    );
  }
}

export function bindVesRunContextKeyService(bind: interfaces.Bind): void {
  bind(VesEmulatorContextKeyService)
    .toSelf()
    .inSingletonScope();
}
