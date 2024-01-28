/* eslint-disable no-null/no-null */
import {
    ArrowsOut,
    CrosshairSimple,
    Eraser,
    EyeClosed,
    FrameCorners,
    GridFour,
    Hand,
    HandEye,
    MagnifyingGlass,
    PaintBucket,
    PencilSimple,
    Selection,
    Trash,
} from '@phosphor-icons/react';
import { Eye } from '@phosphor-icons/react/dist/ssr';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import {
    BrushTool,
    CanvasDataChangeHandler,
    CanvasHoverPixelChangeHandler,
    CanvasInfoChangeHandler,
    Dotting,
    DottingRef,
    PanZoom,
    PixelModifyItem,
    useBrush,
    useDotting,
    useGrids,
    useHandlers,
    useLayers,
} from 'dotting';
import React, { BaseSyntheticEvent, useContext, useEffect, useRef, useState } from 'react';
import { PALETTE_COLORS } from '../../../../core/browser/ves-common-types';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/HContainer';
import VContainer from '../Common/VContainer';
import { SpriteData } from './SpriteEditorTypes';

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
    // const { data, updateData } = props;
    const ref = useRef<DottingRef>(null);
    const { clear, downloadImage, undo, redo } = useDotting(ref);
    const {
        addDataChangeListener,
        removeDataChangeListener,
        addHoverPixelChangeListener,
        removeHoverPixelChangeListener,
        addCanvasElementEventListener,
        removeCanvasElementEventListener,
        addCanvasInfoChangeEventListener,
        removeCanvasInfoChangeEventListener,
    } = useHandlers(ref);
    const { dimensions } = useGrids(ref);
    const { brushTool, changeBrushColor, changeBrushTool } = useBrush(ref);
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
        showLayer,
    } = useLayers(ref);
    const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null);
    const [createdLayerCount, setCreatedLayerCount] = useState<number>(3);
    const [primaryColor, setPrimaryColor] = useState<number>(3);
    const [secondaryColor, setSecondaryColor] = useState<number>(0);
    const [allowResize, setAllowResize] = useState<boolean>(false);
    const [previousBrushTool, setPreviousBrushTool] = useState<BrushTool>(BrushTool.NONE);
    const [gridSize, setGridSize] = useState<number>(1);
    const [hoveredPixel, setHoveredPixel] = useState<{ rowIndex: number; columnIndex: number; } | null>(null);
    const [canvasPanZoom, setCanvasPanZoom] = useState<PanZoom | null>(null);
    const draggingItemIndex = useRef<number | null>(null);
    const draggingOverItemIndex = useRef<number | null>(null);

    const toggleGrid = (): void => {
        if (gridSize > 0) {
            setGridSize(0);
        } else {
            setGridSize(1);
        }
    };

    const bindKeyListeners = (): void => {
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
    };

    const unbindKeyListeners = (): void => {
        document.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('keyup', onKeyUp);
    };

    const onKeyDown = (e: KeyboardEvent): void => {
        if (!e.repeat && e.code === 'Space') {
            setPreviousBrushTool(brushTool);
            changeBrushTool(BrushTool.NONE);
        }
        if (!e.repeat && e.code === 'KeyX') {
            const secColor = secondaryColor;
            setSecondaryColor(primaryColor);
            setPrimaryColor(secColor);
        }
    };

    const onKeyUp = (e: KeyboardEvent): void => {
        if (!e.repeat && e.code === 'Space') {
            changeBrushTool(previousBrushTool);
        }
    };

    /*
    const updateSpriteData = (updatedData: Partial<SpriteData>): void => {
        updateData({ ...data, ...updatedData });
    };

    const updateName = (name: string): void => {
        updateSpriteData({ name });
    };
    */

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

    const handlDataChangeHandler: CanvasDataChangeHandler = ({ delta }) => {
        // console.log('Data change', delta);
    };

    const handleHoverPixelChangeHandler: CanvasHoverPixelChangeHandler = ({ indices }) => {
        setHoveredPixel(indices);
    };

    const handleCanvasInfoChangeHandler: CanvasInfoChangeHandler = ({ panZoom }) => {
        setCanvasPanZoom(panZoom);
    };

    useEffect(() => {
        addDataChangeListener(handlDataChangeHandler);
        addHoverPixelChangeListener(handleHoverPixelChangeHandler);
        addCanvasInfoChangeEventListener(handleCanvasInfoChangeHandler);
        return () => {
            removeDataChangeListener(handlDataChangeHandler);
            removeHoverPixelChangeListener(handleHoverPixelChangeHandler);
            removeCanvasInfoChangeEventListener(handleCanvasInfoChangeHandler);
        };
    }, []);

    useEffect(() => {
        const handleMouseDown = (e: MouseEvent) => {
            if (e.buttons === 2) {
                changeBrushColor(PALETTE_COLORS[secondaryColor]);
            }
        };
        const handleMouseUp = (e: MouseEvent) => {
            changeBrushColor(PALETTE_COLORS[primaryColor]);
        };
        addCanvasElementEventListener('mousedown', handleMouseDown);
        addCanvasElementEventListener('mouseup', handleMouseUp);
        return () => {
            removeCanvasElementEventListener('mousedown', handleMouseDown);
            removeCanvasElementEventListener('mouseup', handleMouseUp);
        };
    }, [primaryColor, secondaryColor]);

    useEffect(() => {
        bindKeyListeners();
        return () => {
            unbindKeyListeners();
        };
    }, [brushTool, secondaryColor, primaryColor]);

    return (
        <VContainer gap={15} className="spriteEditor">
            <HContainer alignItems='stretch' gap={15} grow={1} overflow='hidden'>
                <VContainer gap={15} style={{ width: 73 }}>
                    <HContainer gap={2} wrap='wrap' style={{ zIndex: 100 }}>
                        <div
                            className={`tool ${primaryColor === 3 ? 'active' : undefined}`}
                            style={{ backgroundColor: PALETTE_COLORS[3] }}
                            onClick={() => setPrimaryColor(3)}
                            onContextMenu={() => setSecondaryColor(3)}
                        >
                            {primaryColor === 3 && 'L'}
                            {secondaryColor === 3 && 'R'}
                        </div>
                        <div
                            className={`tool ${primaryColor === 2 ? 'active' : undefined}`}
                            style={{ backgroundColor: PALETTE_COLORS[2] }}
                            onClick={() => setPrimaryColor(2)}
                            onContextMenu={() => setSecondaryColor(2)}
                        >
                            {primaryColor === 2 && 'L'}
                            {secondaryColor === 2 && 'R'}
                        </div>
                        <div
                            className={`tool ${primaryColor === 1 ? 'active' : undefined}`}
                            style={{ backgroundColor: PALETTE_COLORS[1] }}
                            onClick={() => setPrimaryColor(1)}
                            onContextMenu={() => setSecondaryColor(1)}
                        >
                            {primaryColor === 1 && 'L'}
                            {secondaryColor === 1 && 'R'}
                        </div>
                        <div
                            className={`tool ${primaryColor === 0 ? 'active' : undefined}`}
                            style={{ backgroundColor: PALETTE_COLORS[0] }}
                            onClick={() => setPrimaryColor(0)}
                            onContextMenu={() => setSecondaryColor(0)}
                        >
                            {primaryColor === 0 && 'L'}
                            {secondaryColor === 0 && 'R'}
                        </div>
                    </HContainer>
                    <HContainer gap={2} wrap='wrap' style={{ zIndex: 100 }}>
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
                            onClick={undo}
                        >
                            <i className='codicon codicon-zoom-in' />
                        </div>
                        <div
                            className='tool'
                        >
                            <i className='codicon codicon-zoom-out' />
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
                    <HContainer gap={2} wrap='wrap' style={{ zIndex: 100 }}>
                        <div
                            className={`tool${gridSize > 0 ? ' active' : ''}`}
                            onClick={toggleGrid}
                        >
                            <GridFour size={20} />
                        </div>
                        <div
                            className={`tool${allowResize ? ' active' : ''}`}
                            onClick={() => setAllowResize(!allowResize)}
                        >
                            <ArrowsOut size={20} />
                        </div>
                    </HContainer>
                    <HContainer gap={2} wrap='wrap' style={{ zIndex: 100 }}>
                        <div
                            className={`tool${brushTool === BrushTool.NONE ? ' active' : ''}`}
                            onClick={() => changeBrushTool(BrushTool.NONE)}
                        >
                            <Hand size={20} />
                        </div>
                        <div
                            className={`tool${brushTool === BrushTool.DOT ? ' active' : ''}`}
                            onClick={() => changeBrushTool(BrushTool.DOT)}
                        >
                            <PencilSimple size={20} />
                        </div>
                        <div
                            className={`tool${brushTool === BrushTool.ERASER ? ' active' : ''}`}
                            onClick={() => changeBrushTool(BrushTool.ERASER)}
                        >
                            <Eraser size={20} />
                        </div>
                        <div
                            className={`tool${brushTool === BrushTool.PAINT_BUCKET ? ' active' : ''}`}
                            onClick={() => changeBrushTool(BrushTool.PAINT_BUCKET)}
                        >
                            <PaintBucket size={20} />
                        </div>
                        {/*
                        <div
                            className={`tool ${brushTool === BrushTool.STROKE ? 'active' : undefined}`}
                            onClick={() => changeBrushTool(BrushTool.STROKE)}
                        >
                            <PencilSimpleLine size={20} />
                        </div>
                        <div
                            className={`tool ${brushTool === BrushTool.SQUARE ? 'active' : undefined}`}
                            onClick={() => changeBrushTool(BrushTool.SQUARE)}
                        >
                            <Square size={20} />
                        </div>
                        <div
                            className={`tool ${brushTool === BrushTool.CIRCLE ? 'active' : undefined}`}
                            onClick={() => changeBrushTool(BrushTool.CIRCLE)}
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
                    <div className='editorContainer'>
                        <Dotting
                            ref={ref}
                            backgroundColor='transparent'
                            brushColor={PALETTE_COLORS[primaryColor]}
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
                        />
                    </div>
                </VContainer>
                <VContainer gap={15} style={{ width: 200 }}>
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
                        {layers.map((layer, index) => (
                            <div
                                key={layer.id}
                                className={`item layer ${currentLayer.id === layer.id ? 'active' : undefined} ${draggingSectionId === layer.id ? 'dragging' : undefined}`}
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
                                <div style={{ flexGrow: 1 }}>
                                    <input
                                        className='theia-input'
                                        style={{ boxSizing: 'border-box', width: '100%' }}
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
                                addLayer('layer' + (createdLayerCount + 1), layers.length);
                                setCreatedLayerCount(createdLayerCount + 1);
                            }}
                            title={nls.localize('vuengine/spriteEditor/addLayer', 'Add Layer')}
                        >
                            <i className='codicon codicon-plus' />
                        </button>
                    </VContainer>
                    <VContainer grow={1} justifyContent='end'>
                        <VContainer style={{ zIndex: 100 }}>
                            <HContainer alignItems='center' gap={2}>
                                <MagnifyingGlass /> {canvasPanZoom && (Math.round(canvasPanZoom.scale * 100) / 100)}
                            </HContainer>
                            <HContainer>
                                <HContainer alignItems='center' gap={2}>
                                    <FrameCorners /> {dimensions.columnCount}×{dimensions.rowCount}
                                </HContainer>
                                <HContainer alignItems='center' gap={2}>
                                    {hoveredPixel && <>
                                        <CrosshairSimple /> {hoveredPixel.columnIndex + 1}
                                        :
                                        {hoveredPixel.rowIndex + 1}
                                    </>}
                                </HContainer>
                            </HContainer>
                            {/*
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
                                    {nls.localize('vuengine/entityEditor/grid', 'Grid')}
                                </label>
                                <RadioSelect
                                    options={[{ value: 0 }, { value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }]}
                                    defaultValue={gridSize}
                                    onChange={options => setGridSize(options[0].value as number)}
                                />
                            </VContainer>
                            */}
                        </VContainer>
                    </VContainer>
                </VContainer>
            </HContainer>
            <HContainer overflow='auto' style={{ minHeight: 75, zIndex: 100 }}>
                <div className='item frame active'></div>
                <button
                    className='theia-button add-button'
                    onClick={() => { }}
                    title={nls.localize('vuengine/spriteEditor/addFrame', 'Add Frame')}
                >
                    <i className='codicon codicon-plus' />
                </button>
            </HContainer>
        </VContainer>
    );
}
