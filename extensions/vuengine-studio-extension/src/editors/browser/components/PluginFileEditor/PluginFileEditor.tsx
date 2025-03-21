import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useEffect, useState } from 'react';
import { PluginConfigurationDataType } from '../../../../plugins/browser/ves-plugins-types';
import { EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import AdvancedSelect from '../Common/Base/AdvancedSelect';
import VContainer from '../Common/Base/VContainer';
import PluginConfiguration from './PluginConfiguration';
import { PluginConfigurationData, PluginFileData, PluginFileTranslatedField } from './PluginFileEditorTypes';
import TranslatedValue from './TranslatedValue';

interface PluginFileEditorProps {
    data: PluginFileData
    updateData: (pluginFileData: PluginFileData) => void
    context: EditorsContextType
}

export default function PluginFileEditor(props: PluginFileEditorProps): React.JSX.Element {
    const { data, updateData, context } = props;
    const [availablePlugins, setAvailablePlugins] = useState<string[]>([]);
    const [iconPath, setIconPath] = useState<string>('');
    const [previewPath, setPreviewPath] = useState<string>('');

    const setData = (partialData: Partial<PluginFileData>): void => {
        updateData({
            ...data,
            ...partialData,
        });
    };

    const initPlugins = async (): Promise<void> => {
        await context.services.vesProjectService.projectDataReady;
        const pluginsMap = context.services.vesProjectService.getProjectDataAllKnownPlugins();
        if (pluginsMap !== undefined) {
            setAvailablePlugins(Object.keys(pluginsMap));
        }
    };

    const initImagePaths = async (): Promise<void> => {
        const iconUri = context.fileUri.parent.resolve('icon.png');
        if (await context.services.fileService.exists(iconUri)) {
            setIconPath(iconUri.path.fsPath());
        }

        const previewUri = context.fileUri.parent.resolve('preview.png');
        if (await context.services.fileService.exists(previewUri)) {
            setPreviewPath(previewUri.path.fsPath());
        }
    };

    const openRepository = (): void => {
        context.services.windowService.openNewWindow(
            data.repository,
            {
                external: true,
            },
        );
    };

    const setDisplayName = (displayName: PluginFileTranslatedField): void => {
        setData({ displayName });
    };
    const setDescription = (description: PluginFileTranslatedField): void => {
        setData({ description });
    };
    const setAuthor = (author: string): void => {
        setData({ author });
    };
    const setRepository = (repository: string): void => {
        setData({ repository });
    };
    const setLicense = (license: string): void => {
        setData({ license });
    };
    const setDependencies = (dependencies: string[]): void => {
        setData({ dependencies });
    };
    const setTag = (tag: PluginFileTranslatedField, index: number): void => {
        const tags = [...data.tags];
        tags[index] = tag;
        setData({ tags });
    };
    const setConfiguration = (configuration: PluginConfigurationData, index: number): void => {
        const updatedConfiguration = [...data.configuration];
        updatedConfiguration[index] = configuration;
        setData({ configuration: updatedConfiguration });
    };

    const addTag = (): void => {
        const localeKey = nls.locale || 'en';
        setData({
            tags: [
                ...data.tags,
                { [localeKey]: '' },
            ]
        });
    };

    const removeTag = async (index: number): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/pluginFile/removeTag', 'Remove Tag'),
            msg: nls.localize('vuengine/editors/pluginFile/areYouSureYouWantToRemoveTag', 'Are you sure you want to remove this tag?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            const tags = [...data.tags].filter((t, i) => i !== index);
            setData({ tags });
        }
    };

    const addConfiguration = (): void => {
        const localeKey = nls.locale || 'en';
        setData({
            configuration: [
                ...data.configuration,
                {
                    name: '',
                    label: {
                        [localeKey]: '',
                    },
                    description: {
                        [localeKey]: '',
                    },
                    dataType: PluginConfigurationDataType.string,
                    default: '',
                }
            ]
        });
    };

    const removeConfiguration = async (index: number): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/pluginFile/removeConfiguration', 'Remove Configuration'),
            msg: nls.localize('vuengine/editors/pluginFile/areYouSureYouWantToRemoveConfiguration', 'Are you sure you want to remove this configuration?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            const configuration = [...data.configuration].filter((t, i) => i !== index);
            setData({ configuration });
        }
    };

    useEffect(() => {
        initPlugins();
        initImagePaths();
    }, []);

    return <VContainer gap={15} className='pluginFileEditor'>
        <HContainer gap={30}>
            <VContainer gap={15} grow={1}>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/pluginFile/displayName', 'Display Name')}
                    </label>
                    <TranslatedValue
                        data={data.displayName}
                        setData={setDisplayName}
                    />
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/pluginFile/author', 'Author')}
                    </label>
                    <input
                        className='theia-input'
                        value={data.author}
                        onChange={e => setAuthor(e.target.value)}
                    />
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localizeByDefault('Description')}
                    </label>
                    <TranslatedValue
                        data={data.description}
                        setData={setDescription}
                    />
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/pluginFile/repository', 'Repository')}
                    </label>
                    <HContainer alignItems='center'>
                        <input
                            className='theia-input'
                            style={{ flexGrow: 1 }}
                            value={data.repository}
                            onChange={e => setRepository(e.target.value)}
                        />
                        {context.services.vesCommonService.isValidUrl(data.repository)
                            ? <button
                                className='theia-button secondary'
                                onClick={openRepository}
                            >
                                <i className='codicon codicon-link-external' />
                            </button>
                            : <button
                                className='theia-button secondary'
                                title={nls.localize('vuengine/editors/pluginFile/noValidUrl', 'Not a valid URL')}
                                disabled
                            >
                                <i className='codicon codicon-warning' />
                            </button>
                        }
                    </HContainer>
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localizeByDefault('License')}
                    </label>
                    <input
                        className='theia-input'
                        value={data.license}
                        onChange={e => setLicense(e.target.value)}
                    />
                </VContainer>
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/pluginFile/icon', 'Icon')}
                </label>
                {iconPath
                    ? <img
                        src={iconPath}
                        width={128}
                    />
                    : <div className='noIcon'>
                        {nls.localize('vuengine/editors/pluginFile/noIcon', 'No Icon')}
                    </div>
                }

            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/editors/pluginFile/previewImage', 'Preview Image')}
                </label>
                {previewPath
                    ? <img
                        src={previewPath}
                        style={{ maxWidth: 384 }}
                    />
                    : <div className='noPreview'>
                        {nls.localize('vuengine/editors/pluginFile/noPreviewImage', 'No Preview Image')}
                    </div>
                }
            </VContainer>
        </HContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/editors/pluginFile/tags', 'Tags')}
            </label>
            <HContainer gap={10} wrap='wrap'>
                {data.tags?.map((t, i) =>
                    <VContainer key={i} className='item' style={{ maxWidth: 320, minWidth: 320 }}>
                        <button
                            className="remove-button"
                            onClick={() => removeTag(i)}
                            title={nls.localizeByDefault('Remove')}
                        >
                            <i className='codicon codicon-x' />
                        </button>
                        <TranslatedValue
                            data={t}
                            setData={tag => setTag(tag, i)}
                        />
                    </VContainer>
                )}
                <button
                    className='theia-button add-button'
                    onClick={addTag}
                    title={nls.localizeByDefault('Add')}
                >
                    <i className='codicon codicon-plus' />
                </button>
            </HContainer>
        </VContainer>
        <VContainer>
            <label>
                {nls.localizeByDefault('Dependencies')}
            </label>
            <AdvancedSelect
                options={availablePlugins?.map(d => ({
                    label: d,
                    value: d,
                }))}
                defaultValue={data.dependencies}
                onChange={options => setDependencies(options)}
                placeholder='No dependencies'
                multi
            />
        </VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/editors/general/configuration', 'Configuration')}
            </label>
            {data.configuration?.map((c, i) =>
                <VContainer key={i} className='item'>
                    <button
                        className="remove-button"
                        onClick={() => removeConfiguration(i)}
                        title={nls.localizeByDefault('Remove')}
                    >
                        <i className='codicon codicon-x' />
                    </button>
                    <PluginConfiguration
                        data={c}
                        updateData={(pluginConfiguration: PluginConfigurationData) => setConfiguration(pluginConfiguration, i)}
                        context={context}
                    />
                </VContainer>
            )}
            <button
                className='theia-button add-button full-width'
                onClick={addConfiguration}
                title={nls.localizeByDefault('Add')}
            >
                <i className='codicon codicon-plus' />
            </button>
        </VContainer>
    </VContainer>;
}
