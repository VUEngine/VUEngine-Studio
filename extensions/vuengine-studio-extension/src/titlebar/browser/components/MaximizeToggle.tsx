import { CommonCommands, HoverService } from '@theia/core/lib/browser';
import React from 'react';
import { VesKeybindingService } from '../../../core/browser/ves-keybinding-service';
import { WindowControlButton } from './WindowControls';

interface MaximizeToggleProps {
    isMaximizedEditor: boolean
    collapse: () => void
    vesKeybindingService: VesKeybindingService
    hoverService: HoverService
}

export default function MaximizeToggle(props: MaximizeToggleProps): React.JSX.Element {
    const { isMaximizedEditor, collapse, vesKeybindingService, hoverService } = props;

    return (
        <WindowControlButton
            onClick={collapse}
            style={{
                display: !isMaximizedEditor ? 'none' : undefined,
            }}
            onMouseEnter={event => {
                hoverService.requestHover({
                    content: `${CommonCommands.TOGGLE_MAXIMIZED.label}${vesKeybindingService.getKeybindingLabel(CommonCommands.TOGGLE_MAXIMIZED.id, true)}`,
                    target: event.currentTarget,
                    position: 'bottom',
                });
            }}
            onMouseLeave={() => {
                hoverService.cancelHover();
            }}
        >
            <i className="fa fa-compress"></i>
        </WindowControlButton>
    );
}
