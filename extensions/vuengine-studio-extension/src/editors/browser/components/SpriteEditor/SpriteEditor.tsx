/* eslint-disable no-null/no-null */
import { Copy, EyeClosed, HandEye } from '@phosphor-icons/react';
import { Eye } from '@phosphor-icons/react/dist/ssr';
import { nls } from '@theia/core';
import {
    CanvasDataChangeHandler,
    Dotting,
    DottingRef,
    LayerChangeHandler,
    LayerDataForHook,
    PixelModifyItem,
    useHandlers,
    useLayers
} from 'dotting';
import React, { BaseSyntheticEvent, useContext, useEffect, useRef, useState } from 'react';
import { PALETTE_COLORS } from '../../../../core/browser/ves-common-types';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import VContainer from '../Common/VContainer';
import { Displays } from '../Common/VUEngineTypes';
import PaletteSelect from './PaletteSelect';
import SpriteEditorActions from './SpriteEditorActions';
import SpriteEditorCurrentToolSettings from './SpriteEditorCurrentToolSettings';
import SpriteEditorSettings from './SpriteEditorSettings';
import SpriteEditorStatus from './SpriteEditorStatus';
import SpriteEditorTools from './SpriteEditorTools';
import { DEFAULT_SPRITE_SIZE, PLACEHOLDER_LAYER_NAME, SpriteData, SpriteLayersData } from './SpriteEditorTypes';

interface SpriteEditorProps {
    data: SpriteData
    updateData: (data: SpriteData) => void
}

const createEmptyPixelData = (width: number, height: number): PixelModifyItem[][] => {
    const data: PixelModifyItem[][] = [];
    for (let i = 0; i < width; i++) {
        const row: PixelModifyItem[] = [];
        for (let j = 0; j < height; j++) {
            row.push({ rowIndex: i, columnIndex: j, color: '' });
        }
        data.push(row);
    }
    return data;
};

export default function SpriteEditor(props: SpriteEditorProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data, updateData } = props;
    const ref = useRef<DottingRef>(null);
    const {
        addDataChangeListener,
        removeDataChangeListener,
        addLayerChangeEventListener,
        removeLayerChangeEventListener,
    } = useHandlers(ref);
    const {
        addLayer,
        // changeLayerPosition,
        currentLayer,
        hideLayer,
        isolateLayer,
        layers,
        removeLayer,
        // reorderLayersByIds,
        setCurrentLayer,
        showLayer,
    } = useLayers(ref);
    const [draggingSectionId] = useState<string | null>(null);
    const [primaryColor, setPrimaryColor] = useState<number>(3);
    const [secondaryColor, setSecondaryColor] = useState<number>(0);
    const [allowResize, setAllowResize] = useState<boolean>(false);
    const [gridSize, setGridSize] = useState<number>(1);
    // const draggingItemIndex = useRef<number | null>(null);
    // const draggingOverItemIndex = useRef<number | null>(null);

    const setData = (partialData: Partial<SpriteData>): void => {
        updateData({
            ...data,
            ...partialData,
        });
        console.log('data', data, partialData);
    };

    const initLayers = (resolvedLayers: SpriteLayersData): void => {
        Object.values(resolvedLayers).map((rl, i) => {
            console.log('INIT DATA, addLayer', rl.id, i);
            addLayer(rl.id, i, rl.data);
        });
        console.log('INIT DATA', PLACEHOLDER_LAYER_NAME);
        removeLayer(PLACEHOLDER_LAYER_NAME);
        console.log('initData', JSON.stringify(layers));
    };

    const initData = async (): Promise<void> => {
        if (data.layers) {
            const resolvedLayers = data.layers;
            // const resolvedLayers = await services.vesCommonService.uncompressJson(data.layers) as (LayerDataForHook & ExtraSpriteLayerData)[];
            if (resolvedLayers && Object.values(resolvedLayers).length) {
                setData({ layers: resolvedLayers });
                initLayers(resolvedLayers);
                return;
            }
        };

        const newId = services.vesCommonService.nanoid();
        setData({
            layers: {
                [newId]: {
                    id: newId,
                    isVisible: true,
                    data: createEmptyPixelData(
                        data.dimensions?.x || DEFAULT_SPRITE_SIZE,
                        data.dimensions?.y || DEFAULT_SPRITE_SIZE,
                    ),
                    name: nls.localize('vuengine/spriteEditor/layer', 'Layer') + ' 1',
                    parallax: 0,
                    displayMode: Displays.Both,
                }
            }
        });
    };

    const applyPixelChanges = (layerId: string, modifiedPixels: PixelModifyItem[]): void => {
        if (data.layers && data.layers[layerId]) {
            const updatedLayers = { ...data.layers };
            modifiedPixels.map(mp => {
                updatedLayers[layerId].data[mp.rowIndex][mp.columnIndex].color = mp.color;
            });
            setData({ layers: updatedLayers });
        }
    };

    const addDataLayer = (): void => {
        const newLayer = {
            id: services.vesCommonService.nanoid(),
            isVisible: true,
            data: createEmptyPixelData(
                data.dimensions?.x || DEFAULT_SPRITE_SIZE,
                data.dimensions?.y || DEFAULT_SPRITE_SIZE,
            ),
            name: `${nls.localize('vuengine/spriteEditor/layer', 'Layer')} ${layers.length + 1}`,
            parallax: 0,
            displayMode: Displays.Both,
        };
        addLayer(newLayer.id, layers.length);

        const updatedLayers = { ...data.layers };
        updatedLayers[newLayer.id] = newLayer;
        setData({ layers: updatedLayers });
    };

    const hideDataLayer = (layerId: string): void => {
        console.log('hideDataLayer', layerId);

        // dotting layer
        hideLayer(layerId);

        // data layer
        const updatedLayers = { ...data.layers };
        updatedLayers[layerId].isVisible = false;
        setData({ layers: updatedLayers });
    };

    const showDataLayer = (layerId: string): void => {
        console.log('showDataLayer', layerId);

        // dotting layer
        showLayer(layerId);

        // data layer
        const updatedLayers = { ...data.layers };
        updatedLayers[layerId].isVisible = true;
        setData({ layers: updatedLayers });
    };

    const duplicateLayer = (layer: LayerDataForHook, insertPosition: number): void => {
        addLayer(services.vesCommonService.nanoid(), insertPosition, layer.data);
    };

    /*
    const onDragStart = (e: BaseSyntheticEvent, index: number, id: string) => {
        draggingItemIndex.current = index;
        setDraggingSectionId(id);
    };

    const onAvailableItemDragEnter = (e: BaseSyntheticEvent, index: number) => {
        draggingOverItemIndex.current = index;
        const copyListItems = [...data.layers];
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
        reorderLayersByIds(data.layers.map(layer => layer.id));
        setDraggingSectionId(null);
    };

    const onDragOver = (e: BaseSyntheticEvent) => {
        e.preventDefault();
    };
    */

    const onClickHandler = (e: BaseSyntheticEvent, id: string) => {
        setCurrentLayer(id);
    };

    const handlDataChangeHandler: CanvasDataChangeHandler = ({ delta, layerId }) => {
        // console.log('Data change', layerId, delta);
        // update all layers on resize
        if (delta?.addedOrDeletedColumns?.length) {
            // TODO
        }
        if (delta?.addedOrDeletedRows?.length) {
            // TODO
        }
        // update current layer on pixel change
        if (delta?.modifiedPixels?.length) {
            applyPixelChanges(layerId, delta.modifiedPixels);
        }
    };

    const handleLayerChangeHandler: LayerChangeHandler = ({ layers: updatedLayers }) => {
        console.log('updatedLayers', JSON.stringify(updatedLayers));
    };

    useEffect(() => {
        addDataChangeListener(handlDataChangeHandler);
        addLayerChangeEventListener(handleLayerChangeHandler);
        return () => {
            removeDataChangeListener(handlDataChangeHandler);
            removeLayerChangeEventListener(handleLayerChangeHandler);
        };
    }, [data]);

    useEffect(() => {
        initData();
    }, []);

    return (
        <div className="spriteEditor">
            <VContainer
                gap={15}
                style={{
                    maxWidth: 66,
                    minWidth: 66,
                }}
            >
                <div style={{ zIndex: 100 }}>
                    <PaletteSelect
                        data={data}
                        setData={setData}
                        colorMode={data.colorMode}
                        primaryColor={primaryColor}
                        setPrimaryColor={setPrimaryColor}
                        secondaryColor={secondaryColor}
                        setSecondaryColor={setSecondaryColor}
                        dottingRef={ref}
                    />
                </div>
                <VContainer
                    gap={15}
                    overflow='auto'
                    style={{
                        width: 80,
                        zIndex: 100,
                    }}
                >
                    <SpriteEditorActions
                        dottingRef={ref}
                    />
                    <SpriteEditorSettings
                        allowResize={allowResize}
                        setAllowResize={setAllowResize}
                        gridSize={gridSize}
                        setGridSize={setGridSize}
                    />
                    <SpriteEditorTools
                        dottingRef={ref}
                    />
                    <SpriteEditorCurrentToolSettings
                        dottingRef={ref}
                    />
                </VContainer>
            </VContainer>
            <div className='pixel-container'>
                <SpriteEditorStatus
                    dottingRef={ref}
                    style={{
                        bottom: 'var(--padding)',
                        left: 'var(--padding)',
                        position: 'absolute',
                        zIndex: 100,
                    }}
                />
                <Dotting
                    ref={ref}
                    backgroundColor='transparent'
                    brushColor={PALETTE_COLORS[data.colorMode][primaryColor]}
                    defaultPixelColor={PALETTE_COLORS[data.colorMode][0]}
                    gridStrokeColor={services.colorRegistry.getCurrentColor('editor.background')}
                    gridStrokeWidth={gridSize}
                    isGridVisible={gridSize > 0}
                    height={'100%'}
                    initAutoScale={true}
                    initLayers={[{
                        id: PLACEHOLDER_LAYER_NAME,
                        data: createEmptyPixelData(
                            data.dimensions?.x || DEFAULT_SPRITE_SIZE,
                            data.dimensions?.y || DEFAULT_SPRITE_SIZE,
                        )
                    }]}
                    isGridFixed={!allowResize}
                    isPanZoomable={true}
                    maxColumnCount={512}
                    minColumnCount={8}
                    maxRowCount={512}
                    minRowCount={8}
                    minScale={0.05}
                    maxScale={10}
                    resizeUnit={8}
                    width={'100%'}
                    style={{ zIndex: 1 }}
                />
            </div>
            <VContainer
                gap={15}
                style={{
                    maxWidth: 200,
                    minWidth: 200,
                }}
            >
                {/*
                    <VContainer style={{ zIndex: 100 }}>
                        <label>
                            {nls.localize('vuengine/spriteEditor/navigator', 'Navigator')}
                        </label>
                        <VContainer>
                            <Dotting
                                backgroundColor='transparent'
                                defaultPixelColor={PALETTE_COLORS[0]}
                                height={150}
                                initAutoScale={true}
                                isDrawingEnabled={false}
                                isGridFixed={true}
                                isGridVisible={false}
                                isPanZoomable={false}
                                ref={ref}
                                width={'100%'}
                            />
                        </VContainer>
                    </VContainer>
                    */}
                <VContainer style={{ overflowX: 'hidden', overflowY: 'auto', zIndex: 100 }}>
                    {/*
                            <Eye size={20} onClick={showAllLayers} />
                        */}
                    {data.layers && Object.values(data.layers).map((layer, index) => (
                        <div
                            key={layer.id}
                            className={`item layer${currentLayer?.id === layer.id ? ' active' : ''}${draggingSectionId === layer.id ? ' dragging' : ''}`}
                            style={{
                                alignItems: 'center',
                                display: 'flex',
                                gap: 5,
                                justifyContent: 'start',
                                opacity: layer.isVisible ? 1 : 0.5,
                            }}
                            onClick={e => onClickHandler(e, layer.id)}
                            /*
                            onDragStart={e => onDragStart(e, index, layer.id)}
                            onDragEnter={e => onAvailableItemDragEnter(e, index)}
                            onDragEnd={onDragEnd}
                            onDragOver={onDragOver}
                            */
                            draggable
                        >
                            {Object.values(data.layers).length > 1 &&
                                <button
                                    className="remove-button"
                                    onClick={e => {
                                        e.stopPropagation();
                                        removeLayer(layer.id);
                                    }}
                                    title={nls.localize('vuengine/spriteEditor/removeLayer', 'Remove Layer')}
                                >
                                    <i className='codicon codicon-x' />
                                </button>
                            }
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
                                <input
                                    className='theia-input'
                                    style={{ boxSizing: 'border-box', width: '100%' }}
                                    value={layer.name}
                                    readOnly
                                />
                            </div>
                        </div>
                    ))}
                    <button
                        className='theia-button add-button'
                        onClick={addDataLayer}
                        title={nls.localize('vuengine/spriteEditor/addLayer', 'Add Layer')}
                    >
                        <i className='codicon codicon-plus' />
                    </button>
                </VContainer>
            </VContainer>
            <VContainer
                overflow='auto'
                style={{
                    maxWidth: 75,
                    minWidth: 75,
                }}
            >
                <div className='item frame active' style={{ zIndex: 100 }}></div>
                <button
                    className='theia-button add-button'
                    onClick={() => { }}
                    title={nls.localize('vuengine/spriteEditor/addFrame', 'Add Frame')}
                    style={{ zIndex: 100 }}
                >
                    <i className='codicon codicon-plus' />
                </button>
            </VContainer>
        </div>
    );
}
