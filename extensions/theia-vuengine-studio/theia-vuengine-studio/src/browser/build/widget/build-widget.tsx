import * as React from "react";
import { inject, injectable, postConstruct } from "inversify";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { VesStateModel } from "../../common/vesStateModel";
import { CommandService } from "@theia/core";
import { VesBuildCommand, VesBuildSetModeCommand } from "../commands";
import { VesProcessService } from "../../../common/process-service-protocol";
import { abortBuild } from "../commands/build";
import { PreferenceService } from "@theia/core/lib/browser";
import { VesBuildModePreference } from "../preferences";
import { BuildLogLine, BuildMode } from "../types";
import { WorkspaceService } from "@theia/workspace/lib/browser";

@injectable()
export class VesBuildWidget extends ReactWidget {
  @inject(CommandService) private readonly commandService: CommandService;
  @inject(PreferenceService) private readonly preferenceService: PreferenceService;
  @inject(VesProcessService) private readonly vesProcessService: VesProcessService;
  @inject(VesStateModel) private readonly vesState: VesStateModel;
  @inject(WorkspaceService) private readonly workspaceService: WorkspaceService;

  static readonly ID = "vesBuildWidget";
  static readonly LABEL = VesBuildCommand.label || "Build";

  protected state = {
    showLog: [] as boolean[],
  }

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesBuildWidget.ID;
    this.title.iconClass = "fa fa-wrench";
    this.title.closable = true;
    this.title.label = VesBuildWidget.LABEL;
    this.title.caption = VesBuildWidget.LABEL;
    this.update();

    this.vesState.onDidChangeBuildStatus(() => this.update());
    this.vesState.onDidChangeBuildMode(() => this.update());
  }

  protected render(): React.ReactNode {
    return <>
      <div className="buildActions">
        {this.vesState.buildStatus.active && this.vesState.buildStatus.progress > -1 &&
          <div className="buildPanel">
            <div className="vesProgressBar">
              <div style={{ width: this.vesState.buildStatus.progress + "%" }}>
                <span>
                  {this.vesState.buildStatus.progress === 100
                    ? <><i className="fa fa-check"></i> Done</>
                    : <>{this.vesState.buildStatus.progress}%</>
                  }
                </span>
              </div>
            </div>
          </div>
        }
        {!this.vesState.buildStatus.active &&
          <div className="buildButtons">
            <div>
              <button className="theia-button build" disabled={!this.workspaceService.opened} onClick={() => this.commandService.executeCommand(VesBuildCommand.id)}>
                <i className="fa fa-wrench"></i> Build
            </button>
            </div>
            <div>
              <select
                className="theia-select"
                title="Build Mode"
                value={this.preferenceService.get(VesBuildModePreference.id)}
                onChange={(e) => { this.commandService.executeCommand(VesBuildSetModeCommand.id, e.currentTarget.value); }}
              >
                {Object.keys(BuildMode).map((value, index) => {
                  return <option value={value}>
                    {Object.values(BuildMode)[index]}
                  </option>
                })}
              </select>
            </div>
          </div>
        }
        {this.vesState.buildStatus.active &&
          <button className="theia-button secondary" onClick={() => abortBuild(this.vesProcessService, this.vesState)}>
            Abort
          </button>
        }
      </div>
      <div className="mainPanel">
        <div className="buildLogWrapper">
          <div className="buildLog">
            {this.vesState.buildStatus.log.log.map((line: BuildLogLine) =>
              <div>
                <span className="timestamp">
                  {new Date(line.timestamp).toTimeString().substr(0, 8)}
                </span>
                <span className="text">
                  {line.text}
                </span>
              </div>)}
          </div>
        </div>
      </div>
    </>
  }
}
