import { nls, URI } from '@theia/core';
import React, { useContext, useEffect, useState } from 'react';
import BasicSelect from '../../../editors/browser/components/Common/Base/BasicSelect';
import HContainer from '../../../editors/browser/components/Common/Base/HContainer';
import Input from '../../../editors/browser/components/Common/Base/Input';
import VContainer from '../../../editors/browser/components/Common/Base/VContainer';
import { EditorsContext, EditorsContextType, TYPE_LABELS } from '../../../editors/browser/ves-editors-types';
import { GameConfig, ProjectContributor, ProjectDataItem, ProjectDataType, WithContributor, WithFileUri } from '../ves-project-types';
import { MOCK_STAGES } from './ProjectDashboard';

interface ConfigType {
    typeId: string,
    type: ProjectDataType & WithContributor
    item: ProjectDataItem & WithFileUri
    label: string,
}

interface ProjectSettingsProps {
    gameConfig: GameConfig
    setGameConfig: (gameConfig: Partial<GameConfig>) => void
}

export default function ProjectSettings(props: ProjectSettingsProps): React.JSX.Element {
    const { gameConfig, setGameConfig } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const [types, setTypes] = useState<ConfigType[]>([]);

    const startStage = MOCK_STAGES['1234'];

    const openSettings = async (type: ProjectDataType & WithContributor, item?: ProjectDataItem & WithFileUri): Promise<void> => {
        if (item && item._fileUri) {
            openEditor(item._fileUri);
        } else {
            const workspaceRootUri = services.workspaceService.tryGetRoots()[0]?.resource;
            const newFileUri = workspaceRootUri.resolve('config').resolve(type.file);

            const data = await services.vesProjectService.getSchemaDefaults(type);
            await services.fileService.create(newFileUri, JSON.stringify(data, undefined, 4));

            openEditor(newFileUri);
        }
    };

    const openStageEditor = async (stageId: string): Promise<void> => {
        const item = services.vesProjectService.getProjectDataItemById(stageId, 'Stage') as ProjectDataItem & WithFileUri;
        if (item && item._fileUri) {
            openEditor(item._fileUri);
        }
    };

    const openEditor = async (fileUri: URI): Promise<void> => {
        const opener = await services.openerService.getOpener(fileUri);
        await opener.open(fileUri, {
            widgetOptions: {
                mode: 'split-right',
            }
        });
    };

    const getTypes = async (): Promise<void> => {
        await services.vesProjectService.projectDataReady;
        const registeredTypes = services.vesProjectService.getProjectDataTypes() ?? {};
        const availableConfigs: ConfigType[] = [];
        Object.keys(registeredTypes).forEach(typeId => {
            const type = registeredTypes[typeId];
            if (type.file.startsWith('.') || type.excludeFromDashboard || type.enabled === false) {
                return;
            }
            const item = services.vesProjectService.getProjectDataItemById(ProjectContributor.Project, typeId) as ProjectDataItem & WithFileUri;
            availableConfigs.push({
                typeId, type, item,
                label: TYPE_LABELS[typeId] ?? type.file,
            });
        });

        setTypes(availableConfigs.sort((a, b) => a.label.localeCompare(b.label)));
    };

    useEffect(() => {
        getTypes();
    }, []);

    return (
        <VContainer gap={15}>
            <Input
                label={nls.localizeByDefault('Name')}
                value={gameConfig.projectTitle ?? ''}
                setValue={v => setGameConfig({
                    projectTitle: v as string
                })}
            />
            <Input
                label={nls.localize('vuengine/project/author', 'Author')}
                value={gameConfig.projectAuthor ?? ''}
                setValue={v => setGameConfig({
                    projectAuthor: v as string
                })}
            />
            {MOCK_STAGES && Object.keys(MOCK_STAGES).length > 0 && <>
                <hr />
                <VContainer>
                    <label>
                        {nls.localize('vuengine/project/startScreen', 'Start Screen')}
                    </label>
                    <HContainer alignItems='end' grow={1}>
                        <BasicSelect
                            options={Object.values(MOCK_STAGES).map(v => ({
                                value: v._id,
                                label: v.name,
                            }))}
                            value={startStage._id}
                            onChange={() => { }}
                            style={{
                                flexGrow: 1
                            }}
                        />
                        <button
                            className='theia-button secondary'
                            onClick={() => openStageEditor(startStage._id)}
                            title={nls.localizeByDefault('Edit')}
                            style={{
                                margin: 0,
                                minWidth: 'unset',
                            }}
                        >
                            <i className='codicon codicon-edit' />
                        </button>
                    </HContainer>
                </VContainer>
            </>}
            {types.length > 0 && <>
                <hr />
                <VContainer>
                    <label>
                        {nls.localizeByDefault('Settings')}
                    </label>
                    <div className='ves-tree' style={{ margin: '0 calc(-1 * var(--padding))' }}>
                        {types.map(t => (
                            <div
                                key={t.typeId}
                                role="treeitem"
                                onClick={() => openSettings(t.type, t.item)}
                                tabIndex={-1}
                            >
                                <div className="ves-tree-node">
                                    <div className="ves-tree-node-icon">
                                        <i className={t.type.icon as string}></i>
                                    </div>
                                    <div className="ves-tree-node-name">
                                        {t.label}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </VContainer>
            </>}
        </VContainer>
    );
}
