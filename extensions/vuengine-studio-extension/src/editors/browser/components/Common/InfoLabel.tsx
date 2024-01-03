import { HoverPosition } from '@theia/core/lib/browser';
import React, { PropsWithChildren, ReactElement, useContext } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';

interface InfoLabelProps {
    label: string
    tooltip: string | ReactElement
    tooltipPosition?: HoverPosition
}

export default function InfoLabel(props: PropsWithChildren<InfoLabelProps>): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { label, tooltip, tooltipPosition } = props;

    let content: string | HTMLElement = tooltip as string;
    if (typeof tooltip !== 'string') {
        content = document.createElement('div');
        // eslint-disable-next-line no-unsanitized/property
        content.innerHTML = renderToStaticMarkup(tooltip);
    }

    return <label>
        {label}
        <i className='codicon codicon-question' onMouseEnter={event => {
            services.hoverService.requestHover({
                content: content,
                target: event.currentTarget,
                position: tooltipPosition || 'top',
            });
        }} />
    </label>;
}
