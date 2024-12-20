import { HoverPosition, HoverService } from '@theia/core/lib/browser';
import React, { PropsWithChildren, ReactElement } from 'react';
import HoverInfo from './HoverInfo';

interface InfoLabelProps {
    label: string
    subLabel?: string
    count?: number
    tooltip?: string | ReactElement
    tooltipPosition?: HoverPosition
    hoverService?: HoverService
}

export default function InfoLabel(props: PropsWithChildren<InfoLabelProps>): React.JSX.Element {
    const { label, subLabel, tooltip, tooltipPosition, count, hoverService } = props;

    return <label>
        {label}
        {count && <>
            {' '}<span className='count'>{count}</span>
        </>}
        {tooltip &&
            <HoverInfo
                value={tooltip}
                position={tooltipPosition}
                hoverService={hoverService}
            />
        }
        {subLabel && <>
            {' '}<span className='lightLabel'>{subLabel}</span>
        </>}
    </label>;
}
