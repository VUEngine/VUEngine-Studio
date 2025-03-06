/* eslint-disable no-null/no-null */
import { StatusBarAlignment } from '@theia/core/lib/browser';
import { CanvasHoverPixelChangeHandler, CanvasInfoChangeHandler, DottingRef, PanZoom, useGrids, useHandlers } from 'dotting';
import React, { useContext, useEffect, useState } from 'react';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';

interface PixelEditorStatusProps {
    dottingRef: React.RefObject<DottingRef>
}

export default function PixelEditorStatus(props: PixelEditorStatusProps): React.JSX.Element {
    const { setStatusBarItem, removeStatusBarItem } = useContext(EditorsContext) as EditorsContextType;
    const { dottingRef } = props;
    const {
        addHoverPixelChangeListener,
        removeHoverPixelChangeListener,
        addCanvasInfoChangeEventListener,
        removeCanvasInfoChangeEventListener,
    } = useHandlers(dottingRef);
    const { dimensions } = useGrids(dottingRef);
    const [hoveredPixel, setHoveredPixel] = useState<{ rowIndex: number; columnIndex: number; } | null>(null);
    const [canvasPanZoom, setCanvasPanZoom] = useState<PanZoom | null>(null);

    const setStatusBarItems = () => {
        if (canvasPanZoom) {
            setStatusBarItem('ves-editors-sprite-pan-zoom', {
                alignment: StatusBarAlignment.RIGHT,
                priority: 4,
                text: `${(Math.round(canvasPanZoom.scale * 100))}%`,
            });
        }
        setStatusBarItem('ves-editors-sprite-dimensions', {
            alignment: StatusBarAlignment.RIGHT,
            priority: 3,
            text: `${dimensions.columnCount} × ${dimensions.rowCount}`,
        });
        if (hoveredPixel) {
            setStatusBarItem('ves-editors-sprite-hover-coordinates', {
                alignment: StatusBarAlignment.RIGHT,
                priority: 5,
                text: `${hoveredPixel.columnIndex + 1} : ${hoveredPixel.rowIndex + 1}`,
            });
        } else {
            removeStatusBarItem('ves-editors-sprite-hover-coordinates');
        }
    };

    const removeStatusBarItems = () => {
        removeStatusBarItem('ves-editors-sprite-dimensions');
        removeStatusBarItem('ves-editors-sprite-hover-coordinates');
        removeStatusBarItem('ves-editors-sprite-pan-zoom');
    };

    const handleHoverPixelChangeHandler: CanvasHoverPixelChangeHandler = ({ indices }) => {
        setHoveredPixel(indices);
    };

    const handleCanvasInfoChangeHandler: CanvasInfoChangeHandler = ({ panZoom }) => {
        setCanvasPanZoom(panZoom);
    };

    useEffect(() => {
        setStatusBarItems();
        addHoverPixelChangeListener(handleHoverPixelChangeHandler);
        addCanvasInfoChangeEventListener(handleCanvasInfoChangeHandler);
        return () => {
            removeHoverPixelChangeListener(handleHoverPixelChangeHandler);
            removeCanvasInfoChangeEventListener(handleCanvasInfoChangeHandler);
        };
    }, []);

    useEffect(() => {
        setStatusBarItems();
        return () => {
            removeStatusBarItems();
        };
    }, [
        dimensions,
        hoveredPixel,
        canvasPanZoom
    ]);

    return <></>;
}
