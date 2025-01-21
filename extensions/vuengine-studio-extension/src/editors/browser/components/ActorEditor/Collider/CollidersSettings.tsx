import { URI, nls } from '@theia/core';
import { SelectComponent, SelectOption } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext } from 'react';
import { ProjectContributor } from '../../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import VContainer from '../../Common/Base/VContainer';
import { ActorEditorContext, ActorEditorContextType } from '../ActorEditorTypes';
import HContainer from '../../Common/Base/HContainer';

export default function CollidersSettings(): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data, setData } = useContext(ActorEditorContext) as ActorEditorContextType;

    const setInGameType = (inGameType: string): void => {
        setData({ inGameType });
    };

    const options: SelectOption[] = [{
        value: '',
        label: nls.localize('vuengine/actorEditor/inGameTypeNone', 'None'),
    }];
    let inGameTypesFileUri: URI | undefined;
    const inGameTypes = services.vesProjectService.getProjectDataItemsForType('InGameTypes');
    let combinedInGameTypes: Record<string, string> = {};
    if (inGameTypes) {
        inGameTypesFileUri = inGameTypes[ProjectContributor.Project]?._fileUri;

        Object.values(ProjectContributor).forEach(c => {
            combinedInGameTypes = {
                ...combinedInGameTypes,
                // @ts-ignore
                ...(inGameTypes[c]?.types ?? {}),
            };
        });
    };

    Object.entries(combinedInGameTypes)
        .sort(([, a], [, b]) => a.localeCompare(b))
        .map(([key, value]: string[]) => {
            options.push({
                label: value,
                value: key,
            });
        });

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
        <HContainer alignItems='end'>
            <VContainer grow={1}>
                <label>
                    {nls.localize('vuengine/actorEditor/actorsInGameType', "Actor's In-Game Type")}
                </label>
                <SelectComponent
                    options={options}
                    defaultValue={data.inGameType}
                    onChange={inGameType => setInGameType(inGameType.value || '')}
                />
            </VContainer>
            <button
                className='theia-button secondary'
                onClick={openEditor}
                title={nls.localize('vuengine/actorEditor/manageInGameTypes', 'Manage In-Game Types')}
            >
                <i className='codicon codicon-settings-gear' />
            </button>
        </HContainer>
    </>;
}
