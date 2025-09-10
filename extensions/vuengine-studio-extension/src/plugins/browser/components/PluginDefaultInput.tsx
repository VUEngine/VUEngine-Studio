import React, { useEffect, useState } from 'react';
import { VesCommonService } from '../../../core/browser/ves-common-service';
import Input from '../../../editors/browser/components/Common/Base/Input';
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
        await vesProjectService.projectDataReady;
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
            <Input
                type='number'
                value={value}
                setValue={setValue}
                min={config.min ?? 0}
                max={config.max ?? Number.MAX_SAFE_INTEGER}
                step={config.step}
                readOnly={disabled}
                disabled={disabled}
                grow={1}
                onBlur={e => setValue(e.target.value === '' ? 0 : parseInt(e.target.value), true)}
            />
        }
        {(config.dataType === PluginConfigurationDataType.string
            || config.dataType === PluginConfigurationDataType.constant
            || config.dataType === PluginConfigurationDataType.hex) &&
            <Input
                value={value}
                setValue={setValue}
                readOnly={disabled}
                disabled={disabled}
                grow={1}
                onBlur={e => setValue(e.target.value, true)}
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
                : <Input
                    value={value}
                    grow={1}
                    readOnly
                    disabled
                />}
        </>}
    </>;
}
