import { URI, nls } from '@theia/core';
import { SelectComponent, SelectOption } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext } from 'react';
import { ProjectContributor } from '../../../../../project/browser/ves-project-types';
import { EditorsServices } from '../../../ves-editors-widget';
import VContainer from '../../Common/VContainer';
import { EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import HContainer from '../../Common/HContainer';

interface CollisionsProps {
    services: EditorsServices
}

export default function Collisions(props: CollisionsProps): React.JSX.Element {
    const { services } = props;
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const setInGameType = (inGameType: string): void => {
        const updatedCollisions = { ...data.collisions };
        updatedCollisions.inGameType = inGameType;

        setData({
            collisions: updatedCollisions
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
        // filter out doubles
        combinedInGameTypes = combinedInGameTypes.filter((value, index, self) => self.indexOf(value) === index);

        combinedInGameTypes.sort().map(c => {
            options.push({
                value: c,
            });
        });
    }

    const openEditor = async (): Promise<void> => {
        if (inGameTypesFileUri) {
            const opener = await services.openerService.getOpener(inGameTypesFileUri);
            await opener.open(inGameTypesFileUri);
        }
    };

    return <VContainer gap={20}>
        <HContainer alignItems='end' gap={20}>
            <VContainer grow={1}>
                <label>
                    {nls.localize('vuengine/entityEditor/inGameType', 'In-Game Type')}
                </label>
                <SelectComponent
                    options={options}
                    defaultValue={data.collisions.inGameType}
                    onChange={inGameType => setInGameType(inGameType.value || 'None')}
                />
            </VContainer>
            {inGameTypesFileUri && <button
                className='theia-button secondary'
                onClick={openEditor}
                title={nls.localize('vuengine/entityEditor/addCollision', 'Add Collision')}
            >
                <i className='fa fa-cog' />
            </button>}
        </HContainer>
        {data.collisions.inGameType !== 'None' && <VContainer>
            <label>
                {nls.localize('vuengine/entityEditor/colliders', 'Colliders')}
            </label>
            [To be implemented]
        </VContainer>}
    </VContainer>;
}
