import { CornersOut } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../../Common/Base/HContainer';
import ZoomControls from '../../Common/Controls/ZoomControls';

interface PreviewOptionsProps {
    zoom: number
    setZoom: (zoom: number) => void
    minZoom: number
    maxZoom: number
    zoomStep: number
    roundZoomSteps?: boolean
    center: () => void
}

export default function PreviewOptions(props: PreviewOptionsProps): React.JSX.Element {
    const { zoom, setZoom, minZoom, maxZoom, zoomStep, roundZoomSteps, center } = props;

    const applyZoom = (z: number) => {
        if (setZoom) {
            if (z < minZoom) {
                z = minZoom;
            } else if (z > maxZoom) {
                z = maxZoom;
            }
            setZoom(z);
        }
    };

    return (
        <div className='controls-container'>
            <HContainer gap={15}>
                <ZoomControls
                    zoom={zoom}
                    defaultZoom={1}
                    min={minZoom}
                    max={maxZoom}
                    step={zoomStep}
                    roundZoomSteps={roundZoomSteps ?? false}
                    applyZoom={applyZoom}
                />
                <button
                    className='theia-button secondary controls-button'
                    onClick={e => { e.stopPropagation(); center(); }}
                    title={nls.localize('vuengine/editors/general/centerView', 'Center View')}
                >
                    <CornersOut size={20} />
                </button>
            </HContainer>
        </div>
    );
}
