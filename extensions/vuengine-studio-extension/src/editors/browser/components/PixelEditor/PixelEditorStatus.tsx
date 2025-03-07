/* eslint-disable no-null/no-null */
import { StatusBarAlignment } from '@theia/core/lib/browser';
import { CanvasHoverPixelChangeHandler, CanvasInfoChangeHandler, DottingRef, PanZoom, useGrids, useHandlers } from 'dotting';
import React, { useContext, useEffect, useState } from 'react';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../ves-editors-types';
import { FontEditorCommands } from '../FontEditor/FontEditorCommands';

interface PixelEditorStatusProps {
    allowResize?: boolean
    setAllowResize?: (allowResize: boolean) => void
    gridSize: number
    setGridSize: (gridSize: number) => void
    dottingRef: React.RefObject<DottingRef>
}

export default function PixelEditorStatus(props: PixelEditorStatusProps): React.JSX.Element {
    const { setStatusBarItem, removeStatusBarItem } = useContext(EditorsContext) as EditorsContextType;
    const { allowResize, setAllowResize, gridSize, setGridSize, dottingRef } = props;
    const {
        addHoverPixelChangeListener,
        removeHoverPixelChangeListener,
        addCanvasInfoChangeEventListener,
        removeCanvasInfoChangeEventListener,
    } = useHandlers(dottingRef);
    const { dimensions } = useGrids(dottingRef);
    const [hoveredPixel, setHoveredPixel] = useState<{ rowIndex: number; columnIndex: number; } | null>(null);
    const [canvasPanZoom, setCanvasPanZoom] = useState<PanZoom | null>(null);

    const toggleAllowResize = (): void => {
        if (setAllowResize) {
            setAllowResize(!allowResize);
        }
    };

    const toggleGrid = (): void => {
        setGridSize(gridSize > 0 ? 0 : 1);
    };

    const setStatusBarItems = () => {
        setStatusBarItem('ves-editors-sprite-grid-toggle', {
            alignment: StatusBarAlignment.RIGHT,
            command: FontEditorCommands.TOGGLE_GRID.id,
            className: gridSize === 0 ? 'disabled' : undefined,
            priority: 7,
            text: '$(fa-th-large)',
            tooltip: FontEditorCommands.TOGGLE_GRID.label,
        });
        setStatusBarItem('ves-editors-sprite-resizer-toggle', {
            alignment: StatusBarAlignment.RIGHT,
            command: FontEditorCommands.TOGGLE_ALLOW_RESIZE.id,
            className: !allowResize ? 'disabled' : undefined,
            priority: 6,
            text: '$(fa-arrows-alt)',
            tooltip: FontEditorCommands.TOGGLE_ALLOW_RESIZE.label,
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
        removeStatusBarItem('ves-editors-sprite-resizer-toggle');
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
            case FontEditorCommands.TOGGLE_GRID.id:
                toggleGrid();
                break;
            case FontEditorCommands.TOGGLE_ALLOW_RESIZE.id:
                toggleAllowResize();
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
        allowResize,
        gridSize,
    ]);

    useEffect(() => {
        setStatusBarItems();
        return () => {
            removeStatusBarItems();
        };
    }, [
        allowResize,
        canvasPanZoom,
        dimensions,
        gridSize,
        hoveredPixel,
    ]);

    return <></>;
}
