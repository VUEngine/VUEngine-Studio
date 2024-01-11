import { URI, nls } from '@theia/core';
import { SelectComponent, SelectOption } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext } from 'react';
import { ProjectContributor } from '../../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import HContainer from '../../Common/HContainer';

export default function CollidersSettings(): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
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

    return <>
        {data.colliders.colliders.length > 0 &&
            <HContainer alignItems='end'>
                <VContainer>
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
                    <i className='codicon codicon-settings-gear' />
                </button>
            </HContainer>
        }
    </>;
}
