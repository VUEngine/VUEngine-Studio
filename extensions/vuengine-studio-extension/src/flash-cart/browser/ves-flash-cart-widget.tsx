import { CommandService, nls } from '@theia/core';
import { PreferenceService } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import IMAGE_HYPERFLASH32_LABEL from '../../../src/flash-cart/browser/images/hyperflash32-label.png';
import IMAGE_NO_FLASH_CARTS from '../../../src/flash-cart/browser/images/no-flash-carts.png';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { ConnectedFlashCart, FlashLogLine, HYPERFLASH32_PREFERENCE_NAME } from '../common/ves-flash-cart-types';
import { VesFlashCartCommands } from './ves-flash-cart-commands';
import { VesFlashCartPreferenceIds } from './ves-flash-cart-preferences';
import { VesFlashCartService } from './ves-flash-cart-service';

interface PreferencesProps {
  preferenceService: PreferenceService;
}

function AutoQueuePreference(props: PreferencesProps): JSX.Element {
  const [autoQueue, setAutoQueue] = React.useState<boolean>(props.preferenceService.get(VesFlashCartPreferenceIds.FLASH_CARTS_AUTO_QUEUE, false));

  React.useEffect(() => {
    const preflistener = props.preferenceService.onPreferenceChanged(change => {
      if (change.preferenceName === VesFlashCartPreferenceIds.FLASH_CARTS_AUTO_QUEUE) {
        const prefValue: boolean = change.newValue;
        setAutoQueue(prefValue);
      }
    });
    return () => preflistener.dispose();
  }, [props.preferenceService]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    props.preferenceService.updateValue(VesFlashCartPreferenceIds.FLASH_CARTS_AUTO_QUEUE, newChecked);
  };

  return <div className='autoQueue'>
    <label>
      <input type="checkbox" className="theia-input" onChange={handleChange} checked={autoQueue} />
      {nls.localize('vuengine/flashCarts/preferences/automaticallyQueue', 'Automatically queue')}
    </label>
  </div>;
}

@injectable()
export class VesFlashCartWidget extends ReactWidget {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(PreferenceService)
  private readonly preferenceService: PreferenceService;
  @inject(VesBuildService)
  private readonly vesBuildService: VesBuildService;
  @inject(VesCommonService)
  private readonly vesCommonService: VesCommonService;
  @inject(VesFlashCartService)
  private readonly vesFlashCartService: VesFlashCartService;
  @inject(WorkspaceService)
  private readonly workspaceService: WorkspaceService;

  static readonly ID = 'vesFlashCartWidget';
  static readonly LABEL = nls.localize('vuengine/flashCarts/flashCarts', 'Flash Carts');

  protected state = {
    showLog: [] as boolean[],
  };

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesFlashCartWidget.ID;
    this.title.iconClass = 'codicon codicon-layout-statusbar';
    this.title.closable = true;
    this.setTitle();
    this.node.tabIndex = 0; // required for this.node.focus() to work in this.onActivateRequest()
    this.update();

    this.vesFlashCartService.onDidChangeConnectedFlashCarts(() => {
      this.setTitle();
      this.update();
    });
    this.vesFlashCartService.onDidChangeIsFlashing(() => this.update());
    this.vesFlashCartService.onDidChangeIsQueued(isQueued => {
      this.title.className = isQueued ? 'ves-decorator-queued' : '';
      this.update();
    });
    this.vesFlashCartService.onDidChangeFlashingProgress(() => {
      this.handleProgressDecorator();
      this.update();
    });
    this.onDidChangeVisibility(() => {
      this.handleProgressDecorator();
    });
    this.vesFlashCartService.onDidChangeAtLeastOneCanHoldRom(() => this.update());

    this.vesFlashCartService.onDidSucceedFlashing(() => this.title.className = 'ves-decorator-success');
    this.vesFlashCartService.onDidFailFlashing(() => this.title.className = 'ves-decorator-error');
  }

  protected setTitle(): void {
    const count = this.vesFlashCartService.connectedFlashCarts.length;
    this.title.label = `${nls.localize('vuengine/flashCarts/connectedFlashCarts', 'Connected Flash Carts')}: ${count}`;
    this.title.caption = this.title.label;
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.node.focus();
  }

  protected handleProgressDecorator(): void {
    if (this.vesFlashCartService.isFlashing) {
      this.title.className = this.isVisible
        ? 'ves-decorator-progress'
        : `ves-decorator-progress ves-decorator-progress-${this.vesFlashCartService.flashingProgress}`;
    }
  }

  protected render(): React.ReactNode {
    return <>
      <div className='flashingActions'>
        {this.vesFlashCartService.isQueued && (
          <>
            <div className='flashingPanel'>
              <i className='fa fa-fw fa-hourglass-half'></i>{' '}
              <em>
                {nls.localize('vuengine/flashCarts/flashingIsQueued', 'Flashing is queued and will start once the build is ready')}
              </em>
            </div>
            <button
              className='theia-button large secondary'
              onClick={this.flash}
            >
              {nls.localize('vuengine/flashCarts/cancel', 'Cancel')}
            </button>
          </>
        )}
        {!this.vesFlashCartService.isQueued &&
          this.vesFlashCartService.flashingProgress > -1 && this.vesFlashCartService.flashingProgress < 100 && (
            <div className='flashingPanel'>
              <div className='vesProgressBar'>
                <div style={{ width: this.vesFlashCartService.flashingProgress + '%' }}></div>
                <span>
                  {this.vesFlashCartService.flashingProgress}%
                </span>
              </div>
            </div>
          )}
        {!this.vesFlashCartService.isQueued && !this.vesFlashCartService.isFlashing && (
          <button
            className='theia-button large flash'
            onClick={this.flash}
            disabled={!this.workspaceService.opened || !this.vesFlashCartService.atLeastOneCanHoldRom}
          >
            {nls.localize('vuengine/flashCarts/flash', 'Flash')}
          </button>
        )}
        {this.vesFlashCartService.isFlashing && (
          <button
            className='theia-button secondary'
            onClick={this.abort}
          >
            {nls.localize('vuengine/flashCarts/abort', 'Abort')}
          </button>
        )}
        <AutoQueuePreference
          preferenceService={this.preferenceService}
        />
      </div>
      <div>
        {this.vesFlashCartService.connectedFlashCarts.map(
          (connectedFlashCart: ConnectedFlashCart, index: number) => (
            <div className='flashCart' key={`flashCart${index}`}>
              <div className='flashCartInfo'>
                <div>
                  <h2>{connectedFlashCart.config.name}</h2>
                  <div className={!connectedFlashCart.canHoldRom ? 'warning' : ''}>
                    <i className='fa fa-fw fa-microchip'></i>{' '}
                    {connectedFlashCart.config.size} MBit<br />
                    ({connectedFlashCart.config.padRom
                      ? 'Padding Enabled'
                      : 'Padding Disabled'})
                  </div>
                  <div>
                    <i className='fa fa-fw fa-usb'></i>{' '}
                    {connectedFlashCart.deviceCodes.vid}:
                    {connectedFlashCart.deviceCodes.pid}<br />
                    {connectedFlashCart.deviceCodes.manufacturer}<br />
                    {connectedFlashCart.deviceCodes.product}<br />
                    {connectedFlashCart.port}
                  </div>
                  <div>
                    <i className='fa fa-fw fa-terminal'></i>{' '}
                    {this.vesCommonService.basename(connectedFlashCart.config.path)}{' '}
                    {connectedFlashCart.config.args}
                  </div>
                  {!connectedFlashCart.canHoldRom &&
                    <div className="infoPanel warning">
                      <i className='fa fa-fw fa-exclamation-triangle'></i>{' '}
                      {nls.localize('vuengine/flashCarts/insufficientSpaceToHoldRom', 'Insufficient space to hold ROM')} ({
                        this.vesBuildService.bytesToMbit(this.vesBuildService.romSize)
                      } MBit)
                    </div>
                  }
                  {connectedFlashCart.status.progress === 100 ? (
                    <div className='infoPanel success'>
                      <i className='fa fa-fw fa-check'></i> {nls.localize('vuengine/flashCarts/done', 'Done')}
                    </div>
                  ) : connectedFlashCart.status.progress > -1 ? (
                    <div className='infoPanel'>
                      <i className='fa fa-fw fa-cog fa-spin'></i>{' '}
                      {connectedFlashCart.status.step}...{' '}
                      {connectedFlashCart.status.progress}%
                    </div>
                  ) : <></>}
                </div>
                {connectedFlashCart.config.image && (
                  <div>
                    <img
                      src={connectedFlashCart.config.image}
                      style={
                        connectedFlashCart.config.name === HYPERFLASH32_PREFERENCE_NAME
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

              {connectedFlashCart.status.log.length > 0 &&
                <div className='flashLogWrapper'>
                  <button
                    className='theia-button secondary'
                    onClick={() => this.toggleLog(index)}
                  >
                    {this.state.showLog[index] ? 'Hide Log' : 'Show Log'}
                  </button>
                  {this.state.showLog[index] && (
                    <div className='flashLog'>
                      <div>
                        {connectedFlashCart.status.log.map(
                          (line: FlashLogLine, idx: number) => (
                            line.text !== ''
                              ? <div className="flashLogLine" key={`flashLogLine${idx}`}>
                                <span className='timestamp'>
                                  {new Date(line.timestamp).toTimeString().substring(0, 8)}
                                </span>
                                <span className='text'>
                                  {line.text}
                                </span>
                              </div>
                              : <div className='flashLogLine'></div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              }

            </div>
          )
        )}
      </div>
      {!this.vesFlashCartService.connectedFlashCarts.length &&
        <div className="theia-alert-message-container">
          <div className='flashCart'>
            <div className='flashCartInfo'>
              <div>
                <h2>{nls.localize('vuengine/flashCarts/noneFound', 'No flash carts found')}</h2>
                <p>{nls.localize('vuengine/flashCarts/connectYourFlashCarts', 'Connect your Virtual Boy flash cart(s) to your computer via USB.')}</p>
                <p>{nls.localize('vuengine/flashCarts/youCanConnectAnyNumberOfCarts', 'You can connect, and flash to, any number of flash carts at once.')}</p>
              </div>
              <div>
                <img src={IMAGE_NO_FLASH_CARTS} />
              </div>
            </div>
          </div>
        </div>}
    </>;
  }

  protected toggleLog = (index: number) => {
    this.state.showLog[index] = !this.state.showLog[index];
    this.update();
  };

  protected flash = () => this.commandService.executeCommand(VesFlashCartCommands.FLASH.id);
  protected abort = () => this.vesFlashCartService.abort();
}
