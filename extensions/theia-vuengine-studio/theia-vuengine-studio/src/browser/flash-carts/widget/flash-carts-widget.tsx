import * as React from "react";
import { basename } from "path";
import { inject, injectable, postConstruct } from "inversify";
import { ReactWidget } from "@theia/core/lib/browser/widgets/react-widget";
import { VesState } from "../../common/ves-state";
import { CommandService } from "@theia/core";
import { VesFlashCartsCommands } from "../flash-carts-commands";
import { VesProcessService } from "../../../common/process-service-protocol";
import { VesFlashCartsPrefs } from "../flash-carts-preferences";
import { abortFlash, ConnectedFlashCart } from "../commands/flash";
import { Message } from "@phosphor/messaging";

@injectable()
export class VesFlashCartsWidget extends ReactWidget {
  @inject(CommandService) private readonly commandService: CommandService;
  @inject(VesProcessService)
  private readonly vesProcessService: VesProcessService;
  @inject(VesState) private readonly vesState: VesState;

  static readonly ID = "vesFlashCartsWidget";
  static readonly LABEL = "Connected Flash Carts";

  protected state = {
    showLog: [] as boolean[],
  };

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesFlashCartsWidget.ID;
    this.title.iconClass = "fa fa-usb";
    // this.title.iconClass = "ves-flash-carts-tab-icon";
    this.title.closable = true;
    this.setTitle();
    this.node.tabIndex = 0; // required for this.node.focus() to work in this.onActivateRequest()
    this.update();

    this.vesState.onDidChangeConnectedFlashCarts(() => {
      this.setTitle();
      this.update();
    });
    this.vesState.onDidChangeIsFlashing(() => this.update());
    this.vesState.onDidChangeIsFlashQueued(() => this.update());
    this.vesState.onDidChangeFlashingProgress(() => this.update());
  }

  protected setTitle() {
    const count = this.vesState.connectedFlashCarts.length;
    this.title.label = `${VesFlashCartsWidget.LABEL}: ${count}`;
    this.title.caption = `${VesFlashCartsWidget.LABEL}: ${count}`;
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.node.focus();
  }

  protected render(): React.ReactNode {
    return this.vesState.connectedFlashCarts.length > 0 ? (
      <>
        <div className="flashingActions">
          {this.vesState.isFlashQueued && (
            <>
              <div className="flashCartInfo">
                <div>
                  <i className="fa fa-fw fa-hourglass-half"></i>{" "}
                  <em>
                    Flashing is queued and will start once the build is ready
                  </em>
                </div>
              </div>
              <button
                className="theia-button secondary"
                onClick={() =>
                  this.commandService.executeCommand(VesFlashCartsCommands.FLASH.id)
                }
              >
                Cancel
              </button>
            </>
          )}
          {!this.vesState.isFlashQueued && this.vesState.flashingProgress > -1 && (
            <div className="flashingPanel">
              <div className="vesProgressBar">
                <div style={{ width: this.vesState.flashingProgress + "%" }}>
                  <span>
                    {this.vesState.flashingProgress === 100 ? (
                      <>
                        <i className="fa fa-check"></i> Done
                      </>
                    ) : (
                      <>{this.vesState.flashingProgress}%</>
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
          {!this.vesState.isFlashQueued && !this.vesState.isFlashing && (
            <>
              <button
                className="theia-button flash"
                onClick={() =>
                  this.commandService.executeCommand(VesFlashCartsCommands.FLASH.id)
                }
              >
                <i className="fa fa-usb"></i> Flash
              </button>
            </>
          )}
          {this.vesState.isFlashing && (
            <button
              className="theia-button secondary"
              onClick={() => abortFlash(this.vesProcessService, this.vesState)}
            >
              Abort
            </button>
          )}
        </div>
        <div>
          {this.vesState.connectedFlashCarts.map(
            (connectedFlashCart: ConnectedFlashCart, index: number) => (
              <div className="flashCart">
                <div className="flashCartTitle">
                  {connectedFlashCart.config.name}
                </div>
                <div className="flashCartInfo">
                  <div>
                    <i className="fa fa-fw fa-microchip"></i>{" "}
                    {connectedFlashCart.config.size} MBit (
                    {connectedFlashCart.config.padRom
                      ? "Auto Padding"
                      : "No Auto Padding"}
                    )
                  </div>
                  <div>
                    <i className="fa fa-fw fa-usb"></i>{" "}
                    {connectedFlashCart.config.vid}:
                    {connectedFlashCart.config.pid}
                    <br />
                    {connectedFlashCart.config.manufacturer}
                    <br />
                    {connectedFlashCart.config.product}
                  </div>
                  <div>
                    <i className="fa fa-fw fa-terminal"></i>{" "}
                    {basename(connectedFlashCart.config.path)}{" "}
                    {connectedFlashCart.config.args}
                  </div>
                </div>
                {connectedFlashCart.config.image && (
                  <div className="cartImgWrapper">
                    <img
                      src={connectedFlashCart.config.image}
                      style={
                        connectedFlashCart.config.name ===
                          VesFlashCartsPrefs.FLASH_CARTS.property.default[1].name
                          ? {
                            /* HyperFlash32 eInk label */
                            backgroundImage:
                              "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQgAAACwCAIAAAB8emcEAAAACXBIWXMAAAsTAAALEwEAmpwYAAAGTGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTAzLTIxVDEzOjE1OjM1KzAxOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wMy0yMVQxMzozMDo1NyswMTowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wMy0yMVQxMzozMDo1NyswMTowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDoyNDZmZjU5Yi03YjM1LTU2NGYtOWE2NS02MTY1MjcyYjQxMzAiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDoxZDY5NDUwNi0zNjhlLTg4NDUtOGNjZS01MmFhY2ViZTZiZjUiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDpjMThlYzZkOC01ODg4LWY2NDktODdiMy03MWZjM2Y4NmRkNmIiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjcmVhdGVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmMxOGVjNmQ4LTU4ODgtZjY0OS04N2IzLTcxZmMzZjg2ZGQ2YiIgc3RFdnQ6d2hlbj0iMjAyMS0wMy0yMVQxMzoxNTozNSswMTowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjb252ZXJ0ZWQiIHN0RXZ0OnBhcmFtZXRlcnM9ImZyb20gaW1hZ2UvYm1wIHRvIGltYWdlL3BuZyIvPiA8cmRmOmxpIHN0RXZ0OmFjdGlvbj0ic2F2ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6MjQ2ZmY1OWItN2IzNS01NjRmLTlhNjUtNjE2NTI3MmI0MTMwIiBzdEV2dDp3aGVuPSIyMDIxLTAzLTIxVDEzOjMwOjU3KzAxOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHN0RXZ0OmNoYW5nZWQ9Ii8iLz4gPC9yZGY6U2VxPiA8L3htcE1NOkhpc3Rvcnk+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+O8QQ/wAACCBJREFUeNrtneGSpCoMRufR+9H2zfberanqskRiSEIIer4fW9st2Ao5BkJwfj4Iba6fO/0d1w/NigADMBBgAAYCDMBAgAEYCAEGQoCBEGAgBBgIAQZCgIEQYCAEGAgBBkKAARgIMAADAQZgIMAADAQYgIEQYCAE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)",
                            backgroundPosition: "69% 28%",
                            backgroundRepeat: "no-repeat",
                            backgroundSize: "76%",
                          }
                          : {}
                      }
                    />
                  </div>
                )}
                {connectedFlashCart.status.progress > -1 && (
                  <div className="flashingPanel">
                    <i className="fa fa-fw fa-refresh fa-spin"></i>{" "}
                    {connectedFlashCart.status.step}...{" "}
                    {connectedFlashCart.status.progress}%
                  </div>
                )}

                <div className="flashLogWrapper">
                  <button
                    className="theia-button secondary"
                    onClick={() => this.toggleLog(index)}
                  >
                    {this.state.showLog[index] ? "Hide Log" : "Show Log"}
                  </button>
                  {this.state.showLog[index] && (
                    <pre className="flashLog">
                      {connectedFlashCart.status.log}
                    </pre>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </>
    ) : (
      <div className="noFlashCarts">No flash carts connected.</div>
    );
  }

  protected toggleLog(index: number) {
    this.state.showLog[index] = !this.state.showLog[index];
    this.update();
  }
}
