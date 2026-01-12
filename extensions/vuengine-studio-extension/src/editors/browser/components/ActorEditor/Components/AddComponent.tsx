import { Atom, FilmStrip, Hexagon, Image, MusicNotes, Selection, SneakerMove, UserFocus } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction } from 'react';
import styled from 'styled-components';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import { ActorData } from '../ActorEditorTypes';

const StyledComponent = styled.div`
    align-items: center;
    background-color: var(--theia-secondaryButton-background);
    border-radius: 2px;
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 5px;
    height: 88px;
    overflow: hidden;
    padding: var(--theia-ui-padding);
    width: 180px;

    &:hover {
        outline: 1px solid var(--theia-button-background);
        outline-offset: 1px;
    }

    &.disabled {
        cursor: unset;
        opacity: .2;

        &:hover {
            outline-width: 0;
        }
    }
`;

interface AddComponentProps {
    data: ActorData
    setAddComponentDialogOpen: Dispatch<SetStateAction<boolean>>
    addComponent: (t: string) => Promise<void>
}

export default function AddComponent(props: AddComponentProps): React.JSX.Element {
    const {
        data,
        setAddComponentDialogOpen,
        addComponent,
    } = props;

    const componentButtons = [{
        key: 'sprites',
        label: nls.localize('vuengine/editors/actor/sprite', 'Sprite'),
        icon: <Image size={48} />,
        allowAdd: true,
    }, {
        key: 'animations',
        label: nls.localize('vuengine/editors/actor/animation', 'Animation'),
        icon: <FilmStrip size={48} />,
        allowAdd: true,
    }, {
        key: 'colliders',
        label: nls.localize('vuengine/editors/actor/collider', 'Collider'),
        icon: <Selection size={48} />,
        allowAdd: true,
    }, {
        key: 'wireframes',
        label: nls.localize('vuengine/editors/actor/wireframe', 'Wireframe'),
        icon: <Hexagon size={48} />,
        allowAdd: true,
    }, {
        key: 'mutators',
        label: nls.localize('vuengine/editors/actor/mutator', 'Mutator'),
        icon: <SneakerMove size={48} />,
        allowAdd: data.components.mutators.length === 0,
    }, {
        key: 'sounds',
        label: nls.localize('vuengine/editors/actor/sound', 'Sound'),
        icon: <MusicNotes size={48} />,
        allowAdd: true,
    }, {
        key: 'children',
        label: nls.localize('vuengine/editors/actor/child', 'Child'),
        icon: <UserFocus size={48} />,
        allowAdd: true,
    }, {
        key: 'bodies',
        label: nls.localize('vuengine/editors/actor/body', 'Body'),
        icon: <Atom size={48} />,
        allowAdd: data.components.bodies.length === 0,
    }]
        .sort((a, b) => a.label.localeCompare(b.label))
        .map(t =>
            <StyledComponent
                className={!t.allowAdd ? 'disabled' : undefined}
                onClick={() => {
                    if (t.allowAdd) {
                        addComponent(t.key);
                        setAddComponentDialogOpen(false);
                    }
                }}
            >
                <VContainer justifyContent='center' grow={1}>
                    {t.icon}
                </VContainer>
                {t.label}
            </StyledComponent>
        );

    return <HContainer gap={10} wrap='wrap'>
        {componentButtons}
    </HContainer>;
}
