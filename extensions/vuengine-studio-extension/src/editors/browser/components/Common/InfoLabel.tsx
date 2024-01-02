import { HoverService } from '@theia/core/lib/browser';
import React, { PropsWithChildren, ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

interface InfoLabelProps {
    label: string
    tooltip: string | ReactElement
    hoverService: HoverService
}

export default function InfoLabel(props: PropsWithChildren<InfoLabelProps>): React.JSX.Element {
    const { label, hoverService, tooltip } = props;

    let content: string | HTMLElement = tooltip as string;
    if (typeof tooltip !== 'string') {
        content = document.createElement('div');
        // eslint-disable-next-line no-unsanitized/property
        content.innerHTML = renderToStaticMarkup(tooltip);
    }

    return <label>
        {label}
        <i className='codicon codicon-question' onMouseEnter={event => {
            hoverService.requestHover({
                content: content,
                target: event.currentTarget,
                position: 'top',
            });
        }} />
    </label>;
}
