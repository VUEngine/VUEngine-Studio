import { HoverPosition, HoverService } from '@theia/core/lib/browser';
import React, { PropsWithChildren, ReactElement, useContext } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';

interface InfoLabelProps {
    label: string
    subLabel?: string
    count?: number
    tooltip?: string | ReactElement
    tooltipPosition?: HoverPosition
    hoverService?: HoverService
}

export default function InfoLabel(props: PropsWithChildren<InfoLabelProps>): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { label, subLabel, tooltip, tooltipPosition, count, hoverService } = props;

    let content: string | HTMLElement = tooltip as string;
    if (tooltip && typeof tooltip !== 'string') {
        content = document.createElement('div');
        // eslint-disable-next-line no-unsanitized/property
        content.innerHTML = renderToStaticMarkup(tooltip);
    }

    const hs = hoverService ? hoverService : services.hoverService;

    return <label>
        {label}
        {count && <>
            {' '}<span className='count'>{count}</span>
        </>}
        {tooltip &&
            <i
                className='codicon codicon-question'
                onMouseEnter={event => {
                    hs.requestHover({
                        content: content,
                        target: event.currentTarget,
                        position: tooltipPosition || 'top',
                    });
                }}
                onMouseLeave={event => {
                    hs.cancelHover();
                }}
            />
        }
        {subLabel && <>
            {' '}<span className='lightLabel'>{subLabel}</span>
        </>}
    </label>;
}
