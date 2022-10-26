import { CommandService, nls } from '@theia/core';
import { PreferenceService } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { VesEmulatorCommands } from './ves-emulator-commands';
import { VesEmulatorPreferenceIds } from './ves-emulator-preferences';
import { VesEmulatorService } from './ves-emulator-service';

interface PreferencesProps {
  preferenceService: PreferenceService;
}

function AutoQueuePreference(props: PreferencesProps): JSX.Element {
  const [autoQueue, setAutoQueue] = React.useState<boolean>(props.preferenceService.get(VesEmulatorPreferenceIds.EMULATOR_AUTO_QUEUE, false));

  React.useEffect(() => {
    const preflistener = props.preferenceService.onPreferenceChanged(change => {
      if (change.preferenceName === VesEmulatorPreferenceIds.EMULATOR_AUTO_QUEUE) {
        const prefValue: boolean = change.newValue;
        setAutoQueue(prefValue);
      }
    });
    return () => preflistener.dispose();
  }, [props.preferenceService]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = e.target.checked;
    props.preferenceService.updateValue(VesEmulatorPreferenceIds.EMULATOR_AUTO_QUEUE, newChecked);
  };

  return <div className='autoQueue'>
    <label>
      <input type="checkbox" className="theia-input" onChange={handleChange} checked={autoQueue} />
      {nls.localize('vuengine/emulator/preferences/automaticallyQueue', 'Automatically queue')}
    </label>
  </div>;
}

@injectable()
export class VesEmulatorSidebarWidget extends ReactWidget {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(PreferenceService)
  private readonly preferenceService: PreferenceService;
  @inject(VesEmulatorService)
  private readonly vesEmulatorService: VesEmulatorService;

  static readonly ID = 'vesEmulatorSidebarWidget';
  static readonly LABEL = nls.localize('vuengine/emulator/emulator', 'Emulator');

  protected state = {
    showLog: [] as boolean[],
  };

  @postConstruct()
  protected async init(): Promise<void> {
    this.id = VesEmulatorSidebarWidget.ID;
    this.title.iconClass = 'codicon codicon-run';
    this.title.closable = true;
    this.setTitle();
    this.node.tabIndex = 0; // required for this.node.focus() to work in this.onActivateRequest()
    this.update();

    this.vesEmulatorService.onDidChangeIsQueued(isQueued => {
      this.title.className = isQueued ? 'ves-decorator-queued' : '';
      this.update();
    });
  }

  protected setTitle(): void {
    this.title.label = VesEmulatorSidebarWidget.LABEL;
    this.title.caption = this.title.label;
  }

  protected onActivateRequest(msg: Message): void {
    super.onActivateRequest(msg);
    this.node.focus();
  }

  protected render(): React.ReactNode {

    return <div className='runActions'>
      <button className='theia-button large full-width' onClick={this.run}>Run</button>

      <AutoQueuePreference
        preferenceService={this.preferenceService}
      />
    </div>;
  }

  protected run = () => this.commandService.executeCommand(VesEmulatorCommands.RUN.id);
}
