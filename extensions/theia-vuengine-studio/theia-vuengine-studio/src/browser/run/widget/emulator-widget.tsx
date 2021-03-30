import * as React from "react";
import { basename, join as joinPath } from "path";
import { inject, injectable, postConstruct } from "inversify";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import {
  KeybindingRegistry,
  Message,
  PreferenceScope,
  PreferenceService,
} from "@theia/core/lib/browser";
import { EmulationMode, EmulatorScale, StereoMode } from "../types";
import {
  getKeybindingLabel,
  getResourcesPath,
  getRomPath,
} from "../../common/functions";
import {
  VesRunEmulatorEmulationModePreference,
  VesRunEmulatorScalePreference,
  VesRunEmulatorStereoModePreference,
} from "../preferences";
import { IMAGE_VB_CONTROLLER } from "../images/vb-controller";
import { CommandService } from "@theia/core";
import {
  VesEmulatorInputLUpCommand,
  VesEmulatorInputLRightCommand,
  VesEmulatorInputLDownCommand,
  VesEmulatorInputLLeftCommand,
  VesEmulatorInputStartCommand,
  VesEmulatorInputSelectCommand,
  VesEmulatorInputLTriggerCommand,
  VesEmulatorInputRUpCommand,
  VesEmulatorInputRRightCommand,
  VesEmulatorInputRDownCommand,
  VesEmulatorInputRLeftCommand,
  VesEmulatorInputBCommand,
  VesEmulatorInputACommand,
  VesEmulatorInputRTriggerCommand,
} from "../commands";
import { KeymapsCommands } from "@theia/keymaps/lib/browser";

const datauri = require("datauri");

export const VesEmulatorWidgetOptions = Symbol("VesEmulatorWidgetOptions");
export interface VesEmulatorWidgetOptions {
  uri: string;
}

export type vesEmulatorWidgetState = {
  status: string;
  lowBattery: boolean;
  muted: boolean;
  showControls: boolean;
};

@injectable()
export class VesEmulatorWidget extends ReactWidget {
  @inject(CommandService)
  protected readonly commandService: CommandService;
  @inject(KeybindingRegistry)
  protected readonly keybindingRegistry!: KeybindingRegistry;
  @inject(PreferenceService)
  protected readonly preferenceService: PreferenceService;
  @inject(VesEmulatorWidgetOptions)
  protected readonly options: VesEmulatorWidgetOptions;

  static readonly ID = "vesEmulatorWidget";
  static readonly LABEL = "Emulator";

  static readonly RESOLUTIONX = 384;
  static readonly RESOLUTIONY = 224;

  protected wrapperRef = React.createRef<HTMLDivElement>();
  protected iframeRef = React.createRef<HTMLIFrameElement>();

  protected controllerButtonAssignmentSelectRef = React.createRef<
    HTMLDivElement
  >();
  protected controllerButtonAssignmentStartRef = React.createRef<
    HTMLDivElement
  >();
  protected controllerButtonAssignmentARef = React.createRef<HTMLDivElement>();
  protected controllerButtonAssignmentBRef = React.createRef<HTMLDivElement>();
  protected controllerButtonAssignmentLUpRef = React.createRef<
    HTMLDivElement
  >();
  protected controllerButtonAssignmentLLeftRef = React.createRef<
    HTMLDivElement
  >();
  protected controllerButtonAssignmentLRightRef = React.createRef<
    HTMLDivElement
  >();
  protected controllerButtonAssignmentLDownRef = React.createRef<
    HTMLDivElement
  >();
  protected controllerButtonAssignmentRUpRef = React.createRef<
    HTMLDivElement
  >();
  protected controllerButtonAssignmentRLeftRef = React.createRef<
    HTMLDivElement
  >();
  protected controllerButtonAssignmentRRightRef = React.createRef<
    HTMLDivElement
  >();
  protected controllerButtonAssignmentRDownRef = React.createRef<
    HTMLDivElement
  >();
  protected controllerButtonAssignmentLTRef = React.createRef<HTMLDivElement>();
  protected controllerButtonAssignmentRTRef = React.createRef<HTMLDivElement>();
  protected controllerButtonSelectRef = React.createRef<HTMLDivElement>();
  protected controllerButtonStartRef = React.createRef<HTMLDivElement>();
  protected controllerButtonARef = React.createRef<HTMLDivElement>();
  protected controllerButtonBRef = React.createRef<HTMLDivElement>();
  protected controllerButtonLUpRef = React.createRef<HTMLDivElement>();
  protected controllerButtonLLeftRef = React.createRef<HTMLDivElement>();
  protected controllerButtonLRightRef = React.createRef<HTMLDivElement>();
  protected controllerButtonLDownRef = React.createRef<HTMLDivElement>();
  protected controllerButtonRUpRef = React.createRef<HTMLDivElement>();
  protected controllerButtonRLeftRef = React.createRef<HTMLDivElement>();
  protected controllerButtonRRightRef = React.createRef<HTMLDivElement>();
  protected controllerButtonRDownRef = React.createRef<HTMLDivElement>();
  protected controllerButtonLTRef = React.createRef<HTMLDivElement>();
  protected controllerButtonRTRef = React.createRef<HTMLDivElement>();

  protected state: vesEmulatorWidgetState = {
    status: "running",
    lowBattery: false,
    muted: false,
    showControls: false,
  };

  @postConstruct()
  protected async init(): Promise<void> {
    const label = this.options
      ? basename(this.options.uri)
      : VesEmulatorWidget.LABEL;

    this.id = VesEmulatorWidget.ID;
    this.title.label = label;
    this.title.caption = label;
    this.title.iconClass = "fa fa-play";
    this.title.closable = true;
    this.node.tabIndex = 0; // required for this.node.focus() to work in this.onActivateRequest()
    this.update();

    this.keybindingRegistry.onKeybindingsChanged(() => this.update());
  }

  protected startEmulator(self: any) {
    const romPath = this.options ? this.options.uri : getRomPath();

    datauri(romPath, (err: any) => {
      if (err) throw err;
    }).then((content: string) => {
      self.sendRetroArchConfig();
      self.sendCoreOptions();
      self.sendCommand("start", content);
    });
  }

  protected onResize() {
    this.update();
  }

  protected onAfterShow() {
    this.iframeRef.current?.focus();
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.node.focus();
  }

  protected render(): React.ReactNode {
    const canvasDimensions = this.getCanvasDimensions();
    return (
      <>
        <div id="vesEmulatorUi">
          <div>
            <button
              className="theia-button secondary"
              title={this.state.status === "paused" ? "Resume" : "Pause"}
              onClick={() => this.togglePause()}
              disabled={this.state.showControls}
            >
              <i
                className={
                  this.state.status === "paused" ? "fa fa-play" : "fa fa-pause"
                }
              ></i>
            </button>
            <button
              className="theia-button secondary"
              title="Reset"
              onClick={() => this.reset()}
              disabled={this.state.showControls}
            >
              <i className="fa fa-refresh"></i>
            </button>
            {/*/}
              <button
                className="theia-button secondary"
                title="Clean"
                onClick={() => this.sendCommand("clean")}
                disabled={this.state.showControls}
              >
                <i className="fa fa-trash"></i>
              </button>
            {/**/}
          </div>
          <div>
            {/* TODO: find way to _toggle_ rewind */}
            <button
              className="theia-button secondary"
              title="Rewind"
              onClick={() => this.sendCommand("rewind")}
              disabled={this.state.showControls}
            >
              <i className="fa fa-backward"></i>
            </button>
            <button
              className="theia-button secondary"
              title="Frame Advance"
              onClick={() => {
                this.state.status = "paused";
                this.sendCommand("frameAdvance");
                this.update();
              }}
              disabled={this.state.showControls}
            >
              <i className="fa fa-step-forward"></i>
            </button>

            <button
              className="theia-button secondary"
              title="Toggle Fast Forward"
              onClick={() => this.sendCommand("fastForward")}
              disabled={this.state.showControls}
            >
              <i className="fa fa-forward"></i>
            </button>
          </div>
          <div>
            <button
              className="theia-button secondary"
              title={this.state.muted ? "Unmute" : "Mute"}
              onClick={() => {
                this.state.muted = !this.state.muted;
                this.sendCommand("mute");
                this.update();
              }}
              disabled={this.state.showControls}
            >
              <i
                className={
                  this.state.muted ? "fa fa-volume-off" : "fa fa-volume-up"
                }
              ></i>
            </button>
          </div>
          {this.wrapperRef.current &&
            this.wrapperRef.current?.offsetWidth > 900 && (
              <div>
                <button
                  className="theia-button secondary"
                  title="Increase Save State Slot"
                  onClick={() => this.sendCommand("increaseSaveSlot")}
                  disabled={this.state.showControls}
                >
                  <i className="fa fa-chevron-up"></i>
                </button>
                <button
                  className="theia-button secondary"
                  title="Decrease Save State Slot"
                  onClick={() => this.sendCommand("decreaseSaveSlot")}
                  disabled={this.state.showControls}
                >
                  <i className="fa fa-chevron-down"></i>
                </button>
                <button
                  className="theia-button secondary"
                  title="Save State"
                  onClick={() => this.sendCommand("saveState")}
                  disabled={this.state.showControls}
                >
                  <i className="fa fa-level-down"></i>{" "}
                  <i className="fa fa-bookmark-o"></i>
                </button>
                <button
                  className="theia-button secondary"
                  title="Load State"
                  onClick={() => this.sendCommand("loadState")}
                  disabled={this.state.showControls}
                >
                  <i className="fa fa-bookmark-o"></i>{" "}
                  <i className="fa fa-level-up"></i>
                </button>
              </div>
            )}
          {this.wrapperRef.current &&
            this.wrapperRef.current?.offsetWidth > 750 && (
              <div>
                <select
                  className="theia-select"
                  title="Scale"
                  value={this.preferenceService.get(
                    VesRunEmulatorScalePreference.id
                  )}
                  onChange={(value) => this.setScale(value)}
                  disabled={this.state.showControls}
                >
                  {Object.keys(EmulatorScale).map((value, index) => {
                    return (
                      <option value={value}>
                        {Object.values(EmulatorScale)[index]}
                      </option>
                    );
                  })}
                </select>
                <select
                  className="theia-select"
                  title="Stereo Mode"
                  value={this.preferenceService.get(
                    VesRunEmulatorStereoModePreference.id
                  )}
                  onChange={(value) => this.setStereoMode(value)}
                  disabled={this.state.showControls}
                >
                  {Object.keys(StereoMode).map((value, index) => {
                    return (
                      <option value={value}>
                        {Object.values(StereoMode)[index]}
                      </option>
                    );
                  })}
                </select>
                <select
                  className="theia-select"
                  title="Emulation Mode"
                  value={this.preferenceService.get(
                    VesRunEmulatorEmulationModePreference.id
                  )}
                  onChange={(value) => this.setEmulationMode(value)}
                  disabled={this.state.showControls}
                >
                  {Object.keys(EmulationMode).map((value, index) => {
                    return (
                      <option value={value}>
                        {Object.values(EmulationMode)[index]}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          {/*/}
          <div>
            <button
              className="theia-button secondary"
              title="Fullscreen"
              onClick={() => this.sendCommand("fullscreen")}
              disabled={this.state.showControls}
            >
              <i className="fa fa-arrows-alt"></i>
            </button>
          </div>
          {/**/}
          {/*/}
          <div>
            <button
              className="theia-button secondary"
              title="Save screenshot"
              onClick={() => this.saveScreenshot()}
              disabled={this.state.showControls}
            >
              <i className="fa fa-camera"></i>
            </button>
          </div>
          {/**/}
          {/*/}
          <div>
            <button
              className="theia-button secondary"
              title="Toggle Low Battery flag"
              onClick={() => this.toggleBatteryLow()}
              disabled={this.state.showControls}
            >
              <i className={this.state.lowBattery ? "fa fa-battery-empty" : "fa fa-battery-full"}></i>
            </button>
          </div>
          {/**/}
          <div>
            <button
              className={
                this.state.showControls
                  ? `theia-button`
                  : `theia-button secondary`
              }
              title="Configure Input"
              onClick={() => this.toggleControlsOverlay()}
            >
              <i className="fa fa-keyboard-o"></i>
            </button>
          </div>
        </div>
        <div id="vesEmulatorWrapper" ref={this.wrapperRef}>
          <iframe
            id="vesEmulatorFrame"
            ref={this.iframeRef}
            src={this.getResource()}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            onLoad={() => this.startEmulator(this)}
          ></iframe>
        </div>
        {this.state.showControls && (
          <div className="controlsOverlay">
            <div>
              <div className="controlsController">
                <div className="buttonAssignmentGroup">
                  <div
                    ref={this.controllerButtonAssignmentLTRef}
                    onMouseEnter={() =>
                      this.toggleRefHighlighted(this.controllerButtonLTRef)
                    }
                    onMouseLeave={() =>
                      this.toggleRefHighlighted(this.controllerButtonLTRef)
                    }
                  >
                    <span>Left Trigger</span>
                    <span>
                      <button className="theia-button secondary">
                        {getKeybindingLabel(
                          this.keybindingRegistry,
                          VesEmulatorInputLTriggerCommand.id,
                          false
                        )}
                      </button>
                    </span>
                  </div>
                  <br />
                  <div
                    ref={this.controllerButtonAssignmentLUpRef}
                    onMouseEnter={() =>
                      this.toggleRefHighlighted(this.controllerButtonLUpRef)
                    }
                    onMouseLeave={() =>
                      this.toggleRefHighlighted(this.controllerButtonLUpRef)
                    }
                  >
                    <span>
                      Left D-Pad <i className="fa fa-fw fa-arrow-up"></i>
                    </span>
                    <span>
                      <button className="theia-button secondary">
                        {getKeybindingLabel(
                          this.keybindingRegistry,
                          VesEmulatorInputLUpCommand.id,
                          false
                        )}
                      </button>
                    </span>
                  </div>
                  <div
                    ref={this.controllerButtonAssignmentLRightRef}
                    onMouseEnter={() =>
                      this.toggleRefHighlighted(this.controllerButtonLRightRef)
                    }
                    onMouseLeave={() =>
                      this.toggleRefHighlighted(this.controllerButtonLRightRef)
                    }
                  >
                    <span>
                      Left D-Pad <i className="fa fa-fw fa-arrow-right"></i>
                    </span>
                    <span>
                      <button className="theia-button secondary">
                        {getKeybindingLabel(
                          this.keybindingRegistry,
                          VesEmulatorInputLRightCommand.id,
                          false
                        )}
                      </button>
                    </span>
                  </div>
                  <div
                    ref={this.controllerButtonAssignmentLDownRef}
                    onMouseEnter={() =>
                      this.toggleRefHighlighted(this.controllerButtonLDownRef)
                    }
                    onMouseLeave={() =>
                      this.toggleRefHighlighted(this.controllerButtonLDownRef)
                    }
                  >
                    <span>
                      Left D-Pad <i className="fa fa-fw fa-arrow-down"></i>
                    </span>
                    <span>
                      <button className="theia-button secondary">
                        {getKeybindingLabel(
                          this.keybindingRegistry,
                          VesEmulatorInputLDownCommand.id,
                          false
                        )}
                      </button>
                    </span>
                  </div>
                  <div
                    ref={this.controllerButtonAssignmentLLeftRef}
                    onMouseEnter={() =>
                      this.toggleRefHighlighted(this.controllerButtonLLeftRef)
                    }
                    onMouseLeave={() =>
                      this.toggleRefHighlighted(this.controllerButtonLLeftRef)
                    }
                  >
                    <span>
                      Left D-Pad <i className="fa fa-fw fa-arrow-left"></i>
                    </span>
                    <span>
                      <button className="theia-button secondary">
                        {getKeybindingLabel(
                          this.keybindingRegistry,
                          VesEmulatorInputLLeftCommand.id,
                          false
                        )}
                      </button>
                    </span>
                  </div>
                  <br />
                  <div
                    ref={this.controllerButtonAssignmentSelectRef}
                    onMouseEnter={() =>
                      this.toggleRefHighlighted(this.controllerButtonSelectRef)
                    }
                    onMouseLeave={() =>
                      this.toggleRefHighlighted(this.controllerButtonSelectRef)
                    }
                  >
                    <span>Select </span>
                    <span>
                      <button className="theia-button secondary">
                        {getKeybindingLabel(
                          this.keybindingRegistry,
                          VesEmulatorInputSelectCommand.id,
                          false
                        )}
                      </button>
                    </span>
                  </div>
                  <div
                    ref={this.controllerButtonAssignmentStartRef}
                    onMouseEnter={() =>
                      this.toggleRefHighlighted(this.controllerButtonStartRef)
                    }
                    onMouseLeave={() =>
                      this.toggleRefHighlighted(this.controllerButtonStartRef)
                    }
                  >
                    <span>Start </span>
                    <span>
                      <button className="theia-button secondary">
                        {getKeybindingLabel(
                          this.keybindingRegistry,
                          VesEmulatorInputStartCommand.id,
                          false
                        )}
                      </button>
                    </span>
                  </div>
                </div>
                <div>
                  <div className="controllerImage">
                    <img src={IMAGE_VB_CONTROLLER} />
                    <div
                      className="buttonOverlay select"
                      ref={this.controllerButtonSelectRef}
                      onMouseEnter={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentSelectRef
                        )
                      }
                      onMouseLeave={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentSelectRef
                        )
                      }
                    ></div>
                    <div
                      className="buttonOverlay start"
                      ref={this.controllerButtonStartRef}
                      onMouseEnter={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentStartRef
                        )
                      }
                      onMouseLeave={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentStartRef
                        )
                      }
                    ></div>
                    <div
                      className="buttonOverlay a"
                      ref={this.controllerButtonARef}
                      onMouseEnter={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentARef
                        )
                      }
                      onMouseLeave={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentARef
                        )
                      }
                    ></div>
                    <div
                      className="buttonOverlay b"
                      ref={this.controllerButtonBRef}
                      onMouseEnter={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentBRef
                        )
                      }
                      onMouseLeave={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentBRef
                        )
                      }
                    ></div>
                    <div
                      className="buttonOverlay lup"
                      ref={this.controllerButtonLUpRef}
                      onMouseEnter={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentLUpRef
                        )
                      }
                      onMouseLeave={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentLUpRef
                        )
                      }
                    ></div>
                    <div
                      className="buttonOverlay lleft"
                      ref={this.controllerButtonLLeftRef}
                      onMouseEnter={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentLLeftRef
                        )
                      }
                      onMouseLeave={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentLLeftRef
                        )
                      }
                    ></div>
                    <div
                      className="buttonOverlay lright"
                      ref={this.controllerButtonLRightRef}
                      onMouseEnter={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentLRightRef
                        )
                      }
                      onMouseLeave={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentLRightRef
                        )
                      }
                    ></div>
                    <div
                      className="buttonOverlay ldown"
                      ref={this.controllerButtonLDownRef}
                      onMouseEnter={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentLDownRef
                        )
                      }
                      onMouseLeave={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentLDownRef
                        )
                      }
                    ></div>
                    <div
                      className="buttonOverlay rup"
                      ref={this.controllerButtonRUpRef}
                      onMouseEnter={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentRUpRef
                        )
                      }
                      onMouseLeave={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentRUpRef
                        )
                      }
                    ></div>
                    <div
                      className="buttonOverlay rleft"
                      ref={this.controllerButtonRLeftRef}
                      onMouseEnter={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentRLeftRef
                        )
                      }
                      onMouseLeave={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentRLeftRef
                        )
                      }
                    ></div>
                    <div
                      className="buttonOverlay rright"
                      ref={this.controllerButtonRRightRef}
                      onMouseEnter={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentRRightRef
                        )
                      }
                      onMouseLeave={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentRRightRef
                        )
                      }
                    ></div>
                    <div
                      className="buttonOverlay rdown"
                      ref={this.controllerButtonRDownRef}
                      onMouseEnter={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentRDownRef
                        )
                      }
                      onMouseLeave={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentRDownRef
                        )
                      }
                    ></div>
                    <div
                      className="buttonOverlay lt"
                      ref={this.controllerButtonLTRef}
                      onMouseEnter={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentLTRef
                        )
                      }
                      onMouseLeave={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentLTRef
                        )
                      }
                    ></div>
                    <div
                      className="buttonOverlay rt"
                      ref={this.controllerButtonRTRef}
                      onMouseEnter={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentRTRef
                        )
                      }
                      onMouseLeave={() =>
                        this.toggleRefHighlighted(
                          this.controllerButtonAssignmentRTRef
                        )
                      }
                    ></div>
                  </div>
                </div>
                <div className="buttonAssignmentGroup">
                  <div
                    ref={this.controllerButtonAssignmentRTRef}
                    onMouseEnter={() =>
                      this.toggleRefHighlighted(this.controllerButtonRTRef)
                    }
                    onMouseLeave={() =>
                      this.toggleRefHighlighted(this.controllerButtonRTRef)
                    }
                  >
                    <span>Right Trigger</span>
                    <span>
                      <button className="theia-button secondary">
                        {getKeybindingLabel(
                          this.keybindingRegistry,
                          VesEmulatorInputRTriggerCommand.id,
                          false
                        )}
                      </button>
                    </span>
                  </div>
                  <br />
                  <div
                    ref={this.controllerButtonAssignmentRUpRef}
                    onMouseEnter={() =>
                      this.toggleRefHighlighted(this.controllerButtonRUpRef)
                    }
                    onMouseLeave={() =>
                      this.toggleRefHighlighted(this.controllerButtonRUpRef)
                    }
                  >
                    <span>
                      Right D-Pad <i className="fa fa-fw fa-arrow-up"></i>
                    </span>
                    <span>
                      <button className="theia-button secondary">
                        {getKeybindingLabel(
                          this.keybindingRegistry,
                          VesEmulatorInputRUpCommand.id,
                          false
                        )}
                      </button>
                    </span>
                  </div>
                  <div
                    ref={this.controllerButtonAssignmentRRightRef}
                    onMouseEnter={() =>
                      this.toggleRefHighlighted(this.controllerButtonRRightRef)
                    }
                    onMouseLeave={() =>
                      this.toggleRefHighlighted(this.controllerButtonRRightRef)
                    }
                  >
                    <span>
                      Right D-Pad <i className="fa fa-fw fa-arrow-right"></i>
                    </span>
                    <span>
                      <button className="theia-button secondary">
                        {getKeybindingLabel(
                          this.keybindingRegistry,
                          VesEmulatorInputRRightCommand.id,
                          false
                        )}
                      </button>
                    </span>
                  </div>
                  <div
                    ref={this.controllerButtonAssignmentRDownRef}
                    onMouseEnter={() =>
                      this.toggleRefHighlighted(this.controllerButtonRDownRef)
                    }
                    onMouseLeave={() =>
                      this.toggleRefHighlighted(this.controllerButtonRDownRef)
                    }
                  >
                    <span>
                      Right D-Pad <i className="fa fa-fw fa-arrow-down"></i>
                    </span>
                    <span>
                      <button className="theia-button secondary">
                        {getKeybindingLabel(
                          this.keybindingRegistry,
                          VesEmulatorInputRDownCommand.id,
                          false
                        )}
                      </button>
                    </span>
                  </div>
                  <div
                    ref={this.controllerButtonAssignmentRLeftRef}
                    onMouseEnter={() =>
                      this.toggleRefHighlighted(this.controllerButtonRLeftRef)
                    }
                    onMouseLeave={() =>
                      this.toggleRefHighlighted(this.controllerButtonRLeftRef)
                    }
                  >
                    <span>
                      Right D-Pad <i className="fa fa-fw fa-arrow-left"></i>
                    </span>
                    <span>
                      <button className="theia-button secondary">
                        {getKeybindingLabel(
                          this.keybindingRegistry,
                          VesEmulatorInputRLeftCommand.id,
                          false
                        )}
                      </button>
                    </span>
                  </div>
                  <br />
                  <div
                    ref={this.controllerButtonAssignmentBRef}
                    onMouseEnter={() =>
                      this.toggleRefHighlighted(this.controllerButtonBRef)
                    }
                    onMouseLeave={() =>
                      this.toggleRefHighlighted(this.controllerButtonBRef)
                    }
                  >
                    <span>B</span>
                    <span>
                      <button className="theia-button secondary">
                        {getKeybindingLabel(
                          this.keybindingRegistry,
                          VesEmulatorInputBCommand.id,
                          false
                        )}
                      </button>
                    </span>
                  </div>
                  <div
                    ref={this.controllerButtonAssignmentARef}
                    onMouseEnter={() =>
                      this.toggleRefHighlighted(this.controllerButtonARef)
                    }
                    onMouseLeave={() =>
                      this.toggleRefHighlighted(this.controllerButtonARef)
                    }
                  >
                    <span>A</span>
                    <span>
                      <button className="theia-button secondary">
                        {getKeybindingLabel(
                          this.keybindingRegistry,
                          VesEmulatorInputACommand.id,
                          false
                        )}
                      </button>
                    </span>
                  </div>
                </div>
              </div>
              <div className="controlsKeyboard">
                <div className="buttonAssignmentGroup">
                  <div>
                    <span>Toggle Pause</span>
                    <span>
                      <button className="theia-button secondary">Space</button>
                    </span>
                  </div>
                  <div>
                    <span>Reset</span>
                    <span>
                      <button className="theia-button secondary">F10</button>
                    </span>
                  </div>
                  <div>
                    <span>Mute Audio</span>
                    <span>
                      <button className="theia-button secondary">F3</button>
                    </span>
                  </div>
                  {/*<div>
                    <span>Toggle Low Power</span>
                    <span>
                      <button className="theia-button secondary">W</button>
                    </span>
                  </div>
                  */}
                </div>
                <div className="buttonAssignmentGroup">
                  <div>
                    <span>Save State</span>
                    <span>
                      <button className="theia-button secondary">F4</button>
                    </span>
                  </div>
                  <div>
                    <span>Load State</span>
                    <span>
                      <button className="theia-button secondary">F5</button>
                    </span>
                  </div>
                  <div>
                    <span>Decrease Save Slot</span>
                    <span>
                      <button className="theia-button secondary">F6</button>
                    </span>
                  </div>
                  <div>
                    <span>Increase Save Slot</span>
                    <span>
                      <button className="theia-button secondary">F7</button>
                    </span>
                  </div>
                </div>
                <div className="buttonAssignmentGroup">
                  <div>
                    <span>Frame Advance</span>
                    <span>
                      <button className="theia-button secondary">
                        <i className="fa fa-fw fa-arrow-up"></i>
                      </button>
                    </span>
                  </div>
                  <div>
                    <span>Rewind</span>
                    <span>
                      <button className="theia-button secondary">
                        <i className="fa fa-fw fa-arrow-left"></i>
                      </button>
                    </span>
                  </div>
                  <div>
                    <span>Toggle Fast Forward</span>
                    <span>
                      <button className="theia-button secondary">
                        <i className="fa fa-fw fa-arrow-right"></i>
                      </button>
                    </span>
                  </div>
                  <div>
                    <span>Toggle Slow Motion</span>
                    <span>
                      <button className="theia-button secondary">
                        <i className="fa fa-fw fa-arrow-down"></i>
                      </button>
                    </span>
                  </div>
                </div>
              </div>
              <div className="controlsHint">
                <button
                  className="theia-button secondary"
                  onClick={() =>
                    this.commandService.executeCommand(
                      KeymapsCommands.OPEN_KEYMAPS.id
                    )
                  }
                >
                  Open Shortcut Editor
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  protected getResource() {
    return joinPath(
      getResourcesPath(),
      "binaries",
      "vuengine-studio-tools",
      "web",
      "retroarch",
      "index.html"
    );
  }

  protected sendCommand(command: string, data?: any) {
    this.iframeRef.current?.contentWindow?.postMessage(
      { command, data },
      "file://" + this.getResource()
    );
  }

  protected saveScreenshot() {
    // TODO: this does not work
    const canvas = this.iframeRef.current?.contentDocument?.getElementById(
      "canvas"
    ) as HTMLCanvasElement;
    var lnk = document.createElement("a");
    lnk.download = "filename.png";
    lnk.href = canvas?.toDataURL("image/png;base64");
    lnk.click();
  }

  protected toggleBatteryLow() {
    this.state.lowBattery = !this.state.lowBattery;
    this.sendCommand("toggleBatteryLow");
    this.update();
  }

  protected reload() {
    if (this.iframeRef.current) this.iframeRef.current.src += "";
    this.update();
  }

  protected reset() {
    this.sendCommand("reset");
    this.update();
  }

  protected async togglePause() {
    if (this.state.status === "paused") {
      this.sendCommand("togglePause");
      this.state.status = "running";
    } else if (this.state.status === "running") {
      this.sendCommand("togglePause");
      this.state.status = "paused";
    }

    this.update();
  }

  protected async setEmulationMode(e: React.ChangeEvent<HTMLSelectElement>) {
    await this.preferenceService.set(
      VesRunEmulatorEmulationModePreference.id,
      e.target.value,
      PreferenceScope.User
    );
    this.sendCoreOptions();
    this.reload();
  }

  protected async setStereoMode(e: React.ChangeEvent<HTMLSelectElement>) {
    await this.preferenceService.set(
      VesRunEmulatorStereoModePreference.id,
      e.target.value,
      PreferenceScope.User
    );
    this.sendCoreOptions();
    this.reload();
  }

  protected async setScale(e: React.ChangeEvent<HTMLSelectElement>) {
    await this.preferenceService.set(
      VesRunEmulatorScalePreference.id,
      e.target.value,
      PreferenceScope.User
    );
    this.update();
  }

  protected sendCoreOptions() {
    const emulationMode = this.preferenceService.get(
      VesRunEmulatorEmulationModePreference.id
    ) as string;
    let stereoMode = this.preferenceService.get(
      VesRunEmulatorStereoModePreference.id
    ) as string;
    let anaglyphPreset = "disabled";
    let colorMode = "black & red";

    if (stereoMode.startsWith("2d")) {
      colorMode = stereoMode
        .substr(3)
        .replace("-", " & ")
        .replace("-", " ");
      anaglyphPreset = "disabled";
      stereoMode = "anaglyph";
    } else if (stereoMode.startsWith("anaglyph")) {
      anaglyphPreset = stereoMode
        .substr(9)
        .replace("-", " & ")
        .replace("-", " ");
      stereoMode = "anaglyph";
    }

    this.sendCommand(
      "setCoreOptions",
      `
        vb_3dmode = "${stereoMode}"
        vb_anaglyph_preset = "${anaglyphPreset}"
        vb_color_mode = "${colorMode}"
        vb_right_analog_to_digital = "disabled"
        vb_cpu_emulation = "${emulationMode}"
      `
    );
  }

  protected sendRetroArchConfig() {
    this.sendCommand(
      "setRetroArchConfig",
      `
        menu_driver = "xmb"
        history_list_enable = false
        perfcnt_enable = false
        config_save_on_exit = false
        suspend_screensaver_enable  = true
        fps_show = false
        framecount_show = false
        memory_show = false
        video_windowed_fullscreen = false
        video_vsync = true
        video_font_enable = true
        cheevos_enable = false
        cheevos_hardcore_mode_enable = false
        quit_press_twice = false
        rewind_enable = true
        pause_nonactive = true

        input_player1_select = "v"
        input_player1_start = "${getKeybindingLabel(
          this.keybindingRegistry,
          VesEmulatorInputStartCommand.id,
          false
        )}"
        input_player1_l = "g"
        input_player1_r = "h"
        input_player1_a = "m"
        input_player1_b = "n"
        input_player1_up = "e"
        input_player1_left = "s"
        input_player1_down = "d"
        input_player1_right = "f"
        input_player1_l2 = "i"
        input_player1_r2 = "j"
        input_player1_l3 = "k"
        input_player1_r3 = "l"
        input_player1_l_x_minus = "s"
        input_player1_l_x_plus = "f"
        input_player1_l_y_minus = "d"
        input_player1_l_y_plus = "e"
        input_player1_r_x_minus = "j"
        input_player1_r_x_plus = "l"
        input_player1_r_y_minus = "k"
        input_player1_r_y_plus = "i"
        input_player1_turbo = nul
        input_toggle_fullscreen = nul
        input_save_state = f4
        input_load_state = f5
        input_state_slot_decrease = f6
        input_state_slot_increase = f7
        input_toggle_fast_forward = right
        input_hold_fast_forward = nul
        input_exit_emulator = nul
        input_shader_next = nul
        input_shader_prev = nul
        input_rewind = left
        input_movie_record_toggle = nul
        input_pause_toggle = space
        input_frame_advance = up
        input_reset = f10
        input_audio_mute = f3
        input_screenshot = nul
        input_slowmotion = nul
        input_toggle_slowmotion_btn = down
        input_enable_hotkey_btn = nul
        input_hotkey_block_delay = nul
        input_volume_up = nul
        input_volume_down = nul
        input_menu_toggle = nul
      `
    );
  }

  protected getCanvasDimensions(): { height: number; width: number } {
    const canvasScale = this.preferenceService.get(
      VesRunEmulatorScalePreference.id
    ) as string;
    const screenResolution = this.getScreenResolution();
    const wrapperHeight =
      this.wrapperRef.current?.offsetHeight || screenResolution.height;
    const wrapperWidth =
      this.wrapperRef.current?.offsetWidth || screenResolution.width;

    if (canvasScale === "full") {
      const fullSizeCanvasScale = Math.min.apply(Math, [
        wrapperHeight / screenResolution.height,
        wrapperWidth / screenResolution.width,
      ]);
      return {
        height: fullSizeCanvasScale * screenResolution.height,
        width: fullSizeCanvasScale * screenResolution.width,
      };
    } else if (canvasScale === "auto") {
      const maxScale = this.determineMaxCanvasScaleFactor();
      return {
        height: maxScale * screenResolution.height,
        width: maxScale * screenResolution.width,
      };
    } else {
      const preferredScale = parseInt(canvasScale.substr(1));
      const maxScale = this.determineMaxCanvasScaleFactor();
      const actualScale = Math.min.apply(Math, [maxScale, preferredScale]);
      return {
        height: actualScale * screenResolution.height,
        width: actualScale * screenResolution.width,
      };
    }
  }

  protected determineMaxCanvasScaleFactor(): number {
    const screenResolution = this.getScreenResolution();
    const wrapperHeight =
      this.wrapperRef.current?.offsetHeight || screenResolution.height;
    const wrapperWidth =
      this.wrapperRef.current?.offsetWidth || screenResolution.width;

    return Math.min.apply(Math, [
      Math.floor(wrapperHeight / screenResolution.height),
      Math.floor(wrapperWidth / screenResolution.width),
    ]);
  }

  protected getScreenResolution(): { height: number; width: number } {
    const stereoMode = this.preferenceService.get(
      VesRunEmulatorStereoModePreference.id
    ) as string;
    let x = VesEmulatorWidget.RESOLUTIONX;
    let y = VesEmulatorWidget.RESOLUTIONY;

    if (stereoMode === "side-by-side") {
      x = VesEmulatorWidget.RESOLUTIONX * 2;
    } else if (stereoMode === "cyberscope") {
      x = 512;
      y = VesEmulatorWidget.RESOLUTIONX;
    } else if (stereoMode === "hli") {
      y = VesEmulatorWidget.RESOLUTIONY * 2;
    } else if (stereoMode === "vli") {
      x = VesEmulatorWidget.RESOLUTIONX * 2;
    }

    return { height: y, width: x };
  }

  protected toggleControlsOverlay() {
    this.state.showControls = !this.state.showControls;
    this.update();
    if (!this.state.showControls) {
      this.iframeRef.current?.focus();
    }
  }

  protected toggleRefHighlighted(
    buttonOverlayRef: React.RefObject<HTMLDivElement>
  ) {
    buttonOverlayRef.current?.classList.toggle("highlighted");
  }
}
