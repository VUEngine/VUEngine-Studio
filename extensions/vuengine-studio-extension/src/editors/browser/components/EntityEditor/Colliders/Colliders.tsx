import { URI, nls } from '@theia/core';
import { SelectComponent, SelectOption } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext } from 'react';
import { ProjectContributor } from '../../../../../project/browser/ves-project-types';
import { EditorsServices } from '../../../ves-editors-widget';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { ColliderType, EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import Collider from './Collider';

interface CollidersProps {
    services: EditorsServices
}

export default function Colliders(props: CollidersProps): React.JSX.Element {
    const { services } = props;
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const setInGameType = (inGameType: string): void => {
        setData({
            colliders: {
                ...data.colliders,
                inGameType
            }
        });
    };

    const options: SelectOption[] = [{
        value: 'None',
        label: nls.localize('vuengine/entityEditor/inGameTypeNone', 'None'),
    }];
    let inGameTypesFileUri: URI | undefined;
    const inGameTypes = services.vesProjectService.getProjectDataItemsForType('InGameTypes');
    let combinedInGameTypes: string[] = [];
    if (inGameTypes) {
        inGameTypesFileUri = inGameTypes[ProjectContributor.Project]?._fileUri;

        Object.values(ProjectContributor).map(c => {
            // @ts-ignore
            combinedInGameTypes = combinedInGameTypes.concat(inGameTypes[c]?.types || []);
        });
        combinedInGameTypes = combinedInGameTypes.filter((value, index, self) => self.indexOf(value) === index);

        combinedInGameTypes.sort().map(c => {
            options.push({
                value: c,
            });
        });
    }

    const openEditor = async (): Promise<void> => {
        if (!inGameTypesFileUri) {
            const workspaceRootUri = services.workspaceService.tryGetRoots()[0]?.resource;
            inGameTypesFileUri = workspaceRootUri.resolve('config').resolve('InGameTypes');
            await services.fileService.createFile(inGameTypesFileUri);
        }

        const opener = await services.openerService.getOpener(inGameTypesFileUri);
        await opener.open(inGameTypesFileUri);
    };

    const addCollider = (): void => {
        const colliders = { ...data.colliders };
        colliders.colliders = [
            ...colliders.colliders,
            {
                type: ColliderType.Ball,
                pixelSize: {
                    x: 0,
                    y: 0,
                    z: 0,
                },
                displacement: {
                    x: 0,
                    y: 0,
                    z: 0,
                    parallax: 0,
                },
                rotation: {
                    x: 0,
                    y: 0,
                    z: 0,
                },
                scale: {
                    x: 0,
                    y: 0,
                    z: 0,
                },
                checkForCollisions: false,
                layers: [],
                layersToCheck: [],
            },
        ];

        setData({ colliders });
    };

    return <VContainer gap={20}>
        <HContainer alignItems='end' gap={20}>
            <VContainer grow={1}>
                <label>
                    {nls.localize('vuengine/entityEditor/inGameType', 'In-Game Type')}
                </label>
                <SelectComponent
                    options={options}
                    defaultValue={data.colliders.inGameType}
                    onChange={inGameType => setInGameType(inGameType.value || 'None')}
                />
            </VContainer>
            <button
                className='theia-button secondary'
                onClick={openEditor}
                title={nls.localize('vuengine/entityEditor/manageInGameTypes', 'Manage In-Game Types')}
            >
                <i className='fa fa-cog' />
            </button>
        </HContainer>
        {data.colliders.inGameType !== 'None' && <VContainer gap={10}>
            <label>
                {nls.localize('vuengine/entityEditor/colliders', 'Colliders')} ({data.colliders.colliders.length})
            </label>
            {data.colliders.colliders.length > 0 && data.colliders.colliders.map((collider, index) =>
                <Collider
                    key={`collider-${index}`}
                    index={index}
                    collider={collider}
                />
            )}
            <button
                className='theia-button secondary full-width'
                onClick={addCollider}
                title={nls.localize('vuengine/entityEditor/addCollider', 'Add Collider')}
            >
                <i className='fa fa-plus' />
            </button>
        </VContainer>}
    </VContainer>;
}