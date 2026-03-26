import React from 'react';
import styled from 'styled-components';
import { VesCommonService } from '../../../core/browser/ves-common-service';
import { ViewModeCommands } from '../../../viewMode/browser/view-mode-commands';
import { VIEW_MODE_ICONS, VIEW_MODE_LABELS, ViewMode } from '../../../viewMode/browser/view-mode-types';

const StyledViewModeSelect = styled.button`
    -webkit-app-region: no-drag;
    align-items: center;
    background-color: transparent;
    border: 1px solid rgba(255, 255, 255, .3);
    border-radius: 5px;
    box-sizing: border-box;
    color: var(--theia-titlebar);
    cursor: pointer;
    display: flex;
    gap: 3px;
    height: calc(var(--theia-private-menubar-height) - 7px);
    line-height: calc(var(--theia-private-menubar-height) - 7px);
    outline-width: 0 !important;
    padding: 0 var(--theia-ui-padding);
    position: relative;
    width: 180px;

    &:hover,
    &:focus,
    &:active {
        background-color: rgba(255, 255, 255, .3);
    }

    > .codicon-chevron-down {
        opacity: .5;
        position: absolute;
        right: var(--theia-ui-padding);
    }
`;

interface ViewModeSelectProps {
    hidden: boolean
    viewMode: ViewMode
    openViewModeMenu: () => void
    vesCommonService: VesCommonService
}

export default function ViewModeSelect(props: ViewModeSelectProps): React.JSX.Element {
    const { hidden, viewMode, openViewModeMenu, vesCommonService } = props;

    return hidden ? <></> : (
        <StyledViewModeSelect
            onClick={openViewModeMenu}
            title={ViewModeCommands.CHANGE_VIEW_MODE.label +
                vesCommonService.getKeybindingLabel(ViewModeCommands.CHANGE_VIEW_MODE.id, true)}
        >
            <i className={VIEW_MODE_ICONS[viewMode]} /> {VIEW_MODE_LABELS[viewMode]}
            <i className="codicon codicon-chevron-down" />
        </StyledViewModeSelect>
    );
}
