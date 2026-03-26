import { CommonCommands, HoverService } from '@theia/core/lib/browser';
import React from 'react';
import { VesCommonService } from '../../../core/browser/ves-common-service';
import { WindowControlButton } from './WindowControls';

interface MaximizeToggleProps {
    isMaximizedEditor: boolean
    collapse: () => void
    vesCommonService: VesCommonService
    hoverService: HoverService
}

export default function MaximizeToggle(props: MaximizeToggleProps): React.JSX.Element {
    const { isMaximizedEditor, collapse, vesCommonService, hoverService } = props;

    return (
        <WindowControlButton
            onClick={collapse}
            style={{
                display: !isMaximizedEditor ? 'none' : undefined,
            }}
            onMouseEnter={event => {
                hoverService.requestHover({
                    content: `${CommonCommands.TOGGLE_MAXIMIZED.label}${vesCommonService.getKeybindingLabel(CommonCommands.TOGGLE_MAXIMIZED.id, true)}`,
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
