import * as React from "react";
import { join as joinPath } from "path";
import { inject, injectable, postConstruct } from "inversify";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { PreferenceScope, PreferenceService } from "@theia/core/lib/browser";
import { EmulationMode, EmulatorScale, StereoMode } from "../types";
import { getResourcesPath, getWorkspaceRoot } from "../../common/functions";
import { VesStateModel } from "../../common/vesStateModel";
import { VesRunEmulatorEmulationModePreference, VesRunEmulatorScalePreference, VesRunEmulatorStereoModePreference } from "../preferences";

const datauri = require("datauri");

// TODO: create overlay(s?) to view/remap button assigments for both emulator commands and controller input

export type vesEmulatorWidgetState = {
  status: string;
  lowBattery: boolean;
  muted: boolean;
};

@injectable()
export class VesEmulatorWidget extends ReactWidget {
  @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
  @inject(VesStateModel) private readonly vesState: VesStateModel;

  static readonly ID = "vesEmulatorWidget";
  static readonly LABEL = "Emulator";

  static readonly RESOLUTIONX = 384;
  static readonly RESOLUTIONY = 224;

  protected wrapperRef = React.createRef<HTMLDivElement>();
  protected iframeRef = React.createRef<HTMLIFrameElement>();

  protected state: vesEmulatorWidgetState = {
    status: "running",
    lowBattery: false,
    muted: false,
  };

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesEmulatorWidget.ID;
    this.title.label = VesEmulatorWidget.LABEL;
    this.title.caption = VesEmulatorWidget.LABEL;
    this.title.iconClass = "fa fa-play";
    this.title.closable = true;
    this.update();
  }

  protected startEmulator(self: any) {
    const romPath = joinPath(getWorkspaceRoot(), "build", "output.vb");
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

  onAfterAttach() {
    this.vesState.isRunning = 1;
  }

  onAfterDetach() {
    this.vesState.isRunning = 0;
  }

  protected onAfterShow() {
    this.iframeRef.current?.focus();
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
            >
              <i className={this.state.status === "paused" ? "fa fa-play" : "fa fa-pause"}></i>
            </button>
            <button
              className="theia-button secondary"
              title="Reset"
              onClick={() => this.reset()}
            >
              <i className="fa fa-refresh"></i>
            </button>
            {/*/}
              <button
                className="theia-button secondary"
                title="Clean"
                onClick={() => this.sendCommand("clean")}
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
            >
              <i className="fa fa-step-forward"></i>
            </button>

            <button
              className="theia-button secondary"
              title="Fast Forward"
              onClick={() => this.sendCommand("fastForward")}
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
            >
              <i className={this.state.muted ? "fa fa-volume-off" : "fa fa-volume-up"}></i>
            </button>
          </div>
          {this.wrapperRef.current && this.wrapperRef.current?.offsetWidth > 900 &&
            <div>
              <button
                className="theia-button secondary"
                title="Increase Save State Slot"
                onClick={() => this.sendCommand("increaseSaveSlot")}
              >
                <i className="fa fa-chevron-up"></i>
              </button>
              <button
                className="theia-button secondary"
                title="Decrease Save State Slot"
                onClick={() => this.sendCommand("decreaseSaveSlot")}
              >
                <i className="fa fa-chevron-down"></i>
              </button>
              <button
                className="theia-button secondary"
                title="Save State"
                onClick={() => this.sendCommand("saveState")}
              >
                <i className="fa fa-level-down"></i>{" "}
                <i className="fa fa-bookmark-o"></i>
              </button>
              <button
                className="theia-button secondary"
                title="Load State"
                onClick={() => this.sendCommand("loadState")}
              >
                <i className="fa fa-bookmark-o"></i>{" "}
                <i className="fa fa-level-up"></i>
              </button>
            </div>
          }
          {this.wrapperRef.current && this.wrapperRef.current?.offsetWidth > 750 &&
            <div>
              <select
                className="theia-select"
                title="Scale"
                value={this.preferenceService.get(VesRunEmulatorScalePreference.id)}
                onChange={(value) => this.setScale(value)}
              >
                {Object.keys(EmulatorScale).map((value, index) => {
                  return <option value={value}>
                    {Object.values(EmulatorScale)[index]}
                  </option>
                })}
              </select>
              <select
                className="theia-select"
                title="Stereo Mode"
                value={this.preferenceService.get(VesRunEmulatorStereoModePreference.id)}
                onChange={(value) => this.setStereoMode(value)}
              >
                {Object.keys(StereoMode).map((value, index) => {
                  return <option value={value}>
                    {Object.values(StereoMode)[index]}
                  </option>
                })}
              </select>
              <select
                className="theia-select"
                title="Emulation Mode"
                value={this.preferenceService.get(VesRunEmulatorEmulationModePreference.id)}
                onChange={(value) => this.setEmulationMode(value)}
              >
                {Object.keys(EmulationMode).map((value, index) => {
                  return <option value={value}>
                    {Object.values(EmulationMode)[index]}
                  </option>
                })}
              </select>
            </div>
          }
          {/*/}
          <div>
            <button
              className="theia-button secondary"
              title="Fullscreen"
              onClick={() => this.sendCommand("fullscreen")}
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
            >
              <i className={this.state.lowBattery ? "fa fa-battery-empty" : "fa fa-battery-full"}></i>
            </button>
          </div>
          {/**/}
          {/*/}
          <div>
            <button className="theia-button secondary" title="Configure Input">
              <i className="fa fa-keyboard-o"></i>
            </button>
          </div>
          {/**/}
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
    const canvas = this.iframeRef.current?.contentDocument?.getElementById("canvas") as HTMLCanvasElement;
    var lnk = document.createElement('a');
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
    await this.preferenceService.set(VesRunEmulatorEmulationModePreference.id, e.target.value, PreferenceScope.User);
    this.sendCoreOptions();
    this.reload();
  }

  protected async setStereoMode(e: React.ChangeEvent<HTMLSelectElement>) {
    await this.preferenceService.set(VesRunEmulatorStereoModePreference.id, e.target.value, PreferenceScope.User);
    this.sendCoreOptions();
    this.reload();
  }

  protected async setScale(e: React.ChangeEvent<HTMLSelectElement>) {
    await this.preferenceService.set(VesRunEmulatorScalePreference.id, e.target.value, PreferenceScope.User);
    this.update();
  }

  protected sendCoreOptions() {
    const emulationMode = this.preferenceService.get(VesRunEmulatorEmulationModePreference.id) as string;
    let stereoMode = this.preferenceService.get(VesRunEmulatorStereoModePreference.id) as string;
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
        input_player1_start = "b"
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
    const canvasScale = this.preferenceService.get(VesRunEmulatorScalePreference.id) as string;
    const screenResolution = this.getScreenResolution();
    const wrapperHeight = this.wrapperRef.current?.offsetHeight || screenResolution.height;
    const wrapperWidth = this.wrapperRef.current?.offsetWidth || screenResolution.width;

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
    const wrapperHeight = this.wrapperRef.current?.offsetHeight || screenResolution.height;
    const wrapperWidth = this.wrapperRef.current?.offsetWidth || screenResolution.width;

    return Math.min.apply(Math, [
      Math.floor(wrapperHeight / screenResolution.height),
      Math.floor(wrapperWidth / screenResolution.width),
    ]);
  }

  protected getScreenResolution(): { height: number, width: number } {
    const stereoMode = this.preferenceService.get(VesRunEmulatorStereoModePreference.id) as string;
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
}
