import * as React from "react";
import { inject, injectable, postConstruct } from "inversify";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { VesStateModel } from "../../common/vesStateModel";
import { CommandService } from "@theia/core";
import { VesBuildCommand, VesBuildSetModeCommand, VesBuildToggleDumpElfCommand, VesBuildTogglePedanticWarningsCommand } from "../commands";
import { VesProcessService } from "../../../common/process-service-protocol";
import { abortBuild } from "../commands/build";
import { PreferenceService } from "@theia/core/lib/browser";
import { VesBuildDumpElfPreference, VesBuildModePreference, VesBuildPedanticWarningsPreference } from "../preferences";
import { BuildLogLine, BuildLogLineType, BuildMode } from "../types";
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
    showOptions: false,
    logFilter: BuildLogLineType.Normal,
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
    this.preferenceService.onPreferenceChanged(({ preferenceName }) => {
      switch (preferenceName) {
        case VesBuildModePreference.id:
        case VesBuildDumpElfPreference.id:
        case VesBuildPedanticWarningsPreference.id:
          this.update();
          break;
      }
    });
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
          <>
            <div className="buildButtons">
              <button className="theia-button build" disabled={!this.workspaceService.opened} onClick={() => this.commandService.executeCommand(VesBuildCommand.id)}>
                <i className="fa fa-wrench"></i> Build
              </button>
              <button className="theia-button secondary" onClick={() => this.toggleBuildOptions()}>
                <i className="fa fa-cog"></i>
              </button>
            </div>
            {this.state.showOptions &&
              <div className="buildOptions theia-settings-container">
                <div className="single-pref">
                  <div className="pref-name">Build Mode</div>
                  <div className="pref-content-container string">
                    <div className="pref-input">
                      <select
                        className="theia-select"
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
                </div>
                <div className="singe-pref">
                  <div className="pref-name">Dump Elf</div>
                  <div className="pref-content-container boolean">
                    <div className="pref-description">
                      {VesBuildDumpElfPreference.property.description}
                    </div>
                    <div className="pref-input">
                      <label>
                        <input
                          type="checkbox"
                          className="theia-input"
                          checked={this.preferenceService.get(VesBuildDumpElfPreference.id)}
                          onClick={() => this.commandService.executeCommand(VesBuildToggleDumpElfCommand.id)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
                <div className="singe-pref">
                  <div className="pref-name">Pedantic Warnings</div>
                  <div className="pref-content-container boolean">
                    <div className="pref-description">
                      {VesBuildPedanticWarningsPreference.property.description}
                    </div>
                    <div className="pref-input">
                      <label>
                        <input
                          type="checkbox"
                          className="theia-input"
                          checked={this.preferenceService.get(VesBuildPedanticWarningsPreference.id)}
                          onClick={() => this.commandService.executeCommand(VesBuildTogglePedanticWarningsCommand.id)}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>}
          </>
        }
        {this.vesState.buildStatus.active &&
          <>
            <div className="buildButtons">
              <button className="theia-button secondary" onClick={() => abortBuild(this.vesProcessService, this.vesState)}>
                Abort
              </button>
            </div>
          </>
        }
      </div>
      <div className="buildMeta">
        {this.vesState.buildStatus.log.length > 0 &&
          <>
            <div className="buildStatus">
              {this.vesState.buildStatus.active
                ? <div>
                  <i className="fa fa-cog fa-spin"></i> {this.vesState.buildStatus.step}...
                  </div>
                : this.vesState.buildStatus.step === "done"
                  ? <div className="success">
                    <i className="fa fa-check"></i> Build successful
                    </div>
                  : <div className="error">
                    <i className="fa fa-times-circle-o"></i> Build {this.vesState.buildStatus.step}
                  </div>
              }
              <div>
                {this.getDuration()} – {this.vesState.buildStatus.buildMode} – PID {this.vesState.buildStatus.processId}
              </div>
            </div>
            <div className="buildProblems">
              <button
                className={this.state.logFilter === BuildLogLineType.Warning ? "theia-button" : "theia-button secondary"}
                title="Show only warnings"
                onClick={() => this.toggleFilter(BuildLogLineType.Warning)}
              >
                <i className="fa fa-exclamation-triangle"></i> {this.vesState.buildStatus.log.filter((l) => l.type === BuildLogLineType.Warning).length}
              </button>
              <button
                className={this.state.logFilter === BuildLogLineType.Error ? "theia-button" : "theia-button secondary"}
                title="Show only errors"
                onClick={() => this.toggleFilter(BuildLogLineType.Error)}
              >
                <i className="fa fa-times-circle-o"></i> {this.vesState.buildStatus.log.filter((l) => l.type === BuildLogLineType.Error).length}
              </button>
            </div>
          </>}
      </div>
      <div className="buildLogWrapper">
        {this.vesState.buildStatus.log.length > 0 &&
          <div className="buildLog">
            <div>
              {this.vesState.buildStatus.log.map((line: BuildLogLine) => {
                <div className={line.type}>
                  <span className="timestamp">
                    {new Date(line.timestamp).toTimeString().substr(0, 8)}
                  </span>
                  <span className="text">
                    {line.text}
                  </span>
                </div>
              })}
            </div>
          </div>}
      </div>
      <div className="buildSelector">
        <select
          className="theia-select"
          title="Build"
        >
          <option value="latest">
            {`✔ – ${new Date(this.vesState.buildStatus.log[0]?.timestamp).toUTCString()} – ${this.vesState.buildStatus.buildMode}`}
          </option>
        </select>
      </div>
    </>
  }

  protected toggleBuildOptions() {
    this.state.showOptions = !this.state.showOptions;
    this.update();
  }

  protected getDuration() {
    const startTimestamp = this.vesState.buildStatus.log[0]?.timestamp || 0;
    const endTimestamp = this.vesState.buildStatus.log[this.vesState.buildStatus.log.length - 1]?.timestamp || 0;
    const duration = endTimestamp - startTimestamp;
    const durationDate = new Date(duration);

    return `${durationDate.getMinutes().toString().padStart(2, "0")}:${durationDate.getSeconds().toString().padStart(2, "0")}`
  }

  protected toggleFilter(type: BuildLogLineType) {
    this.state.logFilter = this.state.logFilter !== type
      ? type
      : BuildLogLineType.Normal
    this.update();
  }
}
