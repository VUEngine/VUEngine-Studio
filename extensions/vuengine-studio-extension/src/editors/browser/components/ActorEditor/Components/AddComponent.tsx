import { Atom, FilmStrip, Hexagon, Image, MusicNotes, Selection, SneakerMove, UserFocus } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import { ActorData } from '../ActorEditorTypes';

const StyledComponent = styled.button`
    align-items: center;
    background-color: var(--theia-secondaryButton-background);
    border: none;
    border-radius: 2px;
    box-sizing: border-box;
    color: var(--theia-foreground-color);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 5px;
    height: 88px;
    overflow: hidden;
    padding: var(--theia-ui-padding) !important;
    width: 180px;

    &:focus,
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
    const { disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;

    const onEnter = (e: React.KeyboardEvent, fn: () => void): void => {
        if (e.key === 'Enter') {
            fn();
        }
    };

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
        .map((t, i) =>
            <StyledComponent
                key={i}
                className={!t.allowAdd ? 'disabled' : undefined}
                disabled={!t.allowAdd}
                tabIndex={i === 0 ? 0 : undefined}
                autoFocus={i === 0 ? true : undefined}
                onClick={() => {
                    if (t.allowAdd) {
                        addComponent(t.key);
                        setAddComponentDialogOpen(false);
                    }
                }}
                onKeyDown={e => onEnter(e, () => {
                    if (t.allowAdd) {
                        addComponent(t.key);
                        setAddComponentDialogOpen(false);
                    }
                })}
                onFocus={disableCommands}
                onBlur={enableCommands}
            >
                <VContainer justifyContent='center' grow={1}>
                    {t.icon}
                </VContainer>
                {t.label}
            </StyledComponent>
        );

    return <HContainer gap={10} wrap='wrap' overflow='auto' style={{ padding: 2 }}>
        {componentButtons}
    </HContainer>;
}
