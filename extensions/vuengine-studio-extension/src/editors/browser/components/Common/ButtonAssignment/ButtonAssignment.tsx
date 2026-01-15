import { Command, CommandService, nls } from '@theia/core';
import { KeymapsCommands } from '@theia/keymaps/lib/browser';
import React, { MouseEventHandler, RefObject } from 'react';
import styled from 'styled-components';
import { VesCommonService } from '../../../../../core/browser/ves-common-service';
import { EditorCommand } from '../../../ves-editors-types';

const StyledButtonAssignment = styled.div`
    cursor: pointer;
    display: table-row;

    &.none {
        .buttonLabel {
            opacity: .2;
        }
    }

    &:hover,
    &.highlighted {
        background-color: var(--theia-list-hoverBackground);
        color: var(--theia-list-hoverForeground);
    }

    &>span {
        display: table-cell;
        padding: var(--theia-ui-padding) calc(var(--theia-ui-padding) * 2);
        vertical-align: middle;

        &:last-child {
            text-align: end;
        }
    }

    .theia-button {
        min-width: 128px;
    }
`;

interface ButtonAssignmentProps {
    command: Command | EditorCommand
    commandService: CommandService
    vesCommonService: VesCommonService
    className?: string
    refObject?: RefObject<HTMLDivElement>
    onMouseEnter?: MouseEventHandler
    onMouseLeave?: MouseEventHandler
}

export default function ButtonAssignment(props: ButtonAssignmentProps): React.JSX.Element {
    const { command, commandService, vesCommonService, className, refObject, onMouseEnter, onMouseLeave } = props;

    const classNames = [];
    if (className) {
        classNames.push(className);
    }

    const openKeymaps = async () => commandService.executeCommand(KeymapsCommands.OPEN_KEYMAPS.id);
    let label = vesCommonService.getKeybindingLabel(command.id, false);
    if (label === '') {
        classNames.push('none');
        label = `(${nls.localizeByDefault('none')})`;
    };

    return (command as EditorCommand).disabled === true ? <></> : (
        <StyledButtonAssignment
            className={classNames.join(' ')}
            ref={refObject}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <span>{command.label}</span>
            <span>
                <button className='theia-button secondary' onClick={openKeymaps}>
                    <span className='buttonLabel'>{label}</span>
                </button>
            </span>
        </StyledButtonAssignment>
    );
}
