/* eslint-disable no-null/no-null */
import { StatusBarAlignment } from '@theia/core/lib/browser';
import { CanvasHoverPixelChangeHandler, CanvasInfoChangeHandler, DottingRef, PanZoom, useGrids, useHandlers } from 'dotting';
import React, { useContext, useEffect, useState } from 'react';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../ves-editors-types';
import { PixelEditorCommands } from './PixelEditorCommands';

interface PixelEditorStatusProps {
    gridSize: number
    setGridSize: (gridSize: number) => void
    dottingRef: React.RefObject<DottingRef>
}

export default function PixelEditorStatus(props: PixelEditorStatusProps): React.JSX.Element {
    const { setStatusBarItem, removeStatusBarItem } = useContext(EditorsContext) as EditorsContextType;
    const { gridSize, setGridSize, dottingRef } = props;
    const {
        addHoverPixelChangeListener,
        removeHoverPixelChangeListener,
        addCanvasInfoChangeEventListener,
        removeCanvasInfoChangeEventListener,
    } = useHandlers(dottingRef);
    const { dimensions } = useGrids(dottingRef);
    const [hoveredPixel, setHoveredPixel] = useState<{ rowIndex: number; columnIndex: number; } | null>(null);
    const [canvasPanZoom, setCanvasPanZoom] = useState<PanZoom | null>(null);

    const toggleGrid = (): void => {
        setGridSize(gridSize > 0 ? 0 : 1);
    };

    const setStatusBarItems = () => {
        setStatusBarItem('ves-editors-sprite-grid-toggle', {
            alignment: StatusBarAlignment.RIGHT,
            command: PixelEditorCommands.TOGGLE_GRID.id,
            className: gridSize === 0 ? 'disabled' : undefined,
            priority: 7,
            text: '$(fa-th-large)',
            tooltip: PixelEditorCommands.TOGGLE_GRID.label,
        });
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
        removeStatusBarItem('ves-editors-sprite-grid-toggle');
        removeStatusBarItem('ves-editors-sprite-dimensions');
        removeStatusBarItem('ves-editors-sprite-hover-coordinates');
        removeStatusBarItem('ves-editors-sprite-pan-zoom');
    };

    const hoverPixelChangeHandler: CanvasHoverPixelChangeHandler = ({ indices }) => {
        setHoveredPixel(indices);
    };

    const canvasInfoChangeHandler: CanvasInfoChangeHandler = ({ panZoom }) => {
        setCanvasPanZoom(panZoom);
    };

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case PixelEditorCommands.TOGGLE_GRID.id:
                toggleGrid();
                break;
        }
    };

    useEffect(() => {
        setStatusBarItems();
        addHoverPixelChangeListener(hoverPixelChangeHandler);
        addCanvasInfoChangeEventListener(canvasInfoChangeHandler);
        return () => {
            removeHoverPixelChangeListener(hoverPixelChangeHandler);
            removeCanvasInfoChangeEventListener(canvasInfoChangeHandler);
        };
    }, []);

    useEffect(() => {
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, [
        gridSize,
    ]);

    useEffect(() => {
        setStatusBarItems();
        return () => {
            removeStatusBarItems();
        };
    }, [
        canvasPanZoom,
        dimensions,
        gridSize,
        hoveredPixel,
    ]);

    return <></>;
}
