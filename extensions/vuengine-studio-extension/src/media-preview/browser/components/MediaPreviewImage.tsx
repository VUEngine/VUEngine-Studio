import React, { useEffect, useState } from 'react';
import ZoomControls from '../../../editors/browser/components/Common/Controls/ZoomControls';
import HContainer from '../../../editors/browser/components/Common/HContainer';
import { MEDIA_PREVIEW_ZOOM_LEVELS, MEDIA_PREVIEW_ZOOM_LEVELS_DEFAULT_INDEX } from '../ves-media-preview-types';

interface MediaPreviewImageProps {
    src: string
}

export default function MediaPreviewImage(props: MediaPreviewImageProps): React.JSX.Element {
    const { src } = props;
    const [scaleToFit, setScaleToFit] = useState<boolean>(true);
    const [zoomIn, setZoomIn] = useState<boolean>(true);
    const [zoomIndex, setZoomIndex] = useState<number>(MEDIA_PREVIEW_ZOOM_LEVELS_DEFAULT_INDEX);
    const [height, setHeight] = useState<number>(0);
    const [width, setWidth] = useState<number>(0);

    const handleClick = (e: React.MouseEvent) => {
        let nextZoomIndex = zoomIndex;

        if (zoomIn) {
            if (nextZoomIndex < MEDIA_PREVIEW_ZOOM_LEVELS.length - 1) {
                nextZoomIndex++;
            }
        } else {
            if (nextZoomIndex > 0) {
                nextZoomIndex--;
            }
        }

        updateZoomIndex(nextZoomIndex);
    };

    const updateZoomIndex = (zoom: number): void => {
        if (scaleToFit) {
            setScaleToFit(false);
        }
        setZoomIndex(zoom);
    };

    const handleImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        setHeight(e.currentTarget.naturalHeight);
        setWidth(e.currentTarget.naturalWidth);
    };

    const onKeyDown = (e: KeyboardEvent): void => {
        if (!e.repeat && e.altKey) {
            setZoomIn(false);
        }
    };

    const onKeyUp = (e: KeyboardEvent): void => {
        if (!e.repeat && !e.altKey) {
            setZoomIn(true);
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
        };
    }, []);

    return <>
        <div className='controls-container'>
            <HContainer gap={15}>
                <ZoomControls
                    zoom={zoomIndex}
                    displayZoom={MEDIA_PREVIEW_ZOOM_LEVELS[zoomIndex]}
                    defaultZoom={MEDIA_PREVIEW_ZOOM_LEVELS_DEFAULT_INDEX}
                    min={0}
                    max={MEDIA_PREVIEW_ZOOM_LEVELS.length - 1}
                    step={1}
                    roundZoomSteps={false}
                    applyZoom={updateZoomIndex}
                />
                <div className='controls-infobox'>
                    {width} × {height} px
                </div>
            </HContainer>
        </div>
        <img
            className={scaleToFit ? 'scale-to-fit' : undefined}
            style={{
                cursor: zoomIn ? 'zoom-in' : 'zoom-out',
                zoom: scaleToFit ? undefined : MEDIA_PREVIEW_ZOOM_LEVELS[zoomIndex]
            }}
            src={src}
            onLoad={handleImgLoad}
            onClick={handleClick}
        />
    </>;
}
