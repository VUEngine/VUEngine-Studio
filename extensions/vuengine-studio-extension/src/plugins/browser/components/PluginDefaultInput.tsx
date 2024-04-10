import React, { useEffect, useState } from 'react';
import { VesCommonService } from '../../../core/browser/ves-common-service';
import { VesProjectService } from '../../../project/browser/ves-project-service';
import { ProjectDataItemsByTypeWithContributor } from '../../../project/browser/ves-project-types';
import { PluginConfiguration, PluginConfigurationDataType } from '../ves-plugins-types';

interface PluginDefaultInputProps {
    value: any
    setValue: (value: any, persist?: boolean) => void
    config: PluginConfiguration
    disabled: boolean
    vesCommonService: VesCommonService
    vesProjectService: VesProjectService
}

export default function PluginDefaultInput(props: PluginDefaultInputProps): React.JSX.Element {
    const { value, setValue, config, disabled, vesCommonService, vesProjectService } = props;
    const [items, setItems] = useState<ProjectDataItemsByTypeWithContributor>({});

    const initItems = async (): Promise<void> => {
        await vesProjectService.projectItemsReady;
        const t = vesProjectService.getProjectDataItems();
        if (t !== undefined) {
            setItems(t);
        }
    };

    useEffect(() => {
        initItems();
    }, []);

    return <>
        {config.dataType === PluginConfigurationDataType.boolean &&
            <input
                type="checkbox"
                style={{ flexGrow: 1 }}
                checked={value}
                readOnly={disabled}
                disabled={disabled}
                onChange={e => setValue(e.target.checked, true)}
            />
        }
        {config.dataType === PluginConfigurationDataType.integer &&
            <input
                className='theia-input'
                type='number'
                style={{ flexGrow: 1 }}
                value={value}
                min={config.min}
                max={config.max}
                step={config.step}
                readOnly={disabled}
                disabled={disabled}
                onBlur={e => setValue(e.target.value, true)}
                onChange={e => setValue(e.target.value)}
            />
        }
        {(config.dataType === PluginConfigurationDataType.string
            || config.dataType === PluginConfigurationDataType.constant
            || config.dataType === PluginConfigurationDataType.hex) &&
            <input
                className='theia-input'
                type='string'
                style={{ flexGrow: 1 }}
                value={value}
                readOnly={disabled}
                disabled={disabled}
                onBlur={e => setValue(e.target.value, true)}
                onChange={e => setValue(e.target.value)}
            />
        }
        {config.dataType === 'type' && <>
            {(!disabled && Object.values(items).length > 0)
                ? <select
                    value={value}
                    className='theia-select'
                    style={{ width: '100%' }}
                    onChange={e => setValue(e.target.value, true)}
                >
                    {config.type && Object.values(items[config.type] ?? {})
                        .sort((a, b) => a._fileUri.path.name?.localeCompare(b._fileUri.path.name))
                        .map((f, i) =>
                            <option
                                key={i}
                                value={vesCommonService?.cleanSpecName(f._fileUri.path.name ?? '')}
                            >
                                {f._fileUri.path.name}
                            </option>
                        )}
                </select>
                : <input
                    className='theia-input'
                    type='string'
                    style={{ flexGrow: 1 }}
                    value={value}
                    readOnly
                    disabled
                />}
        </>}
    </>;
}
