import { CommandService, PreferenceService, URI, isWindows, nls } from '@theia/core';
import { CommonCommands, ConfirmDialog } from '@theia/core/lib/browser';
import { FileDialogService, OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import React from 'react';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { WINDOWS_EXECUTABLE_EXTENSIONS } from '../../../core/browser/ves-common-types';
import { VesCoreCommands } from '../../../core/browser/ves-core-commands';
import { VesEmulatorPreferenceIds } from '../ves-emulator-preferences';
import { EmulatorConfig } from '../ves-emulator-types';

interface EmulatorConfigsProps {
    commandService: CommandService
    fileDialogService: FileDialogService
    fileService: FileService
    preferenceService: PreferenceService
}

export default function EmulatorConfigs(props: EmulatorConfigsProps): React.JSX.Element {
    const [configsExpanded, setConfigsExpanded] = React.useState<boolean>(false);
    const [defaultEmulator, setDefaultEmulator] = React.useState<string>(props.preferenceService.get(VesEmulatorPreferenceIds.DEFAULT_EMULATOR, ''));
    const [emulatorConfigs, setEmulatorConfigs] = React.useState<EmulatorConfig[]>(props.preferenceService.get(VesEmulatorPreferenceIds.EMULATORS, []));
    const [rv3dsIpAddress, setRv3dsIpAddress] = React.useState<string>(props.preferenceService.get(VesEmulatorPreferenceIds.EMULATOR_RED_VIPER_3DS_IP_ADDRESS, ''));

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
                name: nls.localizeByDefault('New'),
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
            canSelectFiles: true,
            filters: {
                'Executables': isWindows
                    ? WINDOWS_EXECUTABLE_EXTENSIONS
                    : ['.']
            }
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

    const openBuiltInEmulatorSettings = () => {
        props.commandService.executeCommand(CommonCommands.OPEN_PREFERENCES.id, 'Emulator Built In');
    };

    const openRedViperDocumentation = () => {
        props.commandService.executeCommand(VesCoreCommands.OPEN_DOCUMENTATION.id, 'basics/emulator/#red-viper', false);
    };

    const update3dsIpAddress = (newValue: string) => {
        props.preferenceService.updateValue(VesEmulatorPreferenceIds.EMULATOR_RED_VIPER_3DS_IP_ADDRESS, newValue);
        setRv3dsIpAddress(newValue);
    };

    React.useEffect(() => {
        const preflistener = props.preferenceService.onPreferenceChanged(change => {
            if (change.preferenceName === VesEmulatorPreferenceIds.DEFAULT_EMULATOR) {
                setDefaultEmulator(change.newValue as string);
            } else if (change.preferenceName === VesEmulatorPreferenceIds.EMULATORS) {
                setEmulatorConfigs(change.newValue as unknown as EmulatorConfig[] || []);
            }
        });
        return () => preflistener.dispose();
    }, [props.preferenceService]);

    return <div className='emulatorConfigsWrapper'>
        <div className='emulatorConfigsOverview' onClick={() => setConfigsExpanded(!configsExpanded)}>
            <i className={`fa fa-chevron-${configsExpanded ? 'down' : 'left'}`} />
            <div>
                {nls.localize('vuengine/emulator/defaultEmulator', 'Default Emulator')}: {!defaultEmulator
                    ? nls.localize('vuengine/emulator/builtIn', 'Built-In')
                    : defaultEmulator}
            </div>
            <div>
                {nls.localize('vuengine/emulator/customConfigurations', 'Custom Configurations')}: {emulatorConfigs.length}
            </div>
        </div>
        {configsExpanded && <div className='emulatorConfigs'>
            <div className='emulatorConfig'>
                <div>
                    <label>
                        {nls.localizeByDefault('Name')}
                        <input type="text" className="theia-input" readOnly disabled value={nls.localize('vuengine/emulator/builtIn', 'Built-In')} />
                    </label>
                    <div>
                        <button
                            className='theia-button secondary'
                            onClick={openBuiltInEmulatorSettings}
                            title={nls.localize('vuengine/emulator/settings', 'Settings')}
                        >
                            <i className='codicon codicon-settings' />
                        </button>
                    </div>
                </div>
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
            <div className='emulatorConfig'>
                <div>
                    <label>
                        {nls.localizeByDefault('Name')}
                        <input type="text" className="theia-input" readOnly disabled value="Red Viper" />
                    </label>
                    <div>
                        <button
                            className='theia-button secondary'
                            onClick={openRedViperDocumentation}
                            title={nls.localize('vuengine/emulator/documentation', 'Documentation')}
                        >
                            <i className='codicon codicon-book' />
                        </button>
                    </div>
                </div>
                <div>
                    <label>
                        {nls.localize('vuengine/emulator/3dsIpAddress', '3DS IP Address')}
                        <input
                            type="text"
                            className="theia-input"
                            value={rv3dsIpAddress}
                            onChange={e => update3dsIpAddress(e.target.value)}
                        />
                    </label>
                </div>
                <label>
                    {nls.localize('vuengine/emulator/default', 'Default')}
                    <input
                        type="checkbox"
                        className="theia-input"
                        onChange={() => updateDefaultEmulator('Red Viper')}
                        checked={defaultEmulator === 'Red Viper'}
                    />
                </label>
            </div>
            {emulatorConfigs && emulatorConfigs.map((config, index) => <div className='emulatorConfig' key={`emulatorConfig-${index}`}>
                <div>
                    <label>
                        {nls.localizeByDefault('Name')}
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
                            title={nls.localizeByDefault('Remove')}
                        >
                            <i className='codicon codicon-x' />
                        </button>
                    </div>
                </div>
                <div>
                    <label>
                        {nls.localizeByDefault('Path')}
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
                    <i className='codicon codicon-plus' />
                </button>
            </div>
        </div>}
    </div>;
}
