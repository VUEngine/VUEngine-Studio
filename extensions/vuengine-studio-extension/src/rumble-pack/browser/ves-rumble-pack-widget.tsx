import { nls } from '@theia/core';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { BUILT_IN_EFFECTS, HapticFrequency, RumblePakLogLine } from '../common/ves-rumble-pack-types';
import { VesRumblePackService } from './ves-rumble-pack-service';

export interface vesRumblePackWidgetState {
  effect: string
  frequency: HapticFrequency
  sustainPos: number
  sustainNeg: number
  break: number
  overdrive: number
};

@injectable()
export class VesRumblePackWidget extends ReactWidget {
  @inject(VesRumblePackService)
  private readonly vesRumblePackService: VesRumblePackService;

  static readonly ID = 'vesRumblePackWidget';
  static readonly LABEL = nls.localize('vuengine/rumblePack/rumblePackTool', 'Rumble Pack Tool');

  protected state: vesRumblePackWidgetState;

  protected rumblePakLogLineLastElementRef = React.createRef<HTMLDivElement>();

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesRumblePackWidget.ID;
    this.title.iconClass = 'codicon codicon-screen-full codicon-rotate-90';
    this.title.closable = true;
    this.title.label = VesRumblePackWidget.LABEL;
    this.title.caption = VesRumblePackWidget.LABEL;
    this.node.tabIndex = 0; // required for this.node.focus() to work in this.onActivateRequest()
    this.update();
    this.initState();

    this.vesRumblePackService.onDidChangeRumblePackIsConnected(() => this.update());
    this.vesRumblePackService.onDidChangeRumblePackLog(() => this.update());
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.node.focus();
  }

  protected onUpdateRequest(msg: Message): void {
    super.onUpdateRequest(msg);
    this.rumblePakLogLineLastElementRef.current?.scrollIntoView();
  }

  protected async initState(): Promise<void> {
    this.state = {
      effect: '001',
      frequency: HapticFrequency.Hz160,
      sustainPos: 255,
      sustainNeg: 255,
      break: 255,
      overdrive: 255,
    };
  }

  protected render(): React.ReactNode {
    return (
      <>
        <div>
          {nls.localize('vuengine/rumblePack/rumblePackConnectionStatus', 'Rumble Pack connection status')}: {
            this.vesRumblePackService.rumblePackIsConnected
              ? <span className='connected'>{nls.localize('vuengine/rumblePack/connected', 'Connected')}</span>
              : <span className='disconnected'>{nls.localize('vuengine/rumblePack/disconnected', 'Disconnected')}</span>
          }
        </div>
        <div className='rumble-pack-container'>
          <div>
            <div className='flex-row'>
              <div>
                <label>
                  {nls.localize('vuengine/rumblePack/effect', 'Effect')}
                </label>
                <select
                  className='theia-select'
                  title={nls.localize('vuengine/rumblePack/builtInHapticEffects', 'Built-In Haptic Effects')}
                  onChange={e => this.setStateEffect(e.target.value as unknown as string)}
                  value={this.state.effect}
                >
                  {BUILT_IN_EFFECTS.map((value, index) => (
                    <option value={(index + 1).toString().padStart(3, '0')}>{value}</option>
                  ))}
                </select>
                {/*
                <SelectComponent
                  value={this.state.effect}
                  options={BUILT_IN_EFFECTS.map((value, index) => ({
                    label: value,
                    value: (index + 1).toString().padStart(3, '0')
                  }))}
                  onChange={option => this.setStateEffect(option.value || '001')}
                />
                */}
              </div>
            </div>
            <div className='flex-row'>

              <div>
                <label>
                  {nls.localize('vuengine/rumblePack/frequency', 'Frequency')}
                </label>
                <select
                  className='theia-select'
                  title={nls.localize('vuengine/rumblePack/frequency', 'Frequency')}
                  onChange={e => this.setStateFrequency(e.target.value as unknown as HapticFrequency)}
                  value={this.state.frequency}
                >
                  <option value={HapticFrequency.Hz160}>160 Hz</option>
                  <option value={HapticFrequency.Hz240}>240 Hz</option>
                  <option value={HapticFrequency.Hz320}>320 Hz</option>
                  <option value={HapticFrequency.Hz400}>400 Hz</option>
                </select>
              </div>
              <div>
                <label>
                  {nls.localize('vuengine/rumblePack/sustainPos', 'Sustain (Pos.)')}
                </label>
                <input
                  type="number"
                  className="theia-input"
                  title={nls.localize('vuengine/rumblePack/positiveSustain', 'Positive Sustain')}
                  onChange={e => this.setStateSustainPos(parseInt(e.target.value))}
                  value={this.state.sustainPos}
                  min="0"
                  max="255"
                />
              </div>
              <div>
                <label>
                  {nls.localize('vuengine/rumblePack/sustainNeg', 'Sustain (Neg.)')}
                </label>
                <input
                  type="number"
                  className="theia-input"
                  title={nls.localize('vuengine/rumblePack/negativeSustain', 'Negative Sustain')}
                  onChange={e => this.setStateSustainNeg(parseInt(e.target.value))}
                  value={this.state.sustainNeg}
                  min="0"
                  max="255"
                />
              </div>
              <div>
                <label>
                  {nls.localize('vuengine/rumblePack/overdrive', 'Overdrive')}
                </label>
                <input
                  type="number"
                  className="theia-input"
                  title={nls.localize('vuengine/rumblePack/overdrive', 'Overdrive')}
                  onChange={e => this.setStateOverdrive(parseInt(e.target.value))}
                  value={this.state.overdrive}
                  min="0"
                  max="255"
                />
              </div>
              <div>
                <label>
                  {nls.localize('vuengine/rumblePack/break', 'Break')}
                </label>
                <input
                  type="number"
                  className="theia-input"
                  title={nls.localize('vuengine/rumblePack/break', 'Break')}
                  onChange={e => this.setStateBreak(parseInt(e.target.value))}
                  value={this.state.break}
                  min="0"
                  max="255"
                />
              </div>
            </div>
            <div>
              <label>
                {nls.localize('vuengine/rumblePack/actions', 'Actions')}
              </label>
              <div className='flex-row'>
                <button
                  className='theia-button'
                  title={nls.localize('vuengine/rumblePack/runEffect', 'Run effect')}
                  onClick={this.sendCommandPlayEffect}
                  disabled={!this.vesRumblePackService.rumblePackIsConnected}
                >
                  <i className='fa fa-play'></i>
                </button>
                <button
                  className='theia-button secondary'
                  title={nls.localize('vuengine/rumblePack/reRunLastEffect', 'Re-run last effect')}
                  onClick={this.sendCommandPlayLastEffect}
                  disabled={!this.vesRumblePackService.rumblePackIsConnected}
                >
                  <i className='fa fa-repeat'></i>
                </button>
                <button
                  className='theia-button secondary'
                  title={nls.localize('vuengine/rumblePack/stopCurrentEffect', 'Stop current effect')}
                  onClick={this.sendCommandStopCurrentEffect}
                  disabled={!this.vesRumblePackService.rumblePackIsConnected}
                >
                  <i className='fa fa-stop'></i>
                </button>
              </div>
            </div>
            <div>
              <div>
                <label>
                  {nls.localize('vuengine/rumblePack/printCommands', 'Print Commands')}
                </label>
                <div className='flex-row'>
                  <button
                    className='theia-button secondary'
                    onClick={this.sendCommandPrintMenu}
                    disabled={!this.vesRumblePackService.rumblePackIsConnected}
                  >
                    {nls.localize('vuengine/rumblePack/menu', 'Menu')}
                  </button>
                  <button
                    className='theia-button secondary'
                    onClick={this.sendCommandPrintVbCommandLineState}
                    disabled={!this.vesRumblePackService.rumblePackIsConnected}
                  >
                    {nls.localize('vuengine/rumblePack/vbCommandLineState', 'VB Command Line State')}
                  </button>
                  <button
                    className='theia-button secondary'
                    onClick={this.sendCommandPrintVbSyncLineState}
                    disabled={!this.vesRumblePackService.rumblePackIsConnected}
                  >
                    {nls.localize('vuengine/rumblePack/vbSyncLineState', 'VB Sync Line State')}
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label>
                {nls.localize('vuengine/rumblePack/jsonFormat', 'JSON Format')}
              </label>
              <pre>
                {JSON.stringify({
                  name: 'Test',
                  effect: this.state.effect,
                  frequency: Object.entries(HapticFrequency).find(([key, val]) => val === this.state.frequency)?.[0].replace('Hz', ''),
                  sustainPositive: this.state.sustainPos,
                  sustainNegative: this.state.sustainNeg,
                  overdrive: this.state.overdrive,
                  break: this.state.break,
                  stopBeforeStarting: true
                }, undefined, 2)}
              </pre>
            </div>
          </div>
          <div>
            <label>
              {nls.localize('vuengine/rumblePack/log', 'Log')}
            </label>
            <div className='rumblePakLog'>
              <div>
                {this.vesRumblePackService.rumblePackLog.map((line: RumblePakLogLine, index: number) => (
                  <div className='rumblePakLogLine' key={`rumblePakLogLine${index} `}>
                    <span>{new Date(line.timestamp).toTimeString().substring(0, 8)}</span>
                    <span>{line.text}</span>
                  </div>
                ))}
                <div ref={this.rumblePakLogLineLastElementRef} key={'rumblePakLogLineLast'}></div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  protected setStateEffect = (effect: string) => {
    this.state.effect = effect;
    this.update();
  };

  protected setStateFrequency = (frequency: HapticFrequency) => {
    this.state.frequency = frequency;
    this.sendCommandSetFrequency(frequency);
    this.update();
  };

  protected setStateSustainPos = (sustain: number) => {
    if (sustain >= 0 && sustain <= 255) {
      this.state.sustainPos = sustain;
      this.sendCommandSetPositiveSustain(sustain);
      this.update();
    }
  };

  protected setStateSustainNeg = (sustain: number) => {
    if (sustain >= 0 && sustain <= 255) {
      this.state.sustainNeg = sustain;
      this.sendCommandSetNegativeSustain(sustain);
      this.update();
    }
  };

  protected setStateOverdrive = (overdrive: number) => {
    if (overdrive >= 0 && overdrive <= 255) {
      this.state.overdrive = overdrive;
      this.sendCommandSetOverdrive(overdrive);
      this.update();
    }
  };

  protected setStateBreak = (breakValue: number) => {
    if (breakValue >= 0 && breakValue <= 255) {
      this.state.break = breakValue;
      this.sendCommandSetBreak(breakValue);
      this.update();
    }
  };

  protected sendCommandPrintMenu = () =>
    this.vesRumblePackService.sendCommandPrintMenu();

  protected sendCommandPrintVbCommandLineState = () =>
    this.vesRumblePackService.sendCommandPrintVbCommandLineState();

  protected sendCommandPrintVbSyncLineState = () =>
    this.vesRumblePackService.sendCommandPrintVbSyncLineState();

  protected sendCommandPlayLastEffect = () =>
    this.vesRumblePackService.sendCommandPlayLastEffect();

  protected sendCommandStopCurrentEffect = () =>
    this.vesRumblePackService.sendCommandStopCurrentEffect();

  protected sendCommandPlayEffect = () =>
    this.vesRumblePackService.sendCommandPlayEffect(this.state.effect);

  protected sendCommandSetFrequency = (frequency: HapticFrequency) =>
    this.vesRumblePackService.sendCommandSetFrequency(frequency);

  protected sendCommandSetOverdrive = (overdrive: number) =>
    this.vesRumblePackService.sendCommandSetOverdrive(overdrive);

  protected sendCommandSetPositiveSustain = (sustain: number) =>
    this.vesRumblePackService.sendCommandSetPositiveSustain(sustain);

  protected sendCommandSetNegativeSustain = (sustain: number) =>
    this.vesRumblePackService.sendCommandSetNegativeSustain(sustain);

  protected sendCommandSetBreak = (breakValue: number) =>
    this.vesRumblePackService.sendCommandSetBreak(breakValue);
}
