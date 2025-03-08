/* eslint-disable no-null/no-null */
import { Copy, DotsSixVertical, EyeClosed, HandEye } from '@phosphor-icons/react';
import { Eye } from '@phosphor-icons/react/dist/ssr';
import { nls } from '@theia/core';
import {
    DottingRef,
    LayerChangeHandler,
    LayerProps,
    useHandlers,
    useLayers
} from 'dotting';
import React, { BaseSyntheticEvent, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { PALETTE_INDICES } from '../../../../core/browser/ves-common-types';
import HContainer from '../Common/Base/HContainer';
import Input from '../Common/Base/Input';
import VContainer from '../Common/Base/VContainer';
import CanvasImage from '../Common/CanvasImage';
import { nanoid } from '../Common/Utils';
import { DisplayMode, Displays } from '../Common/VUEngineTypes';
import { INPUT_BLOCKING_COMMANDS, LayerPixelData, SpriteData } from './PixelEditorTypes';

const LayerPreviewContainer = styled.div`
    border: 1px solid var(--theia-dropdown-border);
    border-radius: 2px;
    display: flex;
    max-height: 50px;
    max-width: 50px;
    min-height: 50px;
    min-width: 50px;

    canvas {
        height: 100%;
        object-fit: contain;
        width: 100%;
    }
`;

interface PixelEditorLayersProps {
    data: SpriteData
    updateData: (data: SpriteData) => void
    currentFrame: number
    setCurrentFrameData: (frame: LayerPixelData[]) => void
    dottingRef: React.RefObject<DottingRef>
}

export default function PixelEditorLayers(props: PixelEditorLayersProps): React.JSX.Element {
    const { data, updateData, currentFrame, setCurrentFrameData, dottingRef } = props;
    const {
        addLayerChangeEventListener,
        removeLayerChangeEventListener,
    } = useHandlers(dottingRef);
    const {
        addLayer,
        changeLayerPosition,
        currentLayer,
        hideLayer,
        isolateLayer,
        layers,
        removeLayer,
        reorderLayersByIds,
        setCurrentLayer,
        showAllLayers,
        showLayer,
    } = useLayers(dottingRef);
    const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
    const draggingItemIndex = useRef<number | null>(null);
    const draggingOverItemIndex = useRef<number | null>(null);

    const addDataLayer = (): void => {
        addLayer(nanoid(), layers.length);
    };

    const removeDataLayer = (layerId: string): void => {
        removeLayer(layerId);
    };

    const duplicateLayer = (layer: LayerProps, insertPosition: number): void => {
        addLayer(nanoid(), insertPosition, layer.data);
    };

    const setLayerName = (layerIndex: number, name: string): void => {
        const updatedFrames = [...data.frames];
        updatedFrames[currentFrame][layerIndex].name = name;

        updateData({
            ...data,
            frames: updatedFrames,
        });
    };

    const onDragStart = (e: BaseSyntheticEvent, index: number, id: string) => {
        draggingItemIndex.current = index;
        setDraggingSectionId(id);
    };

    const onAvailableItemDragEnter = (e: BaseSyntheticEvent, index: number) => {
        draggingOverItemIndex.current = index;
        const copyListItems = [...layers];
        const draggingItemContent = copyListItems[draggingItemIndex.current!];
        copyListItems.splice(draggingItemIndex.current!, 1);
        copyListItems.splice(
            draggingOverItemIndex.current!,
            0,
            draggingItemContent,
        );
        draggingItemIndex.current = draggingOverItemIndex.current;
        draggingOverItemIndex.current = null;
        changeLayerPosition(draggingItemContent.id, index);
    };

    const onDragEnd = (e: BaseSyntheticEvent) => {
        reorderLayersByIds(layers.map(layer => layer.id));
        setDraggingSectionId(null);
    };

    const onDragOver = (e: BaseSyntheticEvent) => {
        e.preventDefault();
    };

    const onClickHandler = (e: BaseSyntheticEvent, id: string) => {
        setCurrentLayer(id);
    };

    const handleLayerChangeHandler: LayerChangeHandler = ({ layers: updatedLayers }) => {
        // console.log('updatedLayers', updatedLayers);
        const updatedFrame = [
            ...updatedLayers.map(layer => ({
                ...data.frames[currentFrame].find(l => l.id === layer.getId()) || {
                    displays: Displays.Both,
                    name: '',
                    parallax: 0,
                },
                data: [...layer.getData()].sort((a, b) => {
                    if (a[0] < b[0]) {
                        return -1;
                    }
                    if (a[0] > b[0]) {
                        return 1;
                    }
                    return 0;
                }).map(r => [...r[1]].sort((a, b) => {
                    if (a[0] < b[0]) {
                        return -1;
                    }
                    if (a[0] > b[0]) {
                        return 1;
                    }
                    return 0;
                }).map(p => p[1].color === '' ? null : PALETTE_INDICES[data.colorMode][p[1].color])),
                id: layer.getId(),
                isVisible: layer.getIsVisible(),
            }))];

        // console.log('updatedFrame', updatedFrame);
        // console.log('data.frames[currentFrame]', data.frames[currentFrame]);
        if (JSON.stringify(updatedFrame) !== JSON.stringify(data.frames[currentFrame])) {
            // console.log('--- setData ---');
            setCurrentFrameData(updatedFrame);
        }
    };

    useEffect(() => {
        addLayerChangeEventListener(handleLayerChangeHandler);
        return () => {
            removeLayerChangeEventListener(handleLayerChangeHandler);
        };
    }, [
        currentFrame,
        data,
    ]);

    return (
        <VContainer overflow='hidden'>
            <HContainer alignItems="center" justifyContent="space-between">
                <label>
                    {nls.localize('vuengine/editors/pixel/layers', 'Layers')}
                </label>
                {layers.filter(layer => !layer.isVisible).length > 0 &&
                    <div
                        onClick={showAllLayers}
                        title={nls.localize('vuengine/editors/pixel/ShowAllLayers', 'Show All Layers')}
                        style={{ cursor: 'pointer' }}
                    >
                        <Eye size={16} style={{ float: 'left' }} />
                    </div>
                }
            </HContainer>
            <VContainer overflow='auto'>
                {layers.map((layer, index) => (
                    <div
                        key={index}
                        className={`item layer${currentLayer?.id === layer.id ? ' active' : ''}${draggingSectionId === layer.id ? ' dragging' : ''}`}
                        style={{
                            alignItems: 'center',
                            display: 'flex',
                            gap: 5,
                            justifyContent: 'start',
                            opacity: layer.isVisible ? 1 : 0.5,
                        }}
                        onClick={e => onClickHandler(e, layer.id)}
                        onDragStart={e => onDragStart(e, index, layer.id)}
                        onDragEnter={e => onAvailableItemDragEnter(e, index)}
                        onDragEnd={onDragEnd}
                        onDragOver={onDragOver}
                        draggable
                    >
                        {layers.length > 1 &&
                            <button
                                className="remove-button"
                                onClick={e => {
                                    e.stopPropagation();
                                    removeDataLayer(layer.id);
                                }}
                                title={nls.localize('vuengine/editors/pixel/removeLayer', 'Remove Layer')}
                            >
                                <i className='codicon codicon-x' />
                            </button>
                        }
                        <HContainer>
                            <VContainer justifyContent="center" style={{ cursor: 'grab' }}>
                                <DotsSixVertical size={16} />
                            </VContainer>
                            <LayerPreviewContainer>
                                {data.frames[currentFrame][index] &&
                                    <CanvasImage
                                        height={layer.data.length}
                                        palette={'11100100'}
                                        pixelData={[data.frames[currentFrame][index].data]}
                                        displayMode={DisplayMode.Mono}
                                        width={layer.data[0].length}
                                        colorMode={data.colorMode}
                                        drawBlack={true}
                                    />
                                }
                            </LayerPreviewContainer>
                            <VContainer>
                                <Input
                                    style={{ boxSizing: 'border-box', width: '100%' }}
                                    value={data.frames[currentFrame].find(l => l.id === layer.id)?.name ?? ''}
                                    grow={1}
                                    setValue={v => setLayerName(index, v as string)}
                                    commands={INPUT_BLOCKING_COMMANDS}
                                />
                                <HContainer>
                                    <div
                                        style={{ cursor: 'pointer' }}
                                        onClick={e => {
                                            e.stopPropagation();
                                            if (layer.isVisible) {
                                                hideLayer(layer.id);
                                            } else {
                                                showLayer(layer.id);
                                            }
                                        }}
                                    >
                                        {layer.isVisible
                                            ? <Eye size={16} />
                                            : <EyeClosed size={16} />
                                        }
                                    </div>
                                    <div
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            isolateLayer(layer.id);
                                        }}
                                    >
                                        <HandEye size={16} />
                                    </div>
                                    <div
                                        style={{ cursor: 'pointer' }}
                                        onClick={e => {
                                            duplicateLayer(layer, index + 1);
                                        }}
                                    >
                                        <Copy size={16} />
                                    </div>
                                </HContainer>
                            </VContainer>
                            <div style={{
                                maxWidth: 18,
                                minWidth: 18,
                            }} />
                        </HContainer>
                    </div>
                ))}
                <button
                    className='theia-button add-button'
                    onClick={addDataLayer}
                    title={nls.localizeByDefault('Add')}
                    style={{
                        backgroundColor: 'var(--theia-editor-background)'
                    }}
                >
                    <i className='codicon codicon-plus' />
                </button>
            </VContainer>
        </VContainer>
    );
}
