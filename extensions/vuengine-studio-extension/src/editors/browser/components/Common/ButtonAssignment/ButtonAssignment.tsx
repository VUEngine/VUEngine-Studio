import { Command, CommandService, nls } from '@theia/core';
import { KeymapsCommands } from '@theia/keymaps/lib/browser';
import React, { MouseEventHandler, RefObject } from 'react';
import styled from 'styled-components';
import { VesCommonService } from '../../../../../core/browser/ves-common-service';
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
    commandService: CommandService
    vesCommonService: VesCommonService
    className?: string
    width?: number
    refObject?: RefObject<HTMLDivElement>
    onMouseEnter?: MouseEventHandler
    onMouseLeave?: MouseEventHandler
}

export default function ButtonAssignment(props: ButtonAssignmentProps): React.JSX.Element {
    const { command, commandService, vesCommonService, className, width, refObject, onMouseEnter, onMouseLeave } = props;

    const classNames = [];
    if (className) {
        classNames.push(className);
    }

    const openKeymaps = async () => commandService.executeCommand(
        KeymapsCommands.OPEN_KEYMAPS.id, command.category
        ? `${command.category}: ${command.label}`
        : command.label
    );
    let label = vesCommonService.getKeybindingLabel(command.id, false);
    if (label === '') {
        classNames.push('none');
        label = `(${nls.localizeByDefault('none')})`;
    };

    return (command as EditorCommand).disabled === true ? <></> : (
        <StyledButtonAssignment
            className={classNames.join(' ')}
            ref={refObject}
            onClick={openKeymaps}
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
