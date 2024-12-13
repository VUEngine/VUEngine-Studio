/* eslint-disable no-null/no-null */
import { CrosshairSimple, FrameCorners, MagnifyingGlass } from '@phosphor-icons/react';
import { CanvasHoverPixelChangeHandler, CanvasInfoChangeHandler, DottingRef, PanZoom, useGrids, useHandlers } from 'dotting';
import React, { useEffect, useState } from 'react';
import HContainer from '../Common/Base/HContainer';

interface SpriteEditorStatusProps {
    dottingRef: React.RefObject<DottingRef>
    style?: object
}

export default function SpriteEditorStatus(props: SpriteEditorStatusProps): React.JSX.Element {
    const { dottingRef, style } = props;
    const {
        addHoverPixelChangeListener,
        removeHoverPixelChangeListener,
        addCanvasInfoChangeEventListener,
        removeCanvasInfoChangeEventListener,
    } = useHandlers(dottingRef);
    const { dimensions } = useGrids(dottingRef);
    const [hoveredPixel, setHoveredPixel] = useState<{ rowIndex: number; columnIndex: number; } | null>(null);
    const [canvasPanZoom, setCanvasPanZoom] = useState<PanZoom | null>(null);

    const handleHoverPixelChangeHandler: CanvasHoverPixelChangeHandler = ({ indices }) => {
        setHoveredPixel(indices);
    };

    const handleCanvasInfoChangeHandler: CanvasInfoChangeHandler = ({ panZoom }) => {
        setCanvasPanZoom(panZoom);
    };

    useEffect(() => {
        addHoverPixelChangeListener(handleHoverPixelChangeHandler);
        addCanvasInfoChangeEventListener(handleCanvasInfoChangeHandler);
        return () => {
            removeHoverPixelChangeListener(handleHoverPixelChangeHandler);
            removeCanvasInfoChangeEventListener(handleCanvasInfoChangeHandler);
        };
    }, []);

    return (
        <HContainer gap={10} style={style}>
            <HContainer alignItems='center' gap={2}>
                <MagnifyingGlass /> {canvasPanZoom && (Math.round(canvasPanZoom.scale * 100) / 100)}
            </HContainer>
            <HContainer alignItems='center' gap={2}>
                <FrameCorners /> {dimensions.columnCount} × {dimensions.rowCount}
            </HContainer>
            <HContainer alignItems='center' gap={2}>
                {hoveredPixel && <>
                    <CrosshairSimple /> {hoveredPixel.columnIndex + 1}
                    :
                    {hoveredPixel.rowIndex + 1}
                </>}
            </HContainer>
        </HContainer>
    );
}
