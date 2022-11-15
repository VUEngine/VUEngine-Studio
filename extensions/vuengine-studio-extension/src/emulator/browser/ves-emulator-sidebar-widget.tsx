import { CommandService, nls } from '@theia/core';
import { ConfirmDialog, PreferenceService } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import URI from '@theia/core/lib/common/uri';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { FileDialogService, OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { VesEmulatorCommands } from './ves-emulator-commands';
import { VesEmulatorPreferenceIds } from './ves-emulator-preferences';
import { VesEmulatorService } from './ves-emulator-service';
import { EmulatorConfig } from './ves-emulator-types';

interface AutoQueuePreferenceProps {
  preferenceService: PreferenceService;
}

function AutoQueuePreference(props: AutoQueuePreferenceProps): JSX.Element {
  const [autoQueue, setAutoQueue] = React.useState<boolean>(props.preferenceService.get(VesEmulatorPreferenceIds.EMULATOR_AUTO_QUEUE, false));

  React.useEffect(() => {
    const preflistener = props.preferenceService.onPreferenceChanged(change => {
      if (change.preferenceName === VesEmulatorPreferenceIds.EMULATOR_AUTO_QUEUE) {
        setAutoQueue(change.newValue);
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

interface EmulatorConfigsProps {
  fileService: FileService;
  fileDialogService: FileDialogService;
  preferenceService: PreferenceService;
}

function EmulatorConfigs(props: EmulatorConfigsProps): JSX.Element {
  const [defaultEmulator, setDefaultEmulator] = React.useState<string>(props.preferenceService.get(VesEmulatorPreferenceIds.DEFAULT_EMULATOR, ''));
  const [emulatorConfigs, setEmulatorConfigs] = React.useState<EmulatorConfig[]>(props.preferenceService.get(VesEmulatorPreferenceIds.EMULATORS, []));

  React.useEffect(() => {
    const preflistener = props.preferenceService.onPreferenceChanged(change => {
      if (change.preferenceName === VesEmulatorPreferenceIds.DEFAULT_EMULATOR) {
        setDefaultEmulator(change.newValue);
      } else if (change.preferenceName === VesEmulatorPreferenceIds.EMULATORS) {
        setEmulatorConfigs(change.newValue);
      }
    });
    return () => preflistener.dispose();
  }, [props.preferenceService]);

  const updateDefaultEmulator = (newValue: string) => {
    props.preferenceService.updateValue(VesEmulatorPreferenceIds.DEFAULT_EMULATOR, newValue);
  };

  const removeEmulatorConfig = async (indexToDelete: number) => {
    const dialog = new ConfirmDialog({
      title: nls.localize('vuengine/emulator/removeEmulatorConfig', 'Remove Emulator Config'),
      msg: nls.localize('vuengine/emulator/areYouSureYouWantToRemove', 'Are you sure you want to remove this configuration?'),
    });
    const confirmed = await dialog.open();
    if (confirmed) {
      props.preferenceService.updateValue(
        VesEmulatorPreferenceIds.EMULATORS,
        emulatorConfigs.filter((config, index) => index !== indexToDelete)
      );
    }
  };

  const addEmulatorConfig = () => props.preferenceService.updateValue(
    VesEmulatorPreferenceIds.EMULATORS,
    [
      ...(emulatorConfigs || []),
      {
        name: nls.localize('vuengine/emulator/new', 'New'),
        path: '',
        args: '%ROM%'
      }
    ]
  );

  const setEmulatorConfig = (index: number, emulatorConfig: Partial<EmulatorConfig>, persist = true) => {
    const updatedEmulatorConfigs = [...emulatorConfigs];
    updatedEmulatorConfigs[index] = {
      ...updatedEmulatorConfigs[index],
      ...emulatorConfig
    };
    if (persist) {
      props.preferenceService.updateValue(VesEmulatorPreferenceIds.EMULATORS, updatedEmulatorConfigs);
    } else {
      setEmulatorConfigs(updatedEmulatorConfigs);
    }
  };

  const setEmulatorName = (index: number, name: string, persist = true) => {
    if (defaultEmulator === emulatorConfigs[index].name) {
      if (persist) {
        updateDefaultEmulator(name);
      } else {
        setDefaultEmulator(name);
      }
    }
    setEmulatorConfig(index, { name }, persist);
  };

  const setEmulatorPath = (index: number, path: string, persist = true) => {
    setEmulatorConfig(index, { path }, persist);
  };

  const setEmulatorArgs = (index: number, args: string, persist = true) => {
    setEmulatorConfig(index, { args }, persist);
  };

  const selectEmulatorPath = async (index: number): Promise<void> => {
    const openFileDialogProps: OpenFileDialogProps = {
      title: nls.localize('vuengine/emulator/selectEmulatorExecutable', 'Select emulator executable'),
      canSelectFolders: false,
      canSelectFiles: true
    };
    const currentPath = await props.fileService.exists(new URI(emulatorConfigs[index].path).withScheme('file'))
      ? await props.fileService.resolve(new URI(emulatorConfigs[index].path).withScheme('file'))
      : undefined;
    const emulatorUri = await props.fileDialogService.showOpenDialog(openFileDialogProps, currentPath);
    if (emulatorUri) {
      const emulator = await props.fileService.resolve(emulatorUri);
      if (emulator.isFile) {
        setEmulatorPath(index, emulator.resource.path.fsPath());
      }
    }
  };

  return <div className='emulatorConfigs'>
    <div className='emulatorConfig'>
      <label>
        {nls.localize('vuengine/emulator/name', 'Name')}
        <input type="text" className="theia-input" readOnly value={nls.localize('vuengine/emulator/builtIn', 'Built-In')} />
      </label>
      <label>
        {nls.localize('vuengine/emulator/default', 'Default')}
        <input
          type="checkbox"
          className="theia-input"
          onChange={() => updateDefaultEmulator('')}
          checked={!defaultEmulator}
        />
      </label>
    </div>
    {emulatorConfigs && emulatorConfigs.map((config, index) => <div className='emulatorConfig' key={`emulatorConfig-${index}`}>
      <div>
        <label>
          {nls.localize('vuengine/emulator/name', 'Name')}
          <input
            type="text"
            className="theia-input"
            value={config.name}
            onBlur={e => setEmulatorName(index, e.target.value)}
            onChange={e => setEmulatorName(index, e.target.value, false)}
          />
        </label>
        <div>
          <button
            className='theia-button secondary'
            onClick={() => removeEmulatorConfig(index)}
            title={nls.localize('vuengine/emulator/removeEmulatorConfig', 'Remove Emulator Config')}
          >
            <i className='fa fa-trash' />
          </button>
        </div>
      </div>
      <div>
        <label>
          {nls.localize('vuengine/emulator/path', 'Path')}
          <input
            type="text"
            className="theia-input"
            value={config.path}
            onBlur={e => setEmulatorPath(index, e.target.value)}
            onChange={e => setEmulatorPath(index, e.target.value, false)}
          />
        </label>
        <div>
          <button
            className="theia-button secondary"
            onClick={() => selectEmulatorPath(index)}
          >
            <i className="fa fa-ellipsis-h" />
          </button>
        </div>
      </div>
      <div>
        <label>
          {nls.localize('vuengine/emulator/arguments', 'Arguments')}
          <ReactTextareaAutosize
            className="theia-input"
            value={config.args}
            maxRows={4}
            onBlur={e => setEmulatorArgs(index, e.target.value)}
            onChange={e => setEmulatorArgs(index, e.target.value, false)}
          />
        </label>
      </div>
      <div>
        <label>
          {nls.localize('vuengine/emulator/default', 'Default')}
          <input
            type="checkbox"
            className="theia-input"
            onChange={() => updateDefaultEmulator(config.name)}
            checked={defaultEmulator === config.name}
          />
        </label>
      </div>
    </div>)
    }
    <div className='emulatorConfigsActions'>
      <button
        className='theia-button secondary full-width'
        onClick={addEmulatorConfig}
      >
        <i className='fa fa-plus' />
      </button>
    </div>
  </div >;
}

@injectable()
export class VesEmulatorSidebarWidget extends ReactWidget {
  @inject(CommandService)
  private readonly commandService: CommandService;
  @inject(FileService)
  private readonly fileService: FileService;
  @inject(FileDialogService)
  private readonly fileDialogService: FileDialogService;
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

    return <>
      <div className='runActions'>
        <button className='theia-button large full-width' onClick={this.run}>Run</button>

        <AutoQueuePreference
          preferenceService={this.preferenceService}
        />
      </div>
      <EmulatorConfigs
        fileService={this.fileService}
        fileDialogService={this.fileDialogService}
        preferenceService={this.preferenceService}
      />
    </>;
  }

  protected run = () => this.commandService.executeCommand(VesEmulatorCommands.RUN.id);
}
