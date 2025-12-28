import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { WithContributor, WithFileUri } from '../../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { SoundComponentData } from '../../ActorEditor/ActorEditorTypes';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';

interface SoundComponentProps {
    soundComponent: SoundComponentData
    // updateSoundComponent: (partialSoundComponent: Partial<SoundComponentData>) => void
}

export default function SoundComponent(props: SoundComponentProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { soundComponent } = props;

    const item = services.vesProjectService.getProjectDataItemById(soundComponent.itemId, 'Sound') as SoundComponentData & WithFileUri & WithContributor;

    const openEditor = async (): Promise<void> => {
        if (item && item._fileUri) {
            const opener = await services.openerService.getOpener(item._fileUri);
            await opener.open(item._fileUri);
        }
    };

    return (
        <VContainer gap={15}>
            {item
                ? <HContainer alignItems='end' grow={1}>
                    <Input
                        label={nls.localize('vuengine/editors/actor/sound', 'Sound')}
                        title={item._contributorUri.parent.path.relative(item._fileUri.path)?.fsPath()}
                        value={item._fileUri.path.name}
                        grow={1}
                        disabled
                    />
                    <button
                        className='theia-button secondary'
                        onClick={openEditor}
                        title={nls.localize('vuengine/editors/actor/editSound', 'Edit Sound')}
                    >
                        <i className='codicon codicon-edit' />
                    </button>
                </HContainer>
                : <VContainer className='error'>
                    {nls.localize('vuengine/editors/general/soundNotFound', 'Sound could not be found')}
                </VContainer>
            }
        </VContainer >
    );
}
