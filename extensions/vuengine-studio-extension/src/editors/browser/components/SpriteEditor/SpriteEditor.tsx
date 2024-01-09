/* eslint-disable no-null/no-null */
import { Eraser, EyeClosed, Hand, HandEye, PaintBucket, PencilSimple, Selection, Trash } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import { BrushTool, Dotting, DottingRef, PixelModifyItem, useBrush, useDotting, useGrids, useLayers } from 'dotting';
import React, { BaseSyntheticEvent, useContext, useRef, useState } from 'react';
import { PALETTE_COLORS } from '../../../../core/browser/ves-common-types';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/HContainer';
import VContainer from '../Common/VContainer';
import { SpriteData } from './SpriteEditorTypes';
import RadioSelect from '../Common/RadioSelect';
import { Eye } from '@phosphor-icons/react/dist/ssr';

interface SpriteEditorProps {
    data: SpriteData
    updateData: (data: SpriteData) => void
}

const CreateEmptySquareData = (
    size: number,
): PixelModifyItem[][] => {
    const data: PixelModifyItem[][] = [];
    for (let i = 0; i < size; i++) {
        const row: PixelModifyItem[] = [];
        for (let j = 0; j < size; j++) {
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
    const { clear, downloadImage, undo, redo } = useDotting(ref);
    const { dimensions } = useGrids(ref);
    // const { addDataChangeListener } = useHandlers(ref);
    const { brushColor, brushTool, changeBrushColor, changeBrushTool } = useBrush(ref);
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
    } = useLayers(ref);
    const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
    const [createdLayerCount, setCreatedLayerCount] = useState<number>(3);
    const [gridSize, setGridSize] = useState<number>(1);
    const draggingItemIndex = useRef<number | null>(null);
    const draggingOverItemIndex = useRef<number | null>(null);

    const updateSpriteData = (updatedData: Partial<SpriteData>): void => {
        updateData({ ...data, ...updatedData });
    };

    const updateName = (name: string): void => {
        updateSpriteData({ name });
    };

    const updateWidth = (width: number): void => {
        // TODO
    };

    const updateHeight = (width: number): void => {
        // TODO
    };

    const confirmClear = async (): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/spriteEditor/clear', 'Clear'),
            msg: nls.localize('vuengine/spriteEditor/areYouSureYouWantToClear', 'Are you sure you want to clear the entire canvas?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            clear();
        }
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
        e.stopPropagation();
        setCurrentLayer(id);
    };

    return (
        <VContainer gap={15} className="spriteEditor">
            <HContainer alignItems='stretch' gap={15} grow={1} overflow='hidden' style={{ /* position: 'relative' */ }}>
                <VContainer gap={15} style={{ width: 73 /* position: 'absolute', top: 0, left: 0, zIndex: 100 */ }}>
                    <HContainer gap={2} wrap='wrap'>
                        <div
                            className={`tool ${brushColor === PALETTE_COLORS[3] ? 'active' : undefined}`}
                            style={{ backgroundColor: PALETTE_COLORS[3] }}
                            onClick={() => changeBrushColor(PALETTE_COLORS[3])}
                        >
                            {brushColor === PALETTE_COLORS[3] && 'L'}
                        </div>
                        <div
                            className={`tool ${brushColor === PALETTE_COLORS[2] ? 'active' : undefined}`}
                            style={{ backgroundColor: PALETTE_COLORS[2] }}
                            onClick={() => changeBrushColor(PALETTE_COLORS[2])}
                        >
                            {brushColor === PALETTE_COLORS[2] && 'L'}
                        </div>
                        <div
                            className={`tool ${brushColor === PALETTE_COLORS[1] ? 'active' : undefined}`}
                            style={{ backgroundColor: PALETTE_COLORS[1] }}
                            onClick={() => changeBrushColor(PALETTE_COLORS[1])}
                        >
                            {brushColor === PALETTE_COLORS[1] && 'L'}
                        </div>
                        <div
                            className={`tool ${brushColor === PALETTE_COLORS[0] ? 'active' : undefined}`}
                            style={{ backgroundColor: PALETTE_COLORS[0] }}
                            onClick={() => changeBrushColor(PALETTE_COLORS[0])}
                        >
                            {brushColor === PALETTE_COLORS[0] && 'L'}
                        </div>
                    </HContainer>
                    <HContainer gap={2} wrap='wrap'>
                        <div
                            className='tool'
                            onClick={undo}
                        >
                            <i className='codicon codicon-discard' />
                        </div>
                        <div
                            className='tool'
                            onClick={redo}
                        >
                            <i className='codicon codicon-redo' />
                        </div>
                        <div
                            className='tool'
                            onClick={() => downloadImage({
                                type: 'png',
                                isGridVisible: false,
                            })}
                        >
                            <i className='codicon codicon-device-camera' />
                        </div>
                        <div
                            className='tool'
                            onClick={confirmClear}
                        >
                            <Trash size={20} />
                        </div>
                    </HContainer>
                    <HContainer gap={2} wrap='wrap'>
                        <div
                            className={`tool ${brushTool === BrushTool.NONE ? 'active' : undefined}`}
                            onClick={() => changeBrushTool(BrushTool.NONE)}
                        >
                            <Hand size={20} />
                        </div>
                        <div
                            className={`tool ${brushTool === BrushTool.DOT ? 'active' : undefined}`}
                            onClick={() => changeBrushTool(BrushTool.DOT)}
                        >
                            <PencilSimple size={20} />
                        </div>
                        <div
                            className={`tool ${brushTool === BrushTool.ERASER ? 'active' : undefined}`}
                            onClick={() => changeBrushTool(BrushTool.ERASER)}
                        >
                            <Eraser size={20} />
                        </div>
                        <div
                            className={`tool ${brushTool === BrushTool.PAINT_BUCKET ? 'active' : undefined}`}
                            onClick={() => changeBrushTool(BrushTool.PAINT_BUCKET)}
                        >
                            <PaintBucket size={20} />
                        </div>
                        {/*
                        <div
                            className={`tool ${brushTool === BrushTool.PAINT_BUCKET ? 'active' : undefined}`}
                            onClick={() => changeBrushTool(BrushTool.PAINT_BUCKET)}
                        >
                            <PencilSimpleLine size={20} />
                        </div>
                        <div
                            className={`tool ${brushTool === BrushTool.PAINT_BUCKET ? 'active' : undefined}`}
                            onClick={() => changeBrushTool(BrushTool.PAINT_BUCKET)}
                        >
                            <Square size={20} />
                        </div>
                        <div
                            className={`tool ${brushTool === BrushTool.PAINT_BUCKET ? 'active' : undefined}`}
                            onClick={() => changeBrushTool(BrushTool.PAINT_BUCKET)}
                        >
                            <Circle size={20} />
                        </div>
                        */}
                        <div
                            className={`tool ${brushTool === BrushTool.SELECT ? 'active' : undefined}`}
                            onClick={() => changeBrushTool(BrushTool.SELECT)}
                        >
                            <Selection size={20} />
                        </div>
                    </HContainer>
                </VContainer>
                <VContainer grow={1}>
                    <Dotting
                        backgroundColor='transparent'
                        brushColor={PALETTE_COLORS[3]}
                        defaultPixelColor={PALETTE_COLORS[0]}
                        gridStrokeColor={services.colorRegistry.getCurrentColor('editor.background')}
                        gridStrokeWidth={gridSize}
                        isGridVisible={gridSize > 0}
                        height={'100%'}
                        initAutoScale={true}
                        initLayers={[
                            {
                                id: 'layer1',
                                data: CreateEmptySquareData(32),
                            },
                            {
                                id: 'layer2',
                                data: CreateEmptySquareData(32),
                            },
                            {
                                id: 'layer3',
                                data: CreateEmptySquareData(32),
                            },
                        ]}
                        isGridFixed={false}
                        isPanZoomable={true}
                        maxScale={10}
                        minScale={0.2}
                        ref={ref}
                        width={'100%'}
                    />
                </VContainer>
                <VContainer gap={15} style={{ /* position: 'absolute', top: 0, right: 0, zIndex: 100 */ }}>
                    {/*
                    <label>
                        {nls.localize('vuengine/spriteEditor/layers', 'Navigator')}
                    </label>
                    <VContainer>
                        <Dotting
                            backgroundColor='transparent'
                            defaultPixelColor={PALETTE_COLORS[0]}
                            height={180}
                            initAutoScale={true}
                            isDrawingEnabled={false}
                            isGridFixed={true}
                            isGridVisible={false}
                            isPanZoomable={false}
                            ref={ref}
                            width={'100%'}
                        />
                    </VContainer>
                    */}
                    <VContainer style={{ overflowX: 'hidden', overflowY: 'auto' }}>
                        <label>
                            <Eye size={20} onClick={showAllLayers} />
                            {nls.localize('vuengine/spriteEditor/layers', 'Layers')}
                        </label>
                        <VContainer>
                            {layers.map((layer, index) => (
                                <div
                                    key={layer.id}
                                    className={`layer ${currentLayer.id === layer.id ? 'active' : undefined} ${draggingSectionId === layer.id ? 'dragging' : undefined}`}
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
                                    <div
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
                                            ? <Eye size={20} />
                                            : <EyeClosed size={20} />
                                        }
                                    </div>
                                    <div
                                        onClick={() => {
                                            isolateLayer(layer.id);
                                        }}
                                    >
                                        <HandEye size={20} />
                                    </div>
                                    <div>
                                        <input
                                            className='theia-input'
                                            style={{ flexGrow: 1 }}
                                            value={layer.id}
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <div
                                            onClick={e => {
                                                e.stopPropagation();
                                                removeLayer(layer.id);
                                            }}
                                        >
                                            <i className='codicon codicon-x' />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button
                                className='theia-button add-button'
                                onClick={() => {
                                    addLayer(
                                        nls.localize('vuengine/spriteEditor/layers', 'Layers') + ' ' + (createdLayerCount + 1),
                                        layers.length
                                    );
                                    setCreatedLayerCount(createdLayerCount + 1);
                                }}
                                title={nls.localize('vuengine/spriteEditor/addLayer', 'Add Layer')}
                            >
                                <i className='codicon codicon-plus' />
                            </button>
                        </VContainer>
                    </VContainer>
                    <VContainer grow={1} justifyContent='end'>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/spriteEditor/name', 'Name')}
                            </label>
                            <input
                                className='theia-input'
                                style={{ flexGrow: 1 }}
                                value={data.name}
                                onChange={e => updateName(e.target.value)}
                            />
                        </VContainer>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/spriteEditor/dimensions', 'Dimensions')}
                            </label>
                            <HContainer alignItems='center'>
                                <input
                                    className='theia-input'
                                    type='number'
                                    style={{ flexGrow: 1 }}
                                    min={8}
                                    max={512}
                                    step={8}
                                    value={dimensions.columnCount}
                                    onChange={e => updateWidth(parseInt(e.target.value))}
                                />
                                ×
                                <input
                                    className='theia-input'
                                    type='number'
                                    style={{ flexGrow: 1 }}
                                    min={8}
                                    max={512}
                                    step={8}
                                    value={dimensions.rowCount}
                                    onChange={e => updateHeight(parseInt(e.target.value))}
                                />
                            </HContainer>
                        </VContainer>
                        <VContainer>
                            <label>
                                {nls.localize('vuengine/entityEditor/grid', 'Grid')}
                            </label>
                            <RadioSelect
                                options={[{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }]}
                                defaultValue={gridSize}
                                onChange={options => setGridSize(options[0].value as number)}
                            />
                        </VContainer>
                    </VContainer>
                </VContainer>
            </HContainer >
        </VContainer >
    );
}
