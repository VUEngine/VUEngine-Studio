import React from 'react';
import HContainer from '../Base/HContainer';
import { nls } from '@theia/core';

interface ZoomControlsProps {
    zoom: number
    displayZoom?: number
    defaultZoom: number
    min: number
    max: number
    step: number
    roundZoomSteps: boolean
    applyZoom: (zoom: number) => void
}

export default function ZoomControls(props: ZoomControlsProps): React.JSX.Element {
    const { zoom, displayZoom, defaultZoom, min, max, step, roundZoomSteps, applyZoom } = props;

    return <HContainer gap={3}>
        <button
            className='theia-button secondary controls-button'
            disabled={zoom === min}
            onClick={e => {
                e.stopPropagation();
                applyZoom(roundZoomSteps ? Math.round(zoom - step) : zoom - step);
            }}
            title={nls.localize('vuengine/editors/general/zoomOut', 'Zoom Out')}
        >
            <i className='codicon codicon-zoom-out' />
        </button>
        <div
            className='controls-infobox'
            onClick={e => {
                e.stopPropagation();
                applyZoom(defaultZoom);
            }}
            style={{
                cursor: 'pointer',
            }}
            title={nls.localize('vuengine/editors/general/resetZoom', 'Reset Zoom')}
        >
            {Math.round((displayZoom ?? zoom) * 100) / 100}
        </div>
        <button
            className='theia-button secondary controls-button'
            disabled={zoom === max}
            onClick={e => {
                e.stopPropagation();
                applyZoom(roundZoomSteps ? Math.round(zoom + step) : zoom + step);
            }}
            title={nls.localize('vuengine/editors/general/zoomIn', 'Zoom In')}
        >
            <i className='codicon codicon-zoom-in' />
        </button>
    </HContainer>;
}
