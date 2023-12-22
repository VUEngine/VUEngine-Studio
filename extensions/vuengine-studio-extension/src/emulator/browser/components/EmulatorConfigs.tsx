import { URI, isWindows, nls } from '@theia/core';
import { ConfirmDialog, PreferenceService } from '@theia/core/lib/browser';
import { FileDialogService, OpenFileDialogProps } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import React from 'react';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { WINDOWS_EXECUTABLE_EXTENSIONS } from '../../../core/browser/ves-common-types';
import { VesEmulatorPreferenceIds } from '../ves-emulator-preferences';
import { EmulatorConfig } from '../ves-emulator-types';

interface EmulatorConfigsProps {
    fileDialogService: FileDialogService
    fileService: FileService
    preferenceService: PreferenceService
}

export default function EmulatorConfigs(props: EmulatorConfigsProps): React.JSX.Element {
    const [configsExpanded, setConfigsExpanded] = React.useState<boolean>(false);
    const [defaultEmulator, setDefaultEmulator] = React.useState<string>(props.preferenceService.get(VesEmulatorPreferenceIds.DEFAULT_EMULATOR, ''));
    const [emulatorConfigs, setEmulatorConfigs] = React.useState<EmulatorConfig[]>(props.preferenceService.get(VesEmulatorPreferenceIds.EMULATORS, []));

    React.useEffect(() => {
        const preflistener = props.preferenceService.onPreferenceChanged(change => {
            if (change.preferenceName === VesEmulatorPreferenceIds.DEFAULT_EMULATOR) {
                setDefaultEmulator(change.newValue);
            } else if (change.preferenceName === VesEmulatorPreferenceIds.EMULATORS) {
                setEmulatorConfigs(change.newValue || []);
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
        </div>}
    </div>;
}
