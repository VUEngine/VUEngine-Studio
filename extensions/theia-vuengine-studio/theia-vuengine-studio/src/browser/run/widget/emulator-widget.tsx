import * as React from "react";
import { join as joinPath } from "path";
import { inject, injectable, postConstruct } from "inversify";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { getResourcesPath, getWorkspaceRoot } from "../../common/functions";
import { VesStateModel } from "../../common/vesStateModel";

const datauri = require("datauri");

export type vesEmulatorWidgetState = {
  status: string;
  coreOptions: any;
  canvasScale: string | number;
};

@injectable()
export class VesEmulatorWidget extends ReactWidget {
  @inject(VesStateModel) private readonly vesState: VesStateModel;

  static readonly ID = "vesEmulatorWidget";
  static readonly LABEL = "Emulator";

  static readonly RESOLUTIONX = 384;
  static readonly RESOLUTIONY = 224;

  protected wrapperRef = React.createRef<HTMLDivElement>();
  protected iframeRef = React.createRef<HTMLIFrameElement>();

  protected state: vesEmulatorWidgetState = {
    status: "running",
    coreOptions: {
      emulationMode: "accurate",
      stereoMode: "2d-black-red",
    },
    canvasScale: "auto",
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
    let statusActionButtons;

    switch (this.state.status) {
      case "running":
        // TODO: send reset command instead of calling this.reload()
        statusActionButtons = (
          <>
            <button
              className="theia-button secondary"
              title="Pause"
              onClick={() => this.togglePause()}
            >
              <i className="fa fa-pause"></i>
            </button>
            <button
              className="theia-button secondary"
              title="Reset"
              onClick={() => this.reload()}
            >
              <i className="fa fa-refresh"></i>
            </button>
            <button className="theia-button secondary" title="Stop">
              <i className="fa fa-stop"></i>
            </button>
          </>
        );
        break;
      case "paused":
        statusActionButtons = (
          <>
            <button
              className="theia-button secondary"
              title="Resume"
              onClick={() => this.togglePause()}
            >
              <i className="fa fa-play"></i>
            </button>
            <button
              className="theia-button secondary"
              title="Reset"
              onClick={() => this.reload()}
            >
              <i className="fa fa-refresh"></i>
            </button>
            <button className="theia-button secondary" title="Stop">
              <i className="fa fa-stop"></i>
            </button>
          </>
        );
        break;
      case "stopped":
        statusActionButtons = (
          <>
            <button
              className="theia-button secondary"
              title="Start"
              onClick={() => this.startEmulator(this)}
            >
              <i className="fa fa-play"></i>
            </button>
          </>
        );
        break;
    }

    return (
      <>
        <div id="vesEmulatorUi">
          <div>
            {statusActionButtons}
            {/*/
              <button
                className="theia-button secondary"
                title="Clean"
                onClick={() => this.sendCommand("clean")}
              >
                <i className="fa fa-trash"></i>
              </button>
              /**/}
          </div>
          <div>
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
              onClick={() => this.sendCommand("frameAdvance")}
            >
              <i className="fa fa-step-forward"></i>
            </button>

            <button
              className="theia-button secondary"
              title="Toggle Fast Forward"
              onClick={() => this.sendCommand("toggleFastForward")}
            >
              <i className="fa fa-forward"></i>
            </button>
          </div>
          <div>
            <button
              className="theia-button secondary"
              title="Volume Up"
              onClick={() => this.sendCommand("volumeUp")}
            >
              <i className="fa fa-volume-up"></i>
            </button>
            <button
              className="theia-button secondary"
              title="Volume Down"
              onClick={() => this.sendCommand("volumeDown")}
            >
              <i className="fa fa-volume-down"></i>
            </button>
            <button
              className="theia-button secondary"
              title="Mute"
              onClick={() => this.sendCommand("mute")}
            >
              <i className="fa fa-volume-off"></i>
            </button>
          </div>
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
          <div>
            <select
              className="theia-select"
              title="Scale"
              value={this.state.canvasScale}
              onChange={(value) => this.setScale(value)}
            >
              <option value="auto">Auto scale</option>
              <option value="1">×1</option>
              <option value="2">×2</option>
              <option value="3">×3</option>
              <option value="full">Full size</option>
            </select>
            <button
              className="theia-button secondary"
              title="Fullscreen"
              onClick={() => this.sendCommand("fullscreen")}
            >
              <i className="fa fa-arrows-alt"></i>
            </button>
          </div>
          <div>
            <select
              className="theia-select"
              title="3D Mode"
              onChange={(value) => this.setStereoMode(value)}
            >
              <option value="2d-black-red">2D (Red/Black)</option>
              <option value="2d-black-white">2D (White/Black)</option>
              <option value="2d-black-blue">2D (Blue/Black)</option>
              <option value="2d-black-cyan">2D (Cyan/Black)</option>
              <option value="2d-black-electric-cyan">
                2D (El. Cyan/Black)
              </option>
              <option value="2d-black-green">2D (Green/Black)</option>
              <option value="2d-black-magenta">2D (Magenta/Black)</option>
              <option value="2d-black-yellow">2D (Yellow/Black)</option>
              <option value="anaglyph-red-blue">Anaglyph (Red/Blue)</option>
              <option value="anaglyph-red-cyan">Anaglyph (Red/Cyan)</option>
              <option value="anaglyph-red-electric-cyan">
                Anaglyph (Red/El. Cyan)
              </option>
              {/* Mednafen's red/green option does not exist in Beetle VB */}
              {/* <option value="anaglyph-red-green">Anaglyph (Red/Green)</option> */}
              <option value="anaglyph-green-magenta">
                Anaglyph (Green/Magenta)
              </option>
              <option value="anaglyph-yellow-blue">
                Anaglyph (Yellow/Blue)
              </option>
              <option value="side-by-side">Side-by-Side</option>
              <option value="cyberscope">CyberScope</option>
              <option value="hli">Horizontal Line Interlaced</option>
              <option value="vli">Vertical Line Interlaced</option>
            </select>
            <select
              className="theia-select"
              title="Emulation Mode"
              onChange={(value) => this.setEmulationMode(value)}
            >
              <option value="accurate">Accurate</option>
              <option value="fast">Fast</option>
            </select>
          </div>
          <div>
            {/* TODO: save canvas to PNG instead of using emulator's screenshot function,
              because we do not want to litter the in-browser filesystem */}
            <button
              className="theia-button secondary"
              title="Screenshot"
              onClick={() => this.sendCommand("screenshot")}
            >
              <i className="fa fa-camera"></i>
            </button>
            {/* TODO: fully disable menu access? */}
            <button
              className="theia-button secondary"
              title="Menu"
              onClick={() => this.sendCommand("menu")}
            >
              <i className="fa fa-bars"></i>
            </button>
          </div>
          <div>
            <button className="theia-button secondary" title="Configure Input">
              <i className="fa fa-keyboard-o"></i>
            </button>
          </div>
        </div>
        <div id="vesEmulatorWrapper" ref={this.wrapperRef}>
          {this.state.status === "paused" && (
            <div className="pauseOverlay">
              <i className="fa fa-pause fa-4x"></i>
            </div>
          )}
          <iframe
            id="vesEmulatorFrame"
            ref={this.iframeRef}
            src={this.getResoure()}
            width={canvasDimensions.width}
            height={canvasDimensions.height}
            onLoad={() => this.startEmulator(this)}
          ></iframe>
        </div>
      </>
    );
  }

  protected getResoure() {
    return joinPath(
      getResourcesPath(),
      "binaries",
      "vuengine-studio-tools",
      "retroarch",
      "index.html"
    );
  }

  protected sendCommand(command: string, data?: any) {
    this.iframeRef.current?.contentWindow?.postMessage(
      { command, data },
      "file://" + this.getResoure()
    );
  }

  protected reload() {
    if (this.iframeRef.current) this.iframeRef.current.src += "";
  }

  protected async togglePause() {
    if (this.state.status === "paused") {
      this.sendCommand("resume");
      this.state.status = "running";
    } else if (this.state.status === "running") {
      this.sendCommand("pause");
      this.state.status = "paused";
    }

    this.update();
  }

  protected setEmulationMode(e: React.ChangeEvent<HTMLSelectElement>) {
    this.state.coreOptions.emulationMode = e.target.value;
    this.sendCoreOptions();
    this.reload();
  }

  protected setStereoMode(e: React.ChangeEvent<HTMLSelectElement>) {
    this.state.coreOptions.stereoMode = e.target.value;
    this.sendCoreOptions();
    this.reload();
  }

  protected setScale(e: React.ChangeEvent<HTMLSelectElement>) {
    this.state.canvasScale = e.target.value;
    this.update();
  }

  protected sendCoreOptions() {
    const emulationMode = this.state.coreOptions.emulationMode;
    let stereoMode = this.state.coreOptions.stereoMode;
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
      `
    );
  }

  protected getCanvasDimensions(): { height: number; width: number } {
    const wrapperHeight =
      this.wrapperRef.current?.offsetHeight || VesEmulatorWidget.RESOLUTIONY;
    const wrapperWidth =
      this.wrapperRef.current?.offsetWidth || VesEmulatorWidget.RESOLUTIONX;

    if (this.state.canvasScale === "full") {
      const fullSizeCanvasScale = Math.min.apply(Math, [
        wrapperHeight / VesEmulatorWidget.RESOLUTIONY,
        wrapperWidth / VesEmulatorWidget.RESOLUTIONX,
      ]);
      return {
        height: fullSizeCanvasScale * VesEmulatorWidget.RESOLUTIONY,
        width: fullSizeCanvasScale * VesEmulatorWidget.RESOLUTIONX,
      };
    } else if (this.state.canvasScale === "auto") {
      const maxScale = this.determineMaxCanvasScaleFactor();
      return {
        height: maxScale * VesEmulatorWidget.RESOLUTIONY,
        width: maxScale * VesEmulatorWidget.RESOLUTIONX,
      };
    } else {
      const preferredScale = this.state.canvasScale;
      const maxScale = this.determineMaxCanvasScaleFactor();
      const actualScale = Math.min.apply(Math, [maxScale, preferredScale]);
      return {
        height: actualScale * VesEmulatorWidget.RESOLUTIONY,
        width: actualScale * VesEmulatorWidget.RESOLUTIONX,
      };
    }
  }

  protected determineMaxCanvasScaleFactor(): number {
    const wrapperHeight =
      this.wrapperRef.current?.offsetHeight || VesEmulatorWidget.RESOLUTIONY;
    const wrapperWidth =
      this.wrapperRef.current?.offsetWidth || VesEmulatorWidget.RESOLUTIONX;

    return Math.min.apply(Math, [
      Math.floor(wrapperHeight / VesEmulatorWidget.RESOLUTIONY),
      Math.floor(wrapperWidth / VesEmulatorWidget.RESOLUTIONX),
    ]);
  }
}
