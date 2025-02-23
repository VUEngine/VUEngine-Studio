/* eslint-disable no-null/no-null */
import { CommonCommands } from '@theia/core/lib/browser';
import {
    CanvasDataChangeHandler,
    Dotting,
    DottingRef,
    LayerProps,
    PixelModifyItem,
    useDotting,
    useHandlers,
    useLayers
} from 'dotting';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ColorMode, PALETTE_COLORS } from '../../../../core/browser/ves-common-types';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import VContainer from '../Common/Base/VContainer';
import PaletteSelect from './Sidebar/PaletteSelect';
import SpriteEditorCurrentToolSettings from './Sidebar/SpriteEditorCurrentToolSettings';
import SpriteEditorFrames from './Sidebar/SpriteEditorFrames';
import SpriteEditorImportExport from './Sidebar/SpriteEditorImportExport';
import SpriteEditorNavigator from './Sidebar/SpriteEditorNavigator';
import SpriteEditorSettings from './Sidebar/SpriteEditorSettings';
import SpriteEditorTools from './Sidebar/SpriteEditorTools';
import SpriteEditorLayers from './SpriteEditorLayers';
import SpriteEditorStatus from './SpriteEditorStatus';
import { SpriteData } from './SpriteEditorTypes';

export const createEmptyPixelData = (width: number, height: number): PixelModifyItem[][] => {
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

interface SpriteEditorProps {
    data: SpriteData
    updateData: (data: SpriteData) => void
}

export default function SpriteEditor(props: SpriteEditorProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data, updateData } = props;
    const [canvasHeight, setCanvasHeight] = useState<number | string>('100%');
    const [canvasWidth, setCanvasWidth] = useState<number | string>('100%');
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const dottingRef = useRef<DottingRef>(null);
    const { undo, redo } = useDotting(dottingRef);
    const {
        addDataChangeListener,
        removeDataChangeListener,
    } = useHandlers(dottingRef);
    const { layers } = useLayers(dottingRef);
    const [primaryColor, setPrimaryColor] = useState<number>(3);
    const [secondaryColor, setSecondaryColor] = useState<number>(0);
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

    const setFrames = (frames: LayerProps[][]): void => {
        setData({ frames });
    };

    const setCurrentFrameData = (frame: LayerProps[]): void => {
        setFrames([
            ...data.frames.slice(0, currentFrame),
            frame,
            ...data.frames.slice(currentFrame + 1)
        ]);
    };

    const setColorMode = (colorMode: ColorMode): void => {
        setData({ colorMode });
    };

    const applyPixelChanges = (layerId: string, modifiedPixels: PixelModifyItem[]): void => {
        /*
        const updatedFrame: LayerProps[] = [];
        data.frames[currentFrame].map(layer => {
            if (layer.id === layerId) {
                modifiedPixels.map(mp => {
                    layer.data[mp.rowIndex][mp.columnIndex].color = mp.color;
                });
            }
            updatedFrame.push(layer);
        });
        */

        setCurrentFrameData(layers);
    };

    const handlDataChangeHandler: CanvasDataChangeHandler = ({ delta, layerId }) => {
        console.log('Data change', layerId, delta);
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

    const dottingElem = useMemo(() => (
        <Dotting
            ref={dottingRef}
            backgroundColor='transparent'
            brushColor={PALETTE_COLORS[data.colorMode][primaryColor]}
            defaultPixelColor={PALETTE_COLORS[data.colorMode][0]}
            gridStrokeColor={services.colorRegistry.getCurrentColor('editor.background')}
            gridStrokeWidth={gridSize}
            isGridVisible={gridSize > 0}
            height={canvasHeight}
            initAutoScale={true}
            initLayers={data.frames[currentFrame]}
            isGridFixed={!allowResize}
            isPanZoomable={true}
            maxColumnCount={512}
            minColumnCount={8}
            maxRowCount={512}
            minRowCount={8}
            minScale={0.05}
            maxScale={10}
            resizeUnit={8}
            width={canvasWidth}
            style={{ zIndex: 1 }}
        />
    ), [
        data.colorMode,
        primaryColor,
        gridSize,
        canvasHeight,
        canvasWidth,
        allowResize,
    ]);

    useEffect(() => {
        addDataChangeListener(handlDataChangeHandler);
        return () => {
            removeDataChangeListener(handlDataChangeHandler);
        };
    }, [data]);

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
        <VContainer className="spriteEditor" gap={15}>
            <HContainer grow={1} justifyContent="space-between" overflow="hidden">
                <VContainer
                    gap={15}
                    style={{
                        maxWidth: 80,
                        minWidth: 80,
                    }}
                >
                    <div style={{ zIndex: 100 }}>
                        <PaletteSelect
                            colorMode={data.colorMode}
                            setColorMode={setColorMode}
                            primaryColorIndex={primaryColor}
                            setPrimaryColorIndex={setPrimaryColor}
                            secondaryColorIndex={secondaryColor}
                            setSecondaryColorIndex={setSecondaryColor}
                            dottingRef={dottingRef}
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
                        <SpriteEditorSettings
                            allowResize={allowResize}
                            setAllowResize={setAllowResize}
                            gridSize={gridSize}
                            setGridSize={setGridSize}
                        />
                        <SpriteEditorTools
                            dottingRef={dottingRef}
                        />
                        <SpriteEditorCurrentToolSettings
                            dottingRef={dottingRef}
                        />
                        <SpriteEditorImportExport
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
                        maxWidth: 200,
                        minWidth: 200,
                        zIndex: 100,
                    }}
                >
                    <SpriteEditorNavigator />
                    <SpriteEditorLayers
                        data={data}
                        updateData={updateData}
                        currentFrame={currentFrame}
                        dottingRef={dottingRef}
                    />
                </VContainer>
            </HContainer >
            <SpriteEditorFrames
                frames={data.frames}
                setFrames={setFrames}
                currentFrame={currentFrame}
                setCurrentFrame={setCurrentFrame}
            />
            <SpriteEditorStatus
                dottingRef={dottingRef}
            />
        </VContainer>
    );
}
