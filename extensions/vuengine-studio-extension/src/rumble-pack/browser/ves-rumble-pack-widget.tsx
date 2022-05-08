import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { HapticBuiltInEffect, HapticFrequency, RumblePakLogLine } from '../common/ves-rumble-pack-types';
import { VesRumblePackService } from './ves-rumble-pack-service';

const BUILT_IN_EFFECTS = {
  '1) Strong Click - 100 %': HapticBuiltInEffect.StrongClick_100,
  '2) Strong Click - 60 %': HapticBuiltInEffect.StrongClick_60,
  '3) Strong Click - 30 %': HapticBuiltInEffect.StrongClick_30,
  '4) Sharp Click - 100 %': HapticBuiltInEffect.SharpClick_100,
  '5) Sharp Click - 60 %': HapticBuiltInEffect.SharpClick_60,
  '6) Sharp Click - 30 %': HapticBuiltInEffect.SharpClick_30,
  '7) Soft Bump - 100 %': HapticBuiltInEffect.SoftBump_100,
  '8) Soft Bump - 60 %': HapticBuiltInEffect.SoftBump_60,
  '9) Soft Bump - 30 %': HapticBuiltInEffect.SoftBump_30,
  '10) Double Click - 100 %': HapticBuiltInEffect.DoubleClick_100,
  '11) Double Click - 60 %': HapticBuiltInEffect.DoubleClick_60,
  '12) Triple Click - 100 %': HapticBuiltInEffect.TripleClick_100,
  '13) Soft Fuzz - 60 %': HapticBuiltInEffect.SoftFuzz_60,
  '14) Strong Buzz - 100 %': HapticBuiltInEffect.StrongBuzz_100,
  '15) 750 ms Alert 100 %': HapticBuiltInEffect.Alert750ms_100,
  '16) 1000 ms Alert 100 %': HapticBuiltInEffect.Alert1000ms_100,
  '17) Strong Click 1 - 100 %': HapticBuiltInEffect.StrongClick1_100,
  '18) Strong Click 2 - 80 %': HapticBuiltInEffect.StrongClick2_80,
  '19) Strong Click 3 - 60 %': HapticBuiltInEffect.StrongClick3_60,
  '20) Strong Click 4 - 30 %': HapticBuiltInEffect.StrongClick4_30,
  '21) Medium Click 1 - 100 %': HapticBuiltInEffect.MediumClick1_100,
  '22) Medium Click 2 - 80 %': HapticBuiltInEffect.MediumClick2_80,
  '23) Medium Click 3 - 60 %': HapticBuiltInEffect.MediumClick3_60,
  '24) Sharp Tick 1 - 100 %': HapticBuiltInEffect.SharpTick1_100,
  '25) Sharp Tick 2 - 80 %': HapticBuiltInEffect.SharpTick2_80,
  '26) Sharp Tick 3 – 60 %': HapticBuiltInEffect.SharpTick3_60,
  '27) Short Double Click Strong 1 – 100 %': HapticBuiltInEffect.ShortDoubleClickStrong1_100,
  '28) Short Double Click Strong 2 – 80 %': HapticBuiltInEffect.ShortDoubleClickStrong2_80,
  '29) Short Double Click Strong 3 – 60 %': HapticBuiltInEffect.ShortDoubleClickStrong3_60,
  '30) Short Double Click Strong 4 – 30 %': HapticBuiltInEffect.ShortDoubleClickStrong4_30,
  '31) Short Double Click Medium 1 – 100 %': HapticBuiltInEffect.ShortDoubleClickMedium1_100,
  '32) Short Double Click Medium 2 – 80 %': HapticBuiltInEffect.ShortDoubleClickMedium2_80,
  '33) Short Double Click Medium 3 – 60 %': HapticBuiltInEffect.ShortDoubleClickMedium3_60,
  '34) Short Double Sharp Tick 1 – 100 %': HapticBuiltInEffect.ShortDoubleSharpTick1_100,
  '35) Short Double Sharp Tick 2 – 80 %': HapticBuiltInEffect.ShortDoubleSharpTick2_80,
  '36) Short Double Sharp Tick 3 – 60 %': HapticBuiltInEffect.ShortDoubleSharpTick3_60,
  '37) Long Double Sharp Click Strong 1 – 100 %': HapticBuiltInEffect.LongDoubleSharpClickStrong1_100,
  '38) Long Double Sharp Click Strong 2 – 80 %': HapticBuiltInEffect.LongDoubleSharpClickStrong2_80,
  '39) Long Double Sharp Click Strong 3 – 60 %': HapticBuiltInEffect.LongDoubleSharpClickStrong3_60,
  '40) Long Double Sharp Click Strong 4 – 30 %': HapticBuiltInEffect.LongDoubleSharpClickStrong4_30,
  '41) Long Double Sharp Click Medium 1 – 100 %': HapticBuiltInEffect.LongDoubleSharpClickMedium1_100,
  '42) Long Double Sharp Click Medium 2 – 80 %': HapticBuiltInEffect.LongDoubleSharpClickMedium2_80,
  '43) Long Double Sharp Click Medium 3 – 60 %': HapticBuiltInEffect.LongDoubleSharpClickMedium3_60,
  '44) Long Double Sharp Tick 1 – 100 %': HapticBuiltInEffect.LongDoubleSharpTick1_100,
  '45) Long Double Sharp Tick 2 – 80 %': HapticBuiltInEffect.LongDoubleSharpTick2_80,
  '46) Long Double Sharp Tick 3 – 60 %': HapticBuiltInEffect.LongDoubleSharpTick3_60,
  '47) Buzz 1 – 100 %': HapticBuiltInEffect.Buzz1_100,
  '48) Buzz 2 – 80 %': HapticBuiltInEffect.Buzz2_80,
  '49) Buzz 3 – 60 %': HapticBuiltInEffect.Buzz3_60,
  '50) Buzz 4 – 40 %': HapticBuiltInEffect.Buzz4_40,
  '51) Buzz 5 – 20 %': HapticBuiltInEffect.Buzz5_20,
  '52) Pulsing Strong 1 – 100 %': HapticBuiltInEffect.PulsingStrong1_100,
  '53) Pulsing Strong 2 – 60 %': HapticBuiltInEffect.PulsingStrong2_60,
  '54) Pulsing Medium 1 – 100 %': HapticBuiltInEffect.PulsingMedium1_100,
  '55) Pulsing Medium 2 – 60 %': HapticBuiltInEffect.PulsingMedium2_60,
  '56) Pulsing Sharp 1 – 100 %': HapticBuiltInEffect.PulsingSharp1_100,
  '57) Pulsing Sharp 2 – 60 %': HapticBuiltInEffect.PulsingSharp2_60,
  '58) Transition Click 1 – 100 %': HapticBuiltInEffect.TransitionClick1_100,
  '59) Transition Click 2 – 80 %': HapticBuiltInEffect.TransitionClick2_80,
  '60) Transition Click 3 – 60 %': HapticBuiltInEffect.TransitionClick3_60,
  '61) Transition Click 4 – 40 %': HapticBuiltInEffect.TransitionClick4_40,
  '62) Transition Click 5 – 20 %': HapticBuiltInEffect.TransitionClick5_20,
  '63) Transition Click 6 – 10 %': HapticBuiltInEffect.TransitionClick6_10,
  '64) Transition Hum 1 – 100 %': HapticBuiltInEffect.TransitionHum1_100,
  '65) Transition Hum 2 – 80 %': HapticBuiltInEffect.TransitionHum2_80,
  '66) Transition Hum 3 – 60 %': HapticBuiltInEffect.TransitionHum3_60,
  '67) Transition Hum 4 – 40 %': HapticBuiltInEffect.TransitionHum4_40,
  '68) Transition Hum 5 – 20 %': HapticBuiltInEffect.TransitionHum5_20,
  '69) Transition Hum 6 – 10 %': HapticBuiltInEffect.TransitionHum6_10,
  '70) Transition Ramp Down Long Smooth 1 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownLongSmooth1_100to0,
  '71) Transition Ramp Down Long Smooth 2 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownLongSmooth2_100to0,
  '72) Transition Ramp Down Medium Smooth 1 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownMediumSmooth1_100to0,
  '73) Transition Ramp Down Medium Smooth 2 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownMediumSmooth2_100to0,
  '74) Transition Ramp Down Short Smooth 1 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownShortSmooth1_100to0,
  '75) Transition Ramp Down Short Smooth 2 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownShortSmooth2_100to0,
  '76) Transition Ramp Down Long Sharp 1 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownLongSharp1_100to0,
  '77) Transition Ramp Down Long Sharp 2 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownLongSharp2_100to0,
  '78) Transition Ramp Down Medium Sharp 1 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownMediumSharp1_100to0,
  '79) Transition Ramp Down Medium Sharp 2 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownMediumSharp2_100to0,
  '80) Transition Ramp Down Short Sharp 1 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownShortSharp1_100to0,
  '81) Transition Ramp Down Short Sharp 2 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownShortSharp2_100to0,
  '82) Transition Ramp Up Long Smooth 1 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpLongSmooth1_0to100,
  '83) Transition Ramp Up Long Smooth 2 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpLongSmooth2_0to100,
  '84) Transition Ramp Up Medium Smooth 1 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpMediumSmooth1_0to100,
  '85) Transition Ramp Up Medium Smooth 2 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpMediumSmooth2_0to100,
  '86) Transition Ramp Up Short Smooth 1 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpShortSmooth1_0to100,
  '87) Transition Ramp Up Short Smooth 2 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpShortSmooth2_0to100,
  '88) Transition Ramp Up Long Sharp 1 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpLongSharp1_0to100,
  '89) Transition Ramp Up Long Sharp 2 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpLongSharp2_0to100,
  '90) Transition Ramp Up Medium Sharp 1 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpMediumSharp1_0to100,
  '91) Transition Ramp Up Medium Sharp 2 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpMediumSharp2_0to100,
  '92) Transition Ramp Up Short Sharp 1 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpShortSharp1_0to100,
  '93) Transition Ramp Up Short Sharp 2 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpShortSharp2_0to100,
  '94) Transition Ramp Down Long Smooth 1 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownLongSmooth1_50to0,
  '95) Transition Ramp Down Long Smooth 2 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownLongSmooth2_50to0,
  '96) Transition Ramp Down Medium Smooth 1 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownMediumSmooth1_50to0,
  '97) Transition Ramp Down Medium Smooth 2 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownMediumSmooth2_50to0,
  '98) Transition Ramp Down Short Smooth 1 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownShortSmooth1_50to0,
  '99) Transition Ramp Down Short Smooth 2 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownShortSmooth2_50to0,
  '100) Transition Ramp Down Long Sharp 1 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownLongSharp1_50to0,
  '101) Transition Ramp Down Long Sharp 2 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownLongSharp2_50to0,
  '102) Transition Ramp Down Medium Sharp 1 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownMediumSharp1_50to0,
  '103) Transition Ramp Down Medium Sharp 2 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownMediumSharp2_50to0,
  '104) Transition Ramp Down Short Sharp 1 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownShortSharp1_50to0,
  '105) Transition Ramp Down Short Sharp 2 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownShortSharp2_50to0,
  '106) Transition Ramp Up Long Smooth 1 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpLongSmooth1_0to50,
  '107) Transition Ramp Up Long Smooth 2 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpLongSmooth2_0to50,
  '108) Transition Ramp Up Medium Smooth 1 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpMediumSmooth1_0to50,
  '109) Transition Ramp Up Medium Smooth 2 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpMediumSmooth2_0to50,
  '110) Transition Ramp Up Short Smooth 1 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpShortSmooth1_0to50,
  '111) Transition Ramp Up Short Smooth 2 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpShortSmooth2_0to50,
  '112) Transition Ramp Up Long Sharp 1 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpLongSharp1_0to50,
  '113) Transition Ramp Up Long Sharp 2 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpLongSharp2_0to50,
  '114) Transition Ramp Up Medium Sharp 1 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpMediumSharp1_0to50,
  '115) Transition Ramp Up Medium Sharp 2 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpMediumSharp2_0to50,
  '116) Transition Ramp Up Short Sharp 1 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpShortSharp1_0to50,
  '117) Transition Ramp Up Short Sharp 2 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpShortSharp2_0to50,
  '118) Long buzz for programmatic stopping – 100 %': HapticBuiltInEffect.LongBuzzForProgrammaticStopping_100,
  '119) Smooth Hum 1 (No kick or brake pulse) – 50 %': HapticBuiltInEffect.SmoothHum1_50,
  '120) Smooth Hum 2 (No kick or brake pulse) – 40 %': HapticBuiltInEffect.SmoothHum2_40,
  '121) Smooth Hum 3 (No kick or brake pulse) – 30 %': HapticBuiltInEffect.SmoothHum3_30,
  '122) Smooth Hum 4 (No kick or brake pulse) – 20 %': HapticBuiltInEffect.SmoothHum4_20,
  '123) Smooth Hum 5 (No kick or brake pulse) – 10 %': HapticBuiltInEffect.SmoothHum5_10,
};

export interface vesRumblePackWidgetState {
  effect: HapticBuiltInEffect
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
  static readonly LABEL = 'Rumble Pack Tool';

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
      effect: HapticBuiltInEffect.StrongClick_100,
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
          Rumble Pack connection status: {
            this.vesRumblePackService.rumblePackIsConnected
              ? <span className='connected'>Connected</span>
              : <span className='disconnected'>Disconnected</span>
          }
        </div>
        <div className='rumble-pack-container'>
          <div>
            <div className='flex-row'>
              <div>
                <label>Effect</label>
                <select
                  className='theia-select'
                  title='Built-In Haptic Effects'
                  onChange={e => this.setStateEffect(e.target.value as unknown as HapticBuiltInEffect)}
                  value={this.state.effect}
                >
                  {Object.keys(BUILT_IN_EFFECTS).map(key => (
                    // @ts-ignore
                    <option value={BUILT_IN_EFFECTS[key]}>{key}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className='flex-row'>

              <div>
                <label>Frequency</label>
                <select
                  className='theia-select'
                  title='Frequency'
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
                <label>Sustain (Pos.)</label>
                <input
                  type="number"
                  className='theia-input'
                  title='Positive Sustain'
                  onChange={e => this.setStateSustainPos(parseInt(e.target.value))}
                  value={this.state.sustainPos}
                  min="0"
                  max="255"
                />
              </div>
              <div>
                <label>Sustain (Neg.)</label>
                <input
                  type="number"
                  className='theia-input'
                  title='Negative Sustain'
                  onChange={e => this.setStateSustainNeg(parseInt(e.target.value))}
                  value={this.state.sustainNeg}
                  min="0"
                  max="255"
                />
              </div>
              <div>
                <label>Overdrive</label>
                <input
                  type="number"
                  className='theia-input'
                  title='Overdrive'
                  onChange={e => this.setStateOverdrive(parseInt(e.target.value))}
                  value={this.state.overdrive}
                  min="0"
                  max="255"
                />
              </div>
              <div>
                <label>Break</label>
                <input
                  type="number"
                  className='theia-input'
                  title='Break'
                  onChange={e => this.setStateBreak(parseInt(e.target.value))}
                  value={this.state.break}
                  min="0"
                  max="255"
                />
              </div>
            </div>
            <div>
              <label>Actions</label>
              <div className='flex-row'>
                <button
                  className='theia-button'
                  title='Run effect'
                  onClick={this.sendCommandPlayEffect}
                  disabled={!this.vesRumblePackService.rumblePackIsConnected}
                >
                  <i className='fa fa-play'></i>
                </button>
                <button
                  className='theia-button secondary'
                  title='Re-run last effect'
                  onClick={this.sendCommandPlayLastEffect}
                  disabled={!this.vesRumblePackService.rumblePackIsConnected}
                >
                  <i className='fa fa-repeat'></i>
                </button>
                <button
                  className='theia-button secondary'
                  title='Stop current effect'
                  onClick={this.sendCommandStopCurrentEffect}
                  disabled={!this.vesRumblePackService.rumblePackIsConnected}
                >
                  <i className='fa fa-stop'></i>
                </button>
              </div>
            </div>
            <div>
              <div>
                <label>Print Commands</label>
                <div className='flex-row'>
                  <button
                    className='theia-button secondary'
                    onClick={this.sendCommandPrintMenu}
                    disabled={!this.vesRumblePackService.rumblePackIsConnected}
                  >
                    Menu
                  </button>
                  <button
                    className='theia-button secondary'
                    onClick={this.sendCommandPrintVbCommandLineState}
                    disabled={!this.vesRumblePackService.rumblePackIsConnected}
                  >
                    VB Command Line State
                  </button>
                  <button
                    className='theia-button secondary'
                    onClick={this.sendCommandPrintVbSyncLineState}
                    disabled={!this.vesRumblePackService.rumblePackIsConnected}
                  >
                    VB Sync Line State
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label>JSON Format</label>
              <pre>
                {JSON.stringify({
                  name: 'Test',
                  effect: parseInt(this.state.effect),
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
            <label>Log</label>
            <div className='rumblePakLog'>
              <div>
                {this.vesRumblePackService.rumblePackLog.length > 0 ? this.vesRumblePackService.rumblePackLog.map((line: RumblePakLogLine, index: number) => (
                  <div className='rumblePakLogLine' key={`rumblePakLogLine${index}`}>
                    <span>{new Date(line.timestamp).toTimeString().substring(0, 8)}</span>
                    <span>{line.text}</span>
                  </div>
                )) : (
                  <div className='rumblePakLogLine' key={'rumblePakLogLineEmpty'}>
                    <span>-</span>
                    <span></span>
                  </div>
                )}
                <div ref={this.rumblePakLogLineLastElementRef} key={'rumblePakLogLineLast'}></div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  protected setStateEffect = (effect: HapticBuiltInEffect) => {
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
