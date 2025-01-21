import { nls } from '@theia/core';
import React, { useEffect, useState } from 'react';
import PluginDefaultInput from '../../../../plugins/browser/components/PluginDefaultInput';
import { PluginConfiguration, PluginConfigurationDataType } from '../../../../plugins/browser/ves-plugins-types';
import { ProjectDataTypesWithContributor } from '../../../../project/browser/ves-project-types';
import { EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import VContainer from '../Common/Base/VContainer';
import { PluginConfigurationData, PluginFileTranslatedField } from './PluginFileEditorTypes';
import TranslatedValue from './TranslatedValue';

interface PluginConfigurationProps {
    data: PluginConfigurationData
    updateData: (pluginConfiguration: PluginConfigurationData) => void
    context: EditorsContextType
}

export default function PluginConfiguration(props: PluginConfigurationProps): React.JSX.Element {
    const { data, updateData, context } = props;
    const [types, setTypes] = useState<ProjectDataTypesWithContributor>({});

    const initTypes = async (): Promise<void> => {
        await context.services.vesProjectService.projectDataReady;
        const t = context.services.vesProjectService.getProjectDataTypes();
        if (t && Object.keys(t).length > 0) {
            const typesWithItems: ProjectDataTypesWithContributor = {};
            Object.keys(t).map(typeId => {
                const i = context.services.vesProjectService.getProjectDataItemsForType(typeId);
                if (i && Object.keys(i).length > 0 && t[typeId].file.startsWith('.')) {
                    typesWithItems[typeId] = t[typeId];
                }
            });

            const sortedTypesWithItems: ProjectDataTypesWithContributor = {};
            Object.keys(typesWithItems).sort((a, b) => a.localeCompare(b)).forEach(key => {
                sortedTypesWithItems[key] = typesWithItems[key];
            });

            setTypes(sortedTypesWithItems);
        }
    };

    const setData = (partialData: Partial<PluginConfigurationData>): void => {
        updateData({
            ...data,
            ...partialData,
        });
    };

    const setName = (name: string): void => {
        setData({ name: name.replace(/\s/g, '') });
    };
    const setLabel = (label: PluginFileTranslatedField): void => {
        setData({ label });
    };
    const setDescription = (description: PluginFileTranslatedField): void => {
        setData({ description });
    };
    const setDataType = (dataType: PluginConfigurationDataType): void => {
        setData({ dataType });
    };
    const setType = (type: string): void => {
        setData({ type });
    };
    const setMin = (min: number): void => {
        setData({ min });
    };
    const setMax = (max: number): void => {
        setData({ max });
    };
    const setStep = (step: number): void => {
        setData({ step });
    };
    const setDefault = (d: string | number | boolean | null | undefined): void => {
        setData({ default: d });
    };

    useEffect(() => {
        initTypes();
    }, []);

    return <VContainer gap={15} className='pluginFileEditor'>
        <VContainer>
            <label>
                {nls.localize('vuengine/pluginFileEditor/configuration/name', 'Name')}
            </label>
            <input
                className='theia-input'
                value={data.name}
                onChange={e => setName(e.target.value)}
            />
        </VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/pluginFileEditor/configuration/label', 'Label')}
            </label>
            <TranslatedValue
                data={data.label}
                setData={setLabel}
            />
        </VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/pluginFileEditor/configuration/description', 'Description')}
            </label>
            <TranslatedValue
                data={data.description}
                setData={setDescription}
            />
        </VContainer>
        <HContainer>
            <VContainer style={{ flexGrow: 1 }}>
                <label>
                    {nls.localize('vuengine/pluginFileEditor/configuration/dataType', 'Data Type')}
                </label>
                <select
                    value={data.dataType}
                    className='theia-select'
                    onChange={e => setDataType(e.target.value as PluginConfigurationDataType)}
                >
                    {Object.values(PluginConfigurationDataType).map(d =>
                        <option
                            key={d}
                            value={d}
                        >
                            {d.charAt(0).toUpperCase() + d.slice(1)}
                        </option>
                    )}
                </select>
            </VContainer>
            {data.dataType === PluginConfigurationDataType.type &&
                <VContainer>
                    <label>
                        {nls.localize('vuengine/pluginFileEditor/configuration/type', 'Type')}
                    </label>
                    <select
                        value={data.type}
                        className='theia-select'
                        onChange={e => setType(e.target.value)}
                    >
                        {Object.keys(types).map(typeId =>
                            <option
                                key={typeId}
                                value={typeId}
                            >
                                {types[typeId].schema.title}
                            </option>
                        )}
                    </select>
                </VContainer>
            }
            {data.dataType === PluginConfigurationDataType.integer && <>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/pluginFileEditor/configuration/min', 'Min')}
                    </label>
                    <input
                        type='number'
                        className='theia-input'
                        style={{ width: 48 }}
                        value={data.min}
                        onChange={e => setMin(e.target.value === '' ? 0 : parseInt(e.target.value))}
                    />
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/pluginFileEditor/configuration/max', 'Max')}
                    </label>
                    <input
                        type='number'
                        className='theia-input'
                        style={{ width: 48 }}
                        value={data.max}
                        onChange={e => setMax(e.target.value === '' ? 0 : parseInt(e.target.value))}
                    />
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/pluginFileEditor/configuration/step', 'Step')}
                    </label>
                    <input
                        type='number'
                        className='theia-input'
                        style={{ width: 48 }}
                        value={data.step}
                        onChange={e => setStep(e.target.value === '' ? 0 : parseInt(e.target.value))}
                    />
                </VContainer>
            </>}
        </HContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/pluginFileEditor/configuration/default', 'Default')}
            </label>
            <PluginDefaultInput
                config={data as unknown as PluginConfiguration}
                value={data.default}
                setValue={(value: any, persist?: boolean) => setDefault(value)}
                disabled={false}
                vesCommonService={context.services.vesCommonService!}
                vesProjectService={context.services.vesProjectService!}
            />
        </VContainer>
    </VContainer>;
}
