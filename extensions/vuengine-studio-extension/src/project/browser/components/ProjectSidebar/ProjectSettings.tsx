import { nls, URI } from '@theia/core';
import { OpenerService } from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import React, { useEffect, useState } from 'react';
import { VesWorkspaceService } from '../../../../core/browser/ves-workspace-service';
import AdvancedSelect from '../../../../editors/browser/components/Common/Base/AdvancedSelect';
import HContainer from '../../../../editors/browser/components/Common/Base/HContainer';
import Input from '../../../../editors/browser/components/Common/Base/Input';
import VContainer from '../../../../editors/browser/components/Common/Base/VContainer';
import { stringify } from '../../../../editors/browser/components/Common/Utils';
import { PROJECT_TYPES } from '../../ves-project-data';
import { VesProjectService } from '../../ves-project-service';
import { GameConfig, ProjectContributor, ProjectDataItem, ProjectDataType, WithFileUri } from '../../ves-project-types';
import { MOCK_STAGES } from '../StagesDashboard/ProjectDashboard';

interface ConfigType {
    typeId: string,
    type: ProjectDataType
    item: ProjectDataItem & WithFileUri
    label: string,
}

interface ProjectSettingsProps {
    fileService: FileService
    openerService: OpenerService
    vesProjectService: VesProjectService
    workspaceService: VesWorkspaceService
}

export default function ProjectSettings(props: ProjectSettingsProps): React.JSX.Element {
    const { fileService, openerService, vesProjectService, workspaceService } = props;
    const [gameConfig, setGameConfig] = useState<GameConfig>();
    const [types, setTypes] = useState<ConfigType[]>([]);

    const startStage = MOCK_STAGES['1234'];

    const updateGameConfig = async (partialGameConfig: Partial<GameConfig>) => {
        vesProjectService.setGameConfig(partialGameConfig);
        setGameConfig(prev => ({
            ...prev as GameConfig,
            ...partialGameConfig,
        }));
    };

    const openSettings = async (type: ProjectDataType, item?: ProjectDataItem & WithFileUri): Promise<void> => {
        if (item && item._fileUri) {
            openEditor(item._fileUri);
        } else {
            const workspaceRootUri = workspaceService.tryGetRoots()[0]?.resource;
            const newFileUri = workspaceRootUri.resolve('config').resolve(type.file);

            if (!(await fileService.exists(newFileUri))) {
                const data = await vesProjectService.getSchemaDefaults(type);
                await fileService.create(newFileUri, stringify(data));
            }

            openEditor(newFileUri);
        }
    };

    const openStageEditor = async (stageId: string): Promise<void> => {
        const item = vesProjectService.getProjectDataItemById(stageId, 'Stage') as ProjectDataItem & WithFileUri;
        if (item && item._fileUri) {
            openEditor(item._fileUri);
        }
    };

    const openEditor = async (fileUri: URI): Promise<void> => {
        const opener = await openerService.getOpener(fileUri);
        await opener.open(fileUri);
    };

    const getGameConfig = async () => {
        await vesProjectService.projectDataReady;
        const gc = await vesProjectService.getGameConfig();
        setGameConfig({
            ...gc,
            _fileUri: undefined,
            _contributor: undefined,
            _contributorUri: undefined,
        } as GameConfig);
    };

    const getTypes = async (): Promise<void> => {
        await vesProjectService.projectDataReady;
        const availableConfigs: ConfigType[] = [];
        Object.keys(PROJECT_TYPES).forEach(typeId => {
            const type = PROJECT_TYPES[typeId];
            if (type.file.startsWith('.') || type.excludeFromDashboard || type.enabled === false) {
                return;
            }
            const item = vesProjectService.getProjectDataItemById(ProjectContributor.Project, typeId) as ProjectDataItem & WithFileUri;
            availableConfigs.push({
                typeId, type, item,
                label: type.schema.title,
            });
        });

        setTypes(availableConfigs.sort((a, b) => a.label.localeCompare(b.label)));
    };

    useEffect(() => {
        getTypes();
        getGameConfig();
    }, []);

    return (
        <div className='jsonforms-container'>
            <VContainer gap={15}>
                <Input
                    label={nls.localizeByDefault('Name')}
                    value={gameConfig?.projectTitle ?? ''}
                    setValue={v => updateGameConfig({
                        projectTitle: v as string
                    })}
                />
                <Input
                    label={nls.localize('vuengine/project/author', 'Author')}
                    value={gameConfig?.projectAuthor ?? ''}
                    setValue={v => updateGameConfig({
                        projectAuthor: v as string
                    })}
                />
                {MOCK_STAGES && Object.keys(MOCK_STAGES).length > 0 && <>
                    <hr />
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/project/startStage', 'Start Stage')}
                        </label>
                        <HContainer alignItems='end' grow={1}>
                            <AdvancedSelect
                                options={Object.values(MOCK_STAGES).map(v => ({
                                    value: v._id,
                                    label: v.name,
                                }))}
                                defaultValue={startStage._id}
                                onChange={() => { }}
                                containerStyle={{
                                    flexGrow: 1,
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
                <hr />

                {types.length > 0 && <>
                    <VContainer grow={1}>
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
        </div>
    );
}
