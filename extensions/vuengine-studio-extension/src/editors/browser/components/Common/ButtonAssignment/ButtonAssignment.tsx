import { Command, nls } from '@theia/core';
import React, { MouseEventHandler, RefObject, useState } from 'react';
import styled from 'styled-components';
import { VesKeybindingService } from '../../../../../core/browser/ves-keybinding-service';
import { EditorCommand } from '../../../ves-editors-types';

const StyledButtonAssignment = styled.div`
    background-color: var(--theia-list-hoverBackground);
    border-radius: 2px;
    cursor: pointer;
    display: flex;

    &.none {
        .buttonLabel {
            opacity: .2;
        }
    }

    &:hover,
    &.highlighted {
        background-color: var(--theia-list-dropBackground);
        color: var(--theia-list-hoverForeground);
    }

    & > span {
        align-items: center;
        display: flex;
        padding: var(--theia-ui-padding) calc(var(--theia-ui-padding) * 2);

        &:first-child {
            flex-grow: 1;
        }

        &:last-child {
            max-width: 128px;
            min-width: 128px;
        }
    }

    .theia-button {
        margin: 0;
        max-width: 128px;
        min-width: 128px;
    }
`;

interface ButtonAssignmentProps {
    command: Command | EditorCommand
    vesKeybindingService: VesKeybindingService
    when?: string
    className?: string
    width?: number
    refObject?: RefObject<HTMLDivElement>
    onMouseEnter?: MouseEventHandler
    onMouseLeave?: MouseEventHandler
}

export default function ButtonAssignment(props: ButtonAssignmentProps): React.JSX.Element {
    const { command, vesKeybindingService, when, className, width, refObject, onMouseEnter, onMouseLeave } = props;
    const [, setChanged] = useState(0);

    const classNames = [];
    if (className) {
        classNames.push(className);
    }

    const assign = async () => {
        if (await vesKeybindingService.captureKeybinding(command as Command, when)) {
            setChanged(changed => changed + 1);
        }
    };
    let label = vesKeybindingService.getKeybindingLabel(command.id, false);
    if (label === '') {
        classNames.push('none');
        label = `(${nls.localizeByDefault('none')})`;
    };

    return (command as EditorCommand).disabled === true ? <></> : (
        <StyledButtonAssignment
            className={classNames.join(' ')}
            ref={refObject}
            onClick={assign}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                width: width,
            }}
        >
            <span>{command.label}</span>
            <span>
                <button className='theia-button secondary'>
                    <span className='buttonLabel'>{label}</span>
                </button>
            </span>
        </StyledButtonAssignment>
    );
}
