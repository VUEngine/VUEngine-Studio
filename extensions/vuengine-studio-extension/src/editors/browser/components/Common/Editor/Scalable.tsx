import React, { PropsWithChildren, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import VContainer from '../Base/VContainer';
import { StatusBarAlignment } from '@theia/core/lib/browser';
import { CommonEditorCommands } from './CommonEditorCommands';

const ScalableContainer = styled.div`
    align-items: center;
    cursor: grab;
    display: flex;
    flex-grow: 1;
    inset: 0;
    justify-content: center;
    overflow: hidden;
    padding: var(--padding);
    position: absolute;
    user-select: none;

    &.dragging {
        cursor: grabbing;
    }
`;

const ScalableContainerWorld = styled.div`
    align-items: center;
    background-image: radial-gradient(rgba(0, 0, 0, .5) 1px, transparent 0);
    background-position: -1px -1px;
    background-size: 16px 16px;
    display: flex;
    flex-direction: column;
    height: 10000px;
    justify-content: center;
    position: absolute;
    width: 10000px;

    body.theia-light & {
        background-image: radial-gradient(rgba(0, 0, 0, .1) 1px, transparent 0);
    }
`;

interface ScalableProps {
    minZoom: number
    maxZoom: number
    wheelSensitivity: number
    zoomStep: number
    blockMovement?: boolean
    backgroundClickHandler?: () => void
    moveHandler?: (e: React.MouseEvent, zoom: number) => void
}

export default function Scalable(props: PropsWithChildren<ScalableProps>): React.JSX.Element {
    const { children, minZoom, maxZoom, wheelSensitivity, zoomStep, blockMovement, backgroundClickHandler, moveHandler } = props;
    const { setStatusBarItem, removeStatusBarItem } = useContext(EditorsContext) as EditorsContextType;
    const [zoom, setZoom] = useState<number>(1);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [offsetX, setOffsetX] = useState<number>(0);
    const [offsetY, setOffsetY] = useState<number>(0);

    const onWheel = (e: React.WheelEvent): void => {
        if (e.ctrlKey || e.metaKey) {
            let z = zoom - e.deltaY / wheelSensitivity;

            if (z > maxZoom) {
                z = maxZoom;
            } else if (z < minZoom) {
                z = minZoom;
            }

            setZoom(z);
        }
    };

    const onMouseMove = (e: React.MouseEvent): void => {
        if (isDragging) {
            if (!blockMovement) {
                setOffsetX(prev => prev + e.movementX);
                setOffsetY(prev => prev + e.movementY);
            }
            if (moveHandler) {
                moveHandler(e, zoom);
            }
        }
    };

    const center = (): void => {
        setOffsetX(0);
        setOffsetY(0);
    };

    const boundZoom = (z: number) => {
        if (z < minZoom) {
            z = minZoom;
        } else if (z > maxZoom) {
            z = maxZoom;
        }
        return z;
    };

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case CommonEditorCommands.ZOOM_IN.id:
                setZoom(previousValue => boundZoom(previousValue + zoomStep));
                break;
            case CommonEditorCommands.ZOOM_OUT.id:
                setZoom(previousValue => boundZoom(previousValue - zoomStep));
                break;
            case CommonEditorCommands.ZOOM_RESET.id:
                setZoom(1);
                break;
            case CommonEditorCommands.CENTER.id:
                center();
                break;
        }
    };

    const setStatusBarItems = () => {
        setStatusBarItem('ves-editors-common-zoom-out', {
            alignment: StatusBarAlignment.RIGHT,
            priority: 9,
            text: '$(codicon-zoom-out)',
            command: CommonEditorCommands.ZOOM_OUT.id,
            tooltip: CommonEditorCommands.ZOOM_OUT.label,
            className: zoom <= minZoom ? 'disabled' : undefined,
        });
        setStatusBarItem('ves-editors-common-zoom', {
            alignment: StatusBarAlignment.RIGHT,
            priority: 8,
            text: `${Math.round(zoom * 100)}%`,
            command: CommonEditorCommands.ZOOM_RESET.id,
            tooltip: CommonEditorCommands.ZOOM_RESET.label,
        });
        setStatusBarItem('ves-editors-common-zoom-in', {
            alignment: StatusBarAlignment.RIGHT,
            priority: 7,
            text: '$(codicon-zoom-in)',
            command: CommonEditorCommands.ZOOM_IN.id,
            tooltip: CommonEditorCommands.ZOOM_IN.label,
            className: zoom >= maxZoom ? 'disabled' : undefined,
        });

        setStatusBarItem('ves-editors-common-center', {
            alignment: StatusBarAlignment.RIGHT,
            priority: 6,
            text: '$(codicon-symbol-array)',
            command: CommonEditorCommands.CENTER.id,
            tooltip: CommonEditorCommands.CENTER.label,
        });
    };

    const removeStatusBarItems = () => {
        removeStatusBarItem('ves-editors-common-zoom-out');
        removeStatusBarItem('ves-editors-common-zoom');
        removeStatusBarItem('ves-editors-common-zoom-in');
        removeStatusBarItem('ves-editors-common-center');
    };

    useEffect(() => {
        setStatusBarItems();
        return () => {
            removeStatusBarItems();
        };
    }, [
        zoom,
    ]);

    useEffect(() => {
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, []);

    return (
        <VContainer
            grow={1}
            overflow='hidden'
            style={{
                inset: 0,
                position: 'absolute',
            }}>
            <ScalableContainer
                className={isDragging ? ' dragging' : ''}
                onWheel={onWheel}
                onMouseDown={() => setIsDragging(true)}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                onMouseMove={onMouseMove}
            >
                <ScalableContainerWorld
                    style={{
                        transform: `scale(${zoom})`,
                        translate: `${offsetX}px ${offsetY}px`,
                    }}
                    onClick={() => backgroundClickHandler ? backgroundClickHandler() : {}}
                >
                    {children}
                </ScalableContainerWorld>
            </ScalableContainer>
        </VContainer>
    );
}
