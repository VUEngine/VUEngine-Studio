import { HoverPosition, HoverService } from '@theia/core/lib/browser';
import React, { PropsWithChildren, ReactElement, useContext } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';

interface HoverInfoProps {
    value: string | ReactElement
    position?: HoverPosition
    hoverService?: HoverService
}

export default function HoverInfo(props: PropsWithChildren<HoverInfoProps>): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { value: tooltip, position, hoverService } = props;

    let content: string | HTMLElement = tooltip as string;
    if (tooltip && typeof tooltip !== 'string') {
        content = document.createElement('div');
        // eslint-disable-next-line no-unsanitized/property
        content.innerHTML = renderToStaticMarkup(tooltip);
    }

    const hs = hoverService ? hoverService : services.hoverService;

    return (
        <i
            className='codicon codicon-question'
            onMouseEnter={event => {
                hs.requestHover({
                    content,
                    target: event.currentTarget,
                    position: position || 'top',
                });
            }}
            onMouseLeave={event => {
                hs.cancelHover();
            }}
        />
    );
}
