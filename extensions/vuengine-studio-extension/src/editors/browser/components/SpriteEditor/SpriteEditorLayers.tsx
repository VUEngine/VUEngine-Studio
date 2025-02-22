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
import HContainer from '../Common/Base/HContainer';
import Input from '../Common/Base/Input';
import VContainer from '../Common/Base/VContainer';
import { nanoid } from '../Common/Utils';
import { INPUT_BLOCKING_COMMANDS } from '../FontEditor/FontEditor';
import { LayerAttributes, SpriteData } from './SpriteEditorTypes';

interface SpriteEditorLayersProps {
    data: SpriteData
    updateData: (data: SpriteData) => void
    dottingRef: React.RefObject<DottingRef>
    currentFrame: number
}

export default function SpriteEditorLayers(props: SpriteEditorLayersProps): React.JSX.Element {
    const { data, updateData, currentFrame, dottingRef } = props;
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

    const setData = (partialData: Partial<SpriteData>): void => {
        updateData({
            ...data,
            ...partialData,
        });
    };

    const addDataLayer = (): void => {
        addLayer(nanoid(), layers.length);
    };

    const removeDataLayer = (layerId: string): void => {
        removeLayer(layerId);
        removeLayerAttributes(layerId);
    };

    const hideDataLayer = (layerId: string): void => {
        hideLayer(layerId);
        setLayerAttributes(layerId, { isVisible: false });
    };

    const showDataLayer = (layerId: string): void => {
        showLayer(layerId);
        setLayerAttributes(layerId, { isVisible: true });
    };

    const duplicateLayer = (layer: LayerProps, insertPosition: number): void => {
        addLayer(nanoid(), insertPosition, layer.data);
    };

    const setLayerName = (layerId: string, name: string): void => {
        setLayerAttributes(layerId, { name });
    };

    const setLayerAttributes = (layerId: string, partialLayerAttributes: Partial<LayerAttributes>): void => {
        setData({
            layerAttributes: {
                ...data.layerAttributes,
                [layerId]: {
                    ...(data.layerAttributes[layerId] ?? {}),
                    ...partialLayerAttributes,
                }
            }
        });
    };

    const removeLayerAttributes = (layerId: string): void => {
        const updatedLayerAttributes = { ...data.layerAttributes };
        if (updatedLayerAttributes[layerId]) {
            delete (updatedLayerAttributes[layerId]);
        };
        setData({
            layerAttributes: updatedLayerAttributes
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
        console.log('updatedLayers', JSON.stringify(updatedLayers));
        const updatedFrame = [
            ...updatedLayers.map(layer => ({
                id: layer.getId(),
                data: layer.getDataArray(),
            }))
        ];

        if (JSON.stringify(updatedFrame) !== JSON.stringify(data.frames[currentFrame])) {
            console.log('setData');
            setData({
                frames: [
                    ...data.frames.slice(0, currentFrame),
                    updatedFrame,
                    ...data.frames.slice(currentFrame + 1)
                ]
            });
        }
    };

    useEffect(() => {
        addLayerChangeEventListener(handleLayerChangeHandler);
        return () => {
            removeLayerChangeEventListener(handleLayerChangeHandler);
        };
    }, [data]);

    return (
        <VContainer overflow='hidden'>
            <HContainer alignItems="center" justifyContent="space-between">
                <label>
                    {nls.localize('vuengine/editors/sprite/layers', 'Layers')}
                </label>
                {layers.filter(layer => !layer.isVisible).length > 0 &&
                    <div
                        onClick={showAllLayers}
                        title={nls.localize('vuengine/editors/sprite/ShowAllLayers', 'Show All Layers')}
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
                                title={nls.localize('vuengine/editors/sprite/removeLayer', 'Remove Layer')}
                            >
                                <i className='codicon codicon-x' />
                            </button>
                        }
                        <div style={{ cursor: 'grab' }}>
                            <DotsSixVertical size={16} />
                        </div>
                        <div
                            style={{ cursor: 'pointer' }}
                            onClick={e => {
                                e.stopPropagation();
                                if (layer.isVisible) {
                                    hideDataLayer(layer.id);
                                } else {
                                    showDataLayer(layer.id);
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
                        <div style={{ flexGrow: 1 }}>
                            <Input
                                style={{ boxSizing: 'border-box', width: '100%' }}
                                value={data.layerAttributes[layer.id] && data.layerAttributes[layer.id].name
                                    ? data.layerAttributes[layer.id].name
                                    : ''
                                }
                                setValue={v => setLayerName(layer.id, v as string)}
                                commands={INPUT_BLOCKING_COMMANDS}
                            />
                        </div>
                    </div>
                ))}
                <button
                    className='theia-button add-button'
                    onClick={addDataLayer}
                    title={nls.localizeByDefault('Add')}
                >
                    <i className='codicon codicon-plus' />
                </button>
            </VContainer>
        </VContainer>
    );
}
