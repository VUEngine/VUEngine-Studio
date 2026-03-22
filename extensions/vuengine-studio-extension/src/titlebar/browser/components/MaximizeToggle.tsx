import { CommonCommands } from '@theia/core/lib/browser';
import React from 'react';
import { VesCommonService } from '../../../core/browser/ves-common-service';
import { WindowControlButton } from './WindowControls';

interface MaximizeToggleProps {
    isMaximizedEditor: boolean
    collapse: () => void
    vesCommonService: VesCommonService
}

export default function MaximizeToggle(props: MaximizeToggleProps): React.JSX.Element {
    const { isMaximizedEditor, collapse, vesCommonService } = props;

    return (
        <WindowControlButton
            title={`${CommonCommands.TOGGLE_MAXIMIZED.label}${vesCommonService.getKeybindingLabel(CommonCommands.TOGGLE_MAXIMIZED.id, true)}`}
            onClick={collapse}
            style={{
                display: !isMaximizedEditor ? 'none' : undefined,
            }}
        >
            <i className="fa fa-compress"></i>
        </WindowControlButton>
    );
}
