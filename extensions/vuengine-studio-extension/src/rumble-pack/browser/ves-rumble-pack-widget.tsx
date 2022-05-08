import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { HapticBuiltInEffect, HapticFrequency, HapticLibrary } from '../common/ves-rumble-pack-types';
import { VesRumblePackService } from './ves-rumble-pack-service';

const BUILT_IN_EFFECTS = {
  'Strong Click - 100 %': HapticBuiltInEffect.StrongClick_100,
  'Strong Click - 60 %': HapticBuiltInEffect.StrongClick_60,
  'Strong Click - 30 %': HapticBuiltInEffect.StrongClick_30,
  'Sharp Click - 100 %': HapticBuiltInEffect.SharpClick_100,
  'Sharp Click - 60 %': HapticBuiltInEffect.SharpClick_60,
  'Sharp Click - 30 %': HapticBuiltInEffect.SharpClick_30,
  'Soft Bump - 100 %': HapticBuiltInEffect.SoftBump_100,
  'Soft Bump - 60 %': HapticBuiltInEffect.SoftBump_60,
  'Soft Bump - 30 %': HapticBuiltInEffect.SoftBump_30,
  'Double Click - 100 %': HapticBuiltInEffect.DoubleClick_100,
  'Double Click - 60 %': HapticBuiltInEffect.DoubleClick_60,
  'Triple Click - 100 %': HapticBuiltInEffect.TripleClick_100,
  'Soft Fuzz - 60 %': HapticBuiltInEffect.SoftFuzz_60,
  'Strong Buzz - 100 %': HapticBuiltInEffect.StrongBuzz_100,
  '750 ms Alert 100 %': HapticBuiltInEffect.Alert750ms_100,
  '1000 ms Alert 100 %': HapticBuiltInEffect.Alert1000ms_100,
  'Strong Click 1 - 100 %': HapticBuiltInEffect.StrongClick1_100,
  'Strong Click 2 - 80 %': HapticBuiltInEffect.StrongClick2_80,
  'Strong Click 3 - 60 %': HapticBuiltInEffect.StrongClick3_60,
  'Strong Click 4 - 30 %': HapticBuiltInEffect.StrongClick4_30,
  'Medium Click 1 - 100 %': HapticBuiltInEffect.MediumClick1_100,
  'Medium Click 2 - 80 %': HapticBuiltInEffect.MediumClick2_80,
  'Medium Click 3 - 60 %': HapticBuiltInEffect.MediumClick3_60,
  'Sharp Tick 1 - 100 %': HapticBuiltInEffect.SharpTick1_100,
  'Sharp Tick 2 - 80 %': HapticBuiltInEffect.SharpTick2_80,
  'Sharp Tick 3 – 60 %': HapticBuiltInEffect.SharpTick3_60,
  'Short Double Click Strong 1 – 100 %': HapticBuiltInEffect.ShortDoubleClickStrong1_100,
  'Short Double Click Strong 2 – 80 %': HapticBuiltInEffect.ShortDoubleClickStrong2_80,
  'Short Double Click Strong 3 – 60 %': HapticBuiltInEffect.ShortDoubleClickStrong3_60,
  'Short Double Click Strong 4 – 30 %': HapticBuiltInEffect.ShortDoubleClickStrong4_30,
  'Short Double Click Medium 1 – 100 %': HapticBuiltInEffect.ShortDoubleClickMedium1_100,
  'Short Double Click Medium 2 – 80 %': HapticBuiltInEffect.ShortDoubleClickMedium2_80,
  'Short Double Click Medium 3 – 60 %': HapticBuiltInEffect.ShortDoubleClickMedium3_60,
  'Short Double Sharp Tick 1 – 100 %': HapticBuiltInEffect.ShortDoubleSharpTick1_100,
  'Short Double Sharp Tick 2 – 80 %': HapticBuiltInEffect.ShortDoubleSharpTick2_80,
  'Short Double Sharp Tick 3 – 60 %': HapticBuiltInEffect.ShortDoubleSharpTick3_60,
  'Long Double Sharp Click Strong 1 – 100 %': HapticBuiltInEffect.LongDoubleSharpClickStrong1_100,
  'Long Double Sharp Click Strong 2 – 80 %': HapticBuiltInEffect.LongDoubleSharpClickStrong2_80,
  'Long Double Sharp Click Strong 3 – 60 %': HapticBuiltInEffect.LongDoubleSharpClickStrong3_60,
  'Long Double Sharp Click Strong 4 – 30 %': HapticBuiltInEffect.LongDoubleSharpClickStrong4_30,
  'Long Double Sharp Click Medium 1 – 100 %': HapticBuiltInEffect.LongDoubleSharpClickMedium1_100,
  'Long Double Sharp Click Medium 2 – 80 %': HapticBuiltInEffect.LongDoubleSharpClickMedium2_80,
  'Long Double Sharp Click Medium 3 – 60 %': HapticBuiltInEffect.LongDoubleSharpClickMedium3_60,
  'Long Double Sharp Tick 1 – 100 %': HapticBuiltInEffect.LongDoubleSharpTick1_100,
  'Long Double Sharp Tick 2 – 80 %': HapticBuiltInEffect.LongDoubleSharpTick2_80,
  'Long Double Sharp Tick 3 – 60 %': HapticBuiltInEffect.LongDoubleSharpTick3_60,
  'Buzz 1 – 100 %': HapticBuiltInEffect.Buzz1_100,
  'Buzz 2 – 80 %': HapticBuiltInEffect.Buzz2_80,
  'Buzz 3 – 60 %': HapticBuiltInEffect.Buzz3_60,
  'Buzz 4 – 40 %': HapticBuiltInEffect.Buzz4_40,
  'Buzz 5 – 20 %': HapticBuiltInEffect.Buzz5_20,
  'Pulsing Strong 1 – 100 %': HapticBuiltInEffect.PulsingStrong1_100,
  'Pulsing Strong 2 – 60 %': HapticBuiltInEffect.PulsingStrong2_60,
  'Pulsing Medium 1 – 100 %': HapticBuiltInEffect.PulsingMedium1_100,
  'Pulsing Medium 2 – 60 %': HapticBuiltInEffect.PulsingMedium2_60,
  'Pulsing Sharp 1 – 100 %': HapticBuiltInEffect.PulsingSharp1_100,
  'Pulsing Sharp 2 – 60 %': HapticBuiltInEffect.PulsingSharp2_60,
  'Transition Click 1 – 100 %': HapticBuiltInEffect.TransitionClick1_100,
  'Transition Click 2 – 80 %': HapticBuiltInEffect.TransitionClick2_80,
  'Transition Click 3 – 60 %': HapticBuiltInEffect.TransitionClick3_60,
  'Transition Click 4 – 40 %': HapticBuiltInEffect.TransitionClick4_40,
  'Transition Click 5 – 20 %': HapticBuiltInEffect.TransitionClick5_20,
  'Transition Click 6 – 10 %': HapticBuiltInEffect.TransitionClick6_10,
  'Transition Hum 1 – 100 %': HapticBuiltInEffect.TransitionHum1_100,
  'Transition Hum 2 – 80 %': HapticBuiltInEffect.TransitionHum2_80,
  'Transition Hum 3 – 60 %': HapticBuiltInEffect.TransitionHum3_60,
  'Transition Hum 4 – 40 %': HapticBuiltInEffect.TransitionHum4_40,
  'Transition Hum 5 – 20 %': HapticBuiltInEffect.TransitionHum5_20,
  'Transition Hum 6 – 10 %': HapticBuiltInEffect.TransitionHum6_10,
  'Transition Ramp Down Long Smooth 1 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownLongSmooth1_100to0,
  'Transition Ramp Down Long Smooth 2 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownLongSmooth2_100to0,
  'Transition Ramp Down Medium Smooth 1 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownMediumSmooth1_100to0,
  'Transition Ramp Down Medium Smooth 2 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownMediumSmooth2_100to0,
  'Transition Ramp Down Short Smooth 1 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownShortSmooth1_100to0,
  'Transition Ramp Down Short Smooth 2 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownShortSmooth2_100to0,
  'Transition Ramp Down Long Sharp 1 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownLongSharp1_100to0,
  'Transition Ramp Down Long Sharp 2 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownLongSharp2_100to0,
  'Transition Ramp Down Medium Sharp 1 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownMediumSharp1_100to0,
  'Transition Ramp Down Medium Sharp 2 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownMediumSharp2_100to0,
  'Transition Ramp Down Short Sharp 1 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownShortSharp1_100to0,
  'Transition Ramp Down Short Sharp 2 – 100 to 0 %': HapticBuiltInEffect.TransitionRampDownShortSharp2_100to0,
  'Transition Ramp Up Long Smooth 1 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpLongSmooth1_0to100,
  'Transition Ramp Up Long Smooth 2 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpLongSmooth2_0to100,
  'Transition Ramp Up Medium Smooth 1 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpMediumSmooth1_0to100,
  'Transition Ramp Up Medium Smooth 2 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpMediumSmooth2_0to100,
  'Transition Ramp Up Short Smooth 1 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpShortSmooth1_0to100,
  'Transition Ramp Up Short Smooth 2 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpShortSmooth2_0to100,
  'Transition Ramp Up Long Sharp 1 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpLongSharp1_0to100,
  'Transition Ramp Up Long Sharp 2 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpLongSharp2_0to100,
  'Transition Ramp Up Medium Sharp 1 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpMediumSharp1_0to100,
  'Transition Ramp Up Medium Sharp 2 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpMediumSharp2_0to100,
  'Transition Ramp Up Short Sharp 1 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpShortSharp1_0to100,
  'Transition Ramp Up Short Sharp 2 – 0 to 100 %': HapticBuiltInEffect.TransitionRampUpShortSharp2_0to100,
  'Transition Ramp Down Long Smooth 1 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownLongSmooth1_50to0,
  'Transition Ramp Down Long Smooth 2 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownLongSmooth2_50to0,
  'Transition Ramp Down Medium Smooth 1 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownMediumSmooth1_50to0,
  'Transition Ramp Down Medium Smooth 2 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownMediumSmooth2_50to0,
  'Transition Ramp Down Short Smooth 1 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownShortSmooth1_50to0,
  'Transition Ramp Down Short Smooth 2 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownShortSmooth2_50to0,
  'Transition Ramp Down Long Sharp 1 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownLongSharp1_50to0,
  'Transition Ramp Down Long Sharp 2 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownLongSharp2_50to0,
  'Transition Ramp Down Medium Sharp 1 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownMediumSharp1_50to0,
  'Transition Ramp Down Medium Sharp 2 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownMediumSharp2_50to0,
  'Transition Ramp Down Short Sharp 1 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownShortSharp1_50to0,
  'Transition Ramp Down Short Sharp 2 – 50 to 0 %': HapticBuiltInEffect.TransitionRampDownShortSharp2_50to0,
  'Transition Ramp Up Long Smooth 1 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpLongSmooth1_0to50,
  'Transition Ramp Up Long Smooth 2 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpLongSmooth2_0to50,
  'Transition Ramp Up Medium Smooth 1 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpMediumSmooth1_0to50,
  'Transition Ramp Up Medium Smooth 2 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpMediumSmooth2_0to50,
  'Transition Ramp Up Short Smooth 1 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpShortSmooth1_0to50,
  'Transition Ramp Up Short Smooth 2 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpShortSmooth2_0to50,
  'Transition Ramp Up Long Sharp 1 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpLongSharp1_0to50,
  'Transition Ramp Up Long Sharp 2 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpLongSharp2_0to50,
  'Transition Ramp Up Medium Sharp 1 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpMediumSharp1_0to50,
  'Transition Ramp Up Medium Sharp 2 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpMediumSharp2_0to50,
  'Transition Ramp Up Short Sharp 1 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpShortSharp1_0to50,
  'Transition Ramp Up Short Sharp 2 – 0 to 50 %': HapticBuiltInEffect.TransitionRampUpShortSharp2_0to50,
  'Long buzz for programmatic stopping – 100 %': HapticBuiltInEffect.LongBuzzForProgrammaticStopping_100,
  'Smooth Hum 1 (No kick or brake pulse) – 50 %': HapticBuiltInEffect.SmoothHum1_50,
  'Smooth Hum 2 (No kick or brake pulse) – 40 %': HapticBuiltInEffect.SmoothHum2_40,
  'Smooth Hum 3 (No kick or brake pulse) – 30 %': HapticBuiltInEffect.SmoothHum3_30,
  'Smooth Hum 4 (No kick or brake pulse) – 20 %': HapticBuiltInEffect.SmoothHum4_20,
  'Smooth Hum 5 (No kick or brake pulse) – 10 %': HapticBuiltInEffect.SmoothHum5_10,
};

export interface vesRumblePackWidgetState {
  library: HapticLibrary
  haptic: HapticBuiltInEffect
  frequency: HapticFrequency
};

@injectable()
export class VesRumblePackWidget extends ReactWidget {
  @inject(VesRumblePackService)
  private readonly vesRumblePackService: VesRumblePackService;

  static readonly ID = 'vesRumblePackWidget';
  static readonly LABEL = 'Rumble Pack Tool';

  protected state: vesRumblePackWidgetState;

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesRumblePackWidget.ID;
    this.title.iconClass = 'fa fa-usb';
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

  protected async initState(): Promise<void> {
    this.state = {
      library: HapticLibrary.ERM1,
      haptic: BUILT_IN_EFFECTS['Strong Click - 100 %'],
      frequency: HapticFrequency.Hz320,
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
            <div>
              <select
                className='theia-select'
                title='Built-In Haptic Effects'
                onChange={e => this.setStateHaptic(e.target.value as unknown as HapticBuiltInEffect)}
                value={this.state.haptic}
              >
                {Object.keys(BUILT_IN_EFFECTS).map(key => (
                  // @ts-ignore
                  <option value={BUILT_IN_EFFECTS[key]}>{key}</option>
                ))}
              </select>

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

              <button
                className='theia-button secondary'
                onClick={this.sendCommandTriggerSingleHaptic}
                disabled={!this.vesRumblePackService.rumblePackIsConnected}
              >
                Test
              </button>

            </div>
            <div>
              <button
                className='theia-button secondary'
                onClick={this.sendCommandPrintMenu}
                disabled={!this.vesRumblePackService.rumblePackIsConnected}
              >
                Print Menu
              </button>
            </div>
          </div>
          <div>
            Log:<br />
            {this.vesRumblePackService.rumblePackLog.map(log => (
              <div>
                {log.timestamp}: {log.text}
              </div>
            ))}
          </div>
        </div>
      </>
    );
  }

  protected setStateHaptic = (haptic: HapticBuiltInEffect) => {
    this.state.haptic = haptic;
    this.update();
  };

  protected setStateFrequency = (frequency: HapticFrequency) => {
    this.state.frequency = frequency;
    this.update();
  };

  protected sendCommandPrintMenu = () =>
    this.vesRumblePackService.sendCommandPrintMenu();

  protected sendCommandTriggerSingleHaptic = () =>
    this.vesRumblePackService.sendCommandTriggerSingleHaptic(
      this.state.library,
      this.state.haptic,
      this.state.frequency,
    );
}
