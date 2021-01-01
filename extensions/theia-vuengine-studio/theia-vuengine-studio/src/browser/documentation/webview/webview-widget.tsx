import * as React from "react";
import { inject, injectable, postConstruct } from "inversify";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { ColorRegistry } from "@theia/core/lib/browser/color-registry";
import { ThemeService } from "@theia/core/lib/browser/theming";

@injectable()
export class VesWebViewWidget extends ReactWidget {
  @inject(ColorRegistry) private readonly colorRegistry: ColorRegistry;
  @inject(ThemeService) private readonly themeService: ThemeService;

  static readonly ID = "ves-webview-title";
  static readonly LABEL = "Documentation";

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesWebViewWidget.ID;
    this.title.label = VesWebViewWidget.LABEL;
    this.title.caption = VesWebViewWidget.LABEL;
    this.title.iconClass = "fa fa-file-text-o";
    this.title.closable = true;
    this.themeService.onThemeChange(() => setTimeout(() => { this.injectCssVariables() }, 1));
    // TODO: hook into electron rerender as well
    this.update();
  }

  protected render(): React.ReactNode {
    return <>
      <iframe id="vesWebview" src={this.getResoure()} onLoad={() => this.injectCssVariables()}></iframe>
    </>;
  }

  protected getResoure() {
    return "file:///Users/chris/dev/vuengine-studio/vuengine/vuengine-core/doc/html/index.html";
  }

  protected injectCssVariables() {

    let themeVars = "";

    for (const id of this.colorRegistry.getColors()) {
      const variable = this.colorRegistry.getCurrentCssVariable(id);
      if (variable) themeVars += `${variable.name}:${variable.value};`;
    }

    // @ts-ignore
    document.getElementById("vesWebview").contentWindow.document.getElementsByTagName("HTML")[0].style = themeVars;
  }
}
