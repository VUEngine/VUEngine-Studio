/* eslint-disable no-null/no-null */
import { CommonCommands } from '@theia/core/lib/browser';
import {
    CanvasDataChangeHandler,
    Dotting,
    DottingRef,
    LayerProps,
    PixelModifyItem,
    useDotting,
    useHandlers
} from 'dotting';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ColorMode, PALETTE_COLORS, PALETTE_INDICES } from '../../../../core/browser/ves-common-types';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import VContainer from '../Common/Base/VContainer';
import { PixelEditorCommands } from './PixelEditorCommands';
import PixelEditorLayers from './PixelEditorLayers';
import PixelEditorStatus from './PixelEditorStatus';
import { LayerPixelData, SpriteData } from './PixelEditorTypes';
import PaletteSelect from './Sidebar/PaletteSelect';
import PixelEditorActions from './Sidebar/PixelEditorActions';
import PixelEditorCurrentToolSettings from './Sidebar/PixelEditorCurrentToolSettings';
import PixelEditorNavigator from './Sidebar/PixelEditorNavigator';
import PixelEditorTools from './Sidebar/PixelEditorTools';
import PixelEditorFrames from './PixelEditorFrames';

export const createEmptyPixelData = (width: number, height: number): (number | null)[][] => {
    const data: (number | null)[][] = [];
    for (let i = 0; i < width; i++) {
        const row: (number | null)[] = [];
        for (let j = 0; j < height; j++) {
            row.push(null);
        }
        data.push(row);
    }
    return data;
};

export const convertLayerPixelDataToPixelModifyItem = (layerProps: LayerPixelData, colorMode: ColorMode): PixelModifyItem[][] =>
    layerProps.data.map((row, rowIndex) => row.map((color, columnIndex) => ({
        rowIndex,
        columnIndex,
        color: color === null ? '' : PALETTE_COLORS[colorMode][color],
    })));

export const convertToLayerProps = (frame: LayerPixelData[], colorMode: ColorMode): LayerProps[] => frame.map(layer => ({
    id: layer.id,
    data: convertLayerPixelDataToPixelModifyItem(layer, colorMode),
}));

interface PixelEditorProps {
    data: SpriteData
    updateData: (data: SpriteData) => void
}

export default function PixelEditor(props: PixelEditorProps): React.JSX.Element {
    const { enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const { data, updateData } = props;
    const [canvasHeight, setCanvasHeight] = useState<number | string>('100%');
    const [canvasWidth, setCanvasWidth] = useState<number | string>('100%');
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const dottingRef = useRef<DottingRef>(null);
    const { undo, redo } = useDotting(dottingRef);
    const { addDataChangeListener, removeDataChangeListener } = useHandlers(dottingRef);
    const [primaryColorIndex, setPrimaryColorIndex] = useState<number>(4);
    const [secondaryColorIndex, setSecondaryColorIndex] = useState<number>(0);
    const [currentFrame, setCurrentFrame] = useState<number>(0);
    const [allowResize, setAllowResize] = useState<boolean>(false);
    const [gridSize, setGridSize] = useState<number>(1);

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case CommonCommands.UNDO.id:
                undo();
                break;
            case CommonCommands.REDO.id:
                redo();
                break;
        }
    };

    const setData = (partialData: Partial<SpriteData>): void => {
        updateData({
            ...data,
            ...partialData,
        });
    };

    const setFrames = (frames: LayerPixelData[][]): void => {
        setData({
            dimensions: { ...data.dimensions }, // Hack to force a state update
            frames
        });
    };

    const setCurrentFrameData = (updatedFrame: LayerPixelData[]): void => {
        const updatedFrames = [...data.frames];
        updatedFrames[currentFrame] = updatedFrame;

        setFrames(updatedFrames);
    };

    const setColorMode = (colorMode: ColorMode): void => {
        setData({ colorMode });

        // TODO: when set to frame blend, trim all layer heights for all frames if > 256
    };

    /*
    const applyPixelChanges = (layerId: string, modifiedPixels: PixelModifyItem[]): void => {
        const updatedFrame: LayerPixelData[] = [];
        data.frames[currentFrame].forEach(layer => {
            const updatedLayer = { ...layer };
            if (updatedLayer.id === layerId) {
                modifiedPixels.forEach(mp => {
                    updatedLayer.data[mp.rowIndex][mp.columnIndex] = mp.color === '' ? null : PALETTE_INDICES[data.colorMode][mp.color];
                });
            }
            updatedFrame.push(updatedLayer);
        });

        setCurrentFrameData(updatedFrame);
    };
    */

    const dataChangeHandler: CanvasDataChangeHandler = change => {
        // console.log('Data change', change);
        if (!change.isLocalChange) {
            return;
        }

        const updatedData: Partial<SpriteData> = {};

        if (change.delta?.addedOrDeletedColumns?.length || change.delta?.addedOrDeletedRows?.length || change.delta?.modifiedPixels?.length) {
            const columnsAdded = change.delta?.addedOrDeletedColumns?.filter(c => c.isDelete === false).length ?? 0;
            const columnsRemoved = change.delta?.addedOrDeletedColumns?.filter(c => c.isDelete === true).length ?? 0;
            const rowsAdded = change.delta?.addedOrDeletedRows?.filter(r => r.isDelete === false).length ?? 0;
            const rowsRemoved = change.delta?.addedOrDeletedRows?.filter(r => r.isDelete === true).length ?? 0;
            updatedData.dimensions = {
                x: data.dimensions.x + columnsAdded - columnsRemoved,
                y: data.dimensions.y + rowsAdded - rowsRemoved,
            };

            const updatedFrames = [...data.frames];
            updatedFrames[currentFrame] = [
                ...updatedFrames[currentFrame].map((layer, index) => ({
                    ...data.frames[currentFrame].find(l => l.id === change.layerId)!,
                    data: [...change.data].sort((a, b) => {
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
                }))];

            // TODO: update all frames' layers on resize

        }

        // console.log('updatedData', updatedData);
        if (Object.keys(updatedData).length > 0) {
            // console.log('--- SET DATA ---');
            setData(updatedData);
        }
    };

    const dottingElem = useMemo(() => (
        <Dotting
            ref={dottingRef}
            backgroundColor='transparent'
            brushColor={PALETTE_COLORS[data.colorMode][primaryColorIndex]}
            defaultPixelColor="#111" // {PALETTE_COLORS[data.colorMode][0]}
            gridStrokeColor="#222"
            gridStrokeWidth={gridSize}
            isGridVisible={gridSize > 0}
            height={canvasHeight}
            initAutoScale={true}
            initLayers={convertToLayerProps(data.frames[currentFrame], data.colorMode)}
            isGridFixed={!allowResize}
            isPanZoomable={true}
            maxColumnCount={512}
            minColumnCount={8}
            maxRowCount={data.colorMode === ColorMode.FrameBlend ? 256 : 512}
            minRowCount={8}
            minScale={0.05}
            maxScale={10}
            resizeUnit={8}
            width={canvasWidth}
            style={{ zIndex: 1 }}
        />
    ), [
        data.colorMode,
        gridSize,
        canvasHeight,
        canvasWidth,
        allowResize
    ]);

    useEffect(() => {
        enableCommands([
            ...Object.values(PixelEditorCommands).map(c => c.id)
        ]);
    }, []);

    useEffect(() => {
        addDataChangeListener(dataChangeHandler);
        return () => {
            removeDataChangeListener(dataChangeHandler);
        };
    }, [
        currentFrame,
        data
    ]);

    useEffect(() => {
        if (!canvasContainerRef.current) {
            return;
        }
        const resizeObserver = new ResizeObserver(() => {
            setCanvasWidth(canvasContainerRef.current?.clientWidth ?? canvasHeight);
            setCanvasHeight(canvasContainerRef.current?.clientHeight ?? canvasWidth);
        });
        resizeObserver.observe(canvasContainerRef.current);
        return () => resizeObserver.disconnect();
    }, [
        canvasContainerRef
    ]);

    useEffect(() => {
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, []);

    return (
        <VContainer
            className="pixelEditor"
            gap={15}
            alignItems="start"
        >
            <HContainer
                alignItems="start"
                grow={1}
                justifyContent="space-between"
                overflow="hidden"
                style={{
                    width: '100%'
                }}
            >
                <VContainer
                    gap={15}
                    style={{
                        height: '100%',
                        maxWidth: 81,
                        minWidth: 81,
                    }}
                >
                    <div style={{ zIndex: 100 }}>
                        <PaletteSelect
                            colorMode={data.colorMode}
                            setColorMode={setColorMode}
                            primaryColorIndex={primaryColorIndex}
                            setPrimaryColorIndex={setPrimaryColorIndex}
                            secondaryColorIndex={secondaryColorIndex}
                            setSecondaryColorIndex={setSecondaryColorIndex}
                            includeTransparent={true}
                            dottingRef={dottingRef}
                        />
                    </div>
                    <VContainer
                        gap={15}
                        overflow='auto'
                        style={{
                            width: 81,
                            zIndex: 100,
                        }}
                    >
                        <PixelEditorTools
                            dottingRef={dottingRef}
                        />
                        <PixelEditorCurrentToolSettings
                            dottingRef={dottingRef}
                        />
                        <PixelEditorActions
                            colorMode={data.colorMode}
                            dottingRef={dottingRef}
                        />
                    </VContainer>
                </VContainer>
                <div
                    className='pixel-container'
                    ref={canvasContainerRef}
                >
                    {dottingElem}
                </div>
                <VContainer
                    gap={15}
                    overflow="hidden"
                    style={{
                        height: '100%',
                        maxWidth: 240,
                        minWidth: 240,
                        zIndex: 100,
                    }}
                >
                    <PixelEditorNavigator
                        data={data}
                        currentFrame={currentFrame}
                        dottingRef={dottingRef}
                    />
                    <PixelEditorLayers
                        data={data}
                        updateData={updateData}
                        currentFrame={currentFrame}
                        setCurrentFrameData={setCurrentFrameData}
                        dottingRef={dottingRef}
                    />
                </VContainer>
            </HContainer>
            <PixelEditorFrames
                frames={data.frames}
                setFrames={setFrames}
                currentFrame={currentFrame}
                setCurrentFrame={setCurrentFrame}
                colorMode={data.colorMode}
                dottingRef={dottingRef}
            />
            <PixelEditorStatus
                allowResize={allowResize}
                setAllowResize={setAllowResize}
                gridSize={gridSize}
                setGridSize={setGridSize}
                dottingRef={dottingRef}
            />
        </VContainer>
    );
}
