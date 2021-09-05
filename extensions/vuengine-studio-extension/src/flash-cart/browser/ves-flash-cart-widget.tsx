import { basename } from 'path';
import * as React from '@theia/core/shared/react';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { CommandService } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { VesFlashCartCommands } from './ves-flash-cart-commands';
import { ConnectedFlashCart } from './ves-flash-cart-types';
import { VesFlashCartService } from './ves-flash-cart-service';
import { VesFlashCartPreferenceIds, VesFlashCartPreferenceSchema } from './ves-flash-cart-preferences';
import { IMAGE_HYPERFLASH32_LABEL } from './images/hyperflash32-label';

@injectable()
export class VesFlashCartWidget extends ReactWidget {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(VesFlashCartService)
  private readonly vesFlashCartService: VesFlashCartService;

  static readonly ID = 'vesFlashCartWidget';
  static readonly LABEL = 'Connected Flash Carts';

  protected state = {
    showLog: [] as boolean[],
  };

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesFlashCartWidget.ID;
    this.title.iconClass = 'fa fa fa-microchip';
    // this.title.iconClass = 'ves-flash-cart-tab-icon';
    this.title.closable = true;
    this.setTitle();
    this.node.tabIndex = 0; // required for this.node.focus() to work in this.onActivateRequest()
    this.update();

    this.vesFlashCartService.onDidChangeConnectedFlashCarts(() => {
      this.setTitle();
      this.update();
    });
    this.vesFlashCartService.onDidChangeIsFlashing(() => this.update());
    this.vesFlashCartService.onDidChangeIsQueued(() => this.update());
    this.vesFlashCartService.onDidChangeFlashingProgress(() => this.update());
  }

  protected setTitle(): void {
    const count = this.vesFlashCartService.connectedFlashCarts.length;
    this.title.label = `${VesFlashCartWidget.LABEL}: ${count}`;
    this.title.caption = `${VesFlashCartWidget.LABEL}: ${count}`;
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.node.focus();
  }

  protected render(): React.ReactNode {
    return this.vesFlashCartService.connectedFlashCarts.length > 0 ? (
      <>
        <div className='flashingActions'>
          {this.vesFlashCartService.isQueued && (
            <>
              <div className='flashCartInfo'>
                <div>
                  <i className='fa fa-fw fa-hourglass-half'></i>{' '}
                  <em>
                    Flashing is queued and will start once the build is ready
                  </em>
                </div>
              </div>
              <button
                className='theia-button secondary'
                onClick={() =>
                  this.commandService.executeCommand(VesFlashCartCommands.FLASH.id)
                }
              >
                Cancel
              </button>
            </>
          )}
          {!this.vesFlashCartService.isQueued && this.vesFlashCartService.flashingProgress > -1 && (
            <div className='flashingPanel'>
              <div className='vesProgressBar'>
                <div style={{ width: this.vesFlashCartService.flashingProgress + '%' }}></div>
                <span>
                  {this.vesFlashCartService.flashingProgress === 100 ? (
                    <>
                      <i className='fa fa-check'></i> Done
                    </>
                  ) : (
                    <>{this.vesFlashCartService.flashingProgress}%</>
                  )}
                </span>
              </div>
            </div>
          )}
          {!this.vesFlashCartService.isQueued && !this.vesFlashCartService.isFlashing && (
            <>
              <button
                className='theia-button large flash'
                onClick={() =>
                  this.commandService.executeCommand(VesFlashCartCommands.FLASH.id)
                }
              >
                <i className='fa fa-microchip'></i> Flash
              </button>
            </>
          )}
          {this.vesFlashCartService.isFlashing && (
            <button
              className='theia-button secondary'
              onClick={() => this.vesFlashCartService.abort()}
            >
              Abort
            </button>
          )}
        </div>
        <div>
          {this.vesFlashCartService.connectedFlashCarts.map(
            (connectedFlashCart: ConnectedFlashCart, index: number) => (
              <div className='flashCart'>
                <div className='flashCartInfo'>
                  <div>
                    <h2>{connectedFlashCart.config.name}</h2>
                    <div>
                      <i className='fa fa-fw fa-microchip'></i>{' '}
                      {connectedFlashCart.config.size} MBit<br />
                      ({connectedFlashCart.config.padRom
                        ? 'Padding Enabled'
                        : 'Padding Disabled'})
                    </div>
                    <div>
                      <i className='fa fa-fw fa-usb'></i>{' '}
                      {connectedFlashCart.config.vid}:
                      {connectedFlashCart.config.pid}<br />
                      {connectedFlashCart.config.manufacturer}<br />
                      {connectedFlashCart.config.product}
                    </div>
                    <div>
                      <i className='fa fa-fw fa-terminal'></i>{' '}
                      {basename(connectedFlashCart.config.path)}{' '}
                      {connectedFlashCart.config.args}
                    </div>
                  </div>
                  {connectedFlashCart.config.image && (
                    <div>
                      <img
                        src={connectedFlashCart.config.image}
                        style={
                          connectedFlashCart.config.name ===
                            VesFlashCartPreferenceSchema.properties[VesFlashCartPreferenceIds.FLASH_CARTS].default[1].name
                            ? {
                              /* HyperFlash32 eInk label */
                              backgroundImage: `url(${IMAGE_HYPERFLASH32_LABEL})`,
                              backgroundPosition: '69% 28%',
                              backgroundRepeat: 'no-repeat',
                              backgroundSize: '76%',
                            }
                            : {}
                        }
                      />
                    </div>
                  )}
                </div>

                {connectedFlashCart.status.progress > -1 && (
                  <div className='flashingPanel'>
                    <i className='fa fa-fw fa-refresh fa-spin'></i>{' '}
                    {connectedFlashCart.status.step}...{' '}
                    {connectedFlashCart.status.progress}%
                  </div>
                )}

                <div className='flashLogWrapper'>
                  <button
                    className='theia-button secondary'
                    onClick={() => this.toggleLog(index)}
                  >
                    {this.state.showLog[index] ? 'Hide Log' : 'Show Log'}
                  </button>
                  {this.state.showLog[index] && (
                    <pre className='flashLog'>
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

      <div className="theia-alert-message-container">
        <div className="theia-warning-alert">
          <div className="theia-message-header">
            <i className="fa fa-exclamation-circle"></i>&nbsp;
            No flash carts found
          </div>
          <div className="theia-message-content">
          </div>
        </div>
        <p>Connect your Virtual Boy flash cart(s) to your computer via USB.</p>
        <p>You can connect, and flash to, any number of flash carts at once.</p>
      </div >

    );
  }

  protected toggleLog(index: number): void {
    this.state.showLog[index] = !this.state.showLog[index];
    this.update();
  }
}
