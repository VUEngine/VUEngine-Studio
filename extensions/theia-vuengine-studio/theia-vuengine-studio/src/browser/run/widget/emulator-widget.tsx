import * as React from "react";
import { join as joinPath } from "path";
import { inject, injectable, postConstruct } from "inversify";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { FrontendApplicationState, FrontendApplicationStateService } from "@theia/core/lib/browser/frontend-application-state";
import { getResourcesPath, getWorkspaceRoot } from "../../common/functions";

const datauri = require('datauri');

@injectable()
export class VesEmulatorWidget extends ReactWidget {
  @inject(FrontendApplicationStateService) protected readonly frontendApplicationStateService: FrontendApplicationStateService;

  static readonly ID = "vesEmulatorWidget";
  static readonly LABEL = "Emulator";

  protected wrapperRef = React.createRef<HTMLDivElement>();
  protected canvasRef = React.createRef<HTMLIFrameElement>();

  protected state = {
    paused: false,
    coreOptions: {
      stereoMode: "anaglyph-red-blue",
      colorMode: "black-red",
    }
  }

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesEmulatorWidget.ID;
    this.title.label = VesEmulatorWidget.LABEL;
    this.title.caption = VesEmulatorWidget.LABEL;
    this.title.iconClass = "fa fa-play";
    this.title.closable = true;

    this.update();

    this.frontendApplicationStateService.onStateChanged(async (state: FrontendApplicationState) => {
      if (state === 'ready') {
        const romPath = joinPath(getWorkspaceRoot(), "build", "output.vb");
        datauri(romPath, (err: any) => {
          if (err) throw err;
        }).then((content: string) => {
          this.sendCoreOptions();
          this.sendCommand("start", content);
        });
      }
    });
  }

  protected render(): React.ReactNode {
    return <>
      <div id="vesEmulatorUi">
        <div>
          {/**/
            <button className="theia-button secondary" title="Clean" onClick={() => this.sendCommand("clean")}>
              <i className="fa fa-trash"></i>
            </button>
          /**/}
          {this.state.paused
            ? <button className="theia-button secondary" title="Resume" onClick={() => this.togglePause()}>
              <i className="fa fa-play"></i>
            </button>
            : <button className="theia-button secondary" title="Pause" onClick={() => this.togglePause()}>
              <i className="fa fa-pause"></i>
            </button>
          }
          <button className="theia-button secondary" title="Screenshot" onClick={() => this.sendCommand("screenshot")}>
            <i className="fa fa-camera"></i>
          </button>
          <button className="theia-button secondary" title="Save State" onClick={() => this.sendCommand("saveState")}>
            <i className="fa fa-level-down"></i> <i className="fa fa-bookmark-o"></i>
          </button>
          <button className="theia-button secondary" title="Load State" onClick={() => this.sendCommand("loadState")}>
            <i className="fa fa-bookmark-o"></i> <i className="fa fa-level-up"></i>
          </button>
        </div>
        <div>
          <button className="theia-button secondary" title="Set Scale 1" onClick={() => this.sendCommand("scale1")}>
            ×1
        </button>
          <button className="theia-button secondary" title="Set Scale 2" onClick={() => this.sendCommand("scale2")}>
            ×2
          </button>
          <button className="theia-button secondary" title="Set Scale 3" onClick={() => this.sendCommand("scale3")}>
            ×3
          </button>
          <button className="theia-button secondary" title="Set Full Width" onClick={() => this.sendCommand("scale10")}>
            Full
          </button>
          <button className="theia-button secondary" title="Fullscreen" onClick={() => this.sendCommand("fullscreen")}>
            <i className="fa fa-arrows-alt"></i>
          </button>
        </div>
        <div>
          <select className="theia-select" title="3D Mode" onClick={(value) => this.setStereoMode(value)}>
            <option value="off">No 3-D</option>
            <option value="anaglyph-red-blue">Anaglyph (Red/Blue)</option>
            <option value="anaglyph-red-cyan">Anaglyph (Red/Cyan)</option>
            <option value="anaglyph-red-electric-cyan">Anaglyph (Red/Electric Cyan)</option>
            {/* TODO: Mednafen's red/green option does not seem to exist in Beetle VB */}
            <option value="anaglyph-red-green">Anaglyph (Red/Green)</option>
            <option value="anaglyph-green-magenta">Anaglyph (Green/Magenta)</option>
            <option value="anaglyph-yellow-blue">Anaglyph (Yellow/Blue)</option>
            <option value="side-by-side">Side-by-Side</option>
            <option value="cyberscope">CyberScope</option>
            <option value="vli">Horizontal Line Interlaced</option>
            <option value="hli">Vertical Line Interlaced</option>
          </select>
        </div>
        <div>
          <button className="theia-button secondary" title="Menu" onClick={() => this.sendCommand("menu")}>
            <i className="fa fa-bars"></i>
          </button>
        </div>
      </div>
      <div id="vesEmulatorWrapper" ref={this.wrapperRef}>
        {this.state.paused &&
          <div className="pauseOverlay"><i className="fa fa-pause fa-4x"></i></div>
        }
        <iframe id="vesEmulatorFrame" src={this.getResoure()} ref={this.canvasRef}></iframe>
      </div>
    </>;
  }

  protected getResoure() {
    return joinPath(getResourcesPath(), "binaries", "vuengine-studio-tools", "retroarch", "index.html");
  }

  protected sendCommand(command: string, data?: any) {
    // @ts-ignore
    document.getElementById("vesEmulatorFrame").contentWindow.postMessage({ command, data });
  }

  protected async togglePause() {
    if (this.state.paused) {
      this.sendCommand("resume")
    } else {
      this.sendCommand("pause")
    }
    this.state.paused = !this.state.paused;
    this.update();
  }

  protected setStereoMode(e: any/*: React.MouseEvent<Element, MouseEvent>*/) {
    // this.state.coreOptions.stereoMode = evt. value;
    this.sendCoreOptions();
  }

  protected sendCoreOptions() {
    let stereoMode = this.state.coreOptions.stereoMode;
    let anaglyphPreset = "disabled"
    let colorMode = this.state.coreOptions.colorMode.replace("-", " & ").replace("-", " ")

    if (stereoMode === "off") {
      anaglyphPreset = "disabled"
      stereoMode = "anaglyph"
    } else if (stereoMode.startsWith("anaglyph")) {
      anaglyphPreset = stereoMode.substr(9).replace("-", " & ").replace("-", " ")
      stereoMode = "anaglyph"
    }

    this.sendCommand("setCoreOptions", `
      vb_3dmode = "${stereoMode}"
      vb_anaglyph_preset = "${anaglyphPreset}"
      vb_color_mode = "${colorMode}"
      vb_right_analog_to_digital = "disabled"
      vb_cpu_emulation = "accurate"
    `);
  }

  // TODO: make canvas in iframe always 100% in size and move size control to this widget
}
