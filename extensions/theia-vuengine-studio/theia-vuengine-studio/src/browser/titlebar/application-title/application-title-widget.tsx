import * as React from "react";
import { inject, injectable, postConstruct } from "inversify";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { FrontendApplicationConfigProvider } from "@theia/core/lib/browser/frontend-application-config-provider";
import { VesCommonFunctions } from "../../common/common-functions";
import { WorkspaceService } from "@theia/workspace/lib/browser";

@injectable()
export class VesTitlebarApplicationTitleWidget extends ReactWidget {
  @inject(VesCommonFunctions) protected readonly commonFunctions: VesCommonFunctions;
  @inject(WorkspaceService) private readonly workspaceService: WorkspaceService

  static readonly ID = "ves-titlebar-application-title";
  static readonly LABEL = "Titlebar Action Buttons";

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesTitlebarApplicationTitleWidget.ID;
    this.title.label = VesTitlebarApplicationTitleWidget.LABEL;
    this.title.caption = VesTitlebarApplicationTitleWidget.LABEL;
    this.title.closable = false;
    this.addClass(`os-${this.commonFunctions.getOs()}`);
    this.update();

    this.workspaceService.onWorkspaceChanged(() => this.update())
  }

  protected render(): React.ReactNode {
    let { applicationName: title } = FrontendApplicationConfigProvider.get();
    const workspace = this.workspaceService.workspace;
    if (workspace !== undefined) {
      // TODO: attempt to retrieve project name from configuration file, use below as fallback
      if (this.workspaceService.workspace?.isFile) {
        const workspaceParts = workspace.name.split(".");
        workspaceParts.pop();
        title = `${workspaceParts.join(".")} (Workspace)`
      } else {
        title = workspace.name;
      }
    }
    return <>{title}</>;
  }
}
