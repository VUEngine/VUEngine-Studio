import { inject, injectable, interfaces, postConstruct } from "inversify";
import {
  AbstractViewContribution,
  bindViewContribution,
  FrontendApplicationContribution,
  OpenHandler,
  WidgetFactory,
} from "@theia/core/lib/browser";
import { VesEmulatorWidget, VesEmulatorWidgetOptions } from "./emulator-widget";
import { VesEmulatorOpenHandler } from "./emulator-open-handler";
import { VesEmulatorContextKeyService } from "../emulator-context-key-service";

@injectable()
export class VesEmulatorContribution extends AbstractViewContribution<VesEmulatorWidget> {
  @inject(VesEmulatorContextKeyService)
  protected readonly contextKeyService: VesEmulatorContextKeyService;

  constructor() {
    super({
      widgetId: VesEmulatorWidget.ID,
      widgetName: VesEmulatorWidget.LABEL,
      defaultWidgetOptions: { area: "main" },
    });
  }

  @postConstruct()
  protected async init(): Promise<void> {
    this.updateFocusedView();
    this.shell.onDidChangeActiveWidget(() => this.updateFocusedView());
  }

  protected updateFocusedView(): void {
    // emulatorFocus is just a faux context to allow remapping of emulator input, 
    // it should never be true, otherwise keydown won't work in emulator
    /*this.contextKeyService.emulatorFocus.set(
      this.shell.activeWidget instanceof VesEmulatorWidget
    );*/
  }
}

export function bindVesEmulatorView(bind: interfaces.Bind): void {
  bindViewContribution(bind, VesEmulatorContribution);
  bind(FrontendApplicationContribution).toService(VesEmulatorContribution);
  bind(OpenHandler)
    .to(VesEmulatorOpenHandler)
    .inSingletonScope();
  bind(VesEmulatorWidget).toSelf();
  bind(WidgetFactory)
    .toDynamicValue(({ container }) => ({
      id: VesEmulatorWidget.ID,
      createWidget: (options: VesEmulatorWidgetOptions) => {
        const child = container.createChild();
        child.bind(VesEmulatorWidgetOptions).toConstantValue(options);
        child.bind(VesEmulatorWidget).toSelf();
        return child.get(VesEmulatorWidget);
      },
    }))
  //.inSingletonScope();
}
