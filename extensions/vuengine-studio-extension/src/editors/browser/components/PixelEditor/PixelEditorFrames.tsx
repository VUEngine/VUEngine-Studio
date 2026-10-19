import { DotsSixVertical } from '@phosphor-icons/react';
import { deepClone, nls } from '@theia/core';
import { DottingRef, useDotting } from '../Common/Dotting';
import React, { useEffect } from 'react';
import SortableList, { SortableItem, SortableKnob } from 'react-easy-sort';
import styled from 'styled-components';
import { ColorMode } from '../../../../core/browser/ves-common-types';
import CanvasImage from '../Common/CanvasImage';
import { arrayMove } from '../Common/Utils';
import { DisplayMode } from '../Common/VUEngineTypes';
import { convertToLayerProps } from './PixelEditor';
import { LayerPixelData } from './PixelEditorTypes';

const FramesContainer = styled.div`
    align-items: start;
    display: flex;
    flex-direction: column;
    gap: 5px;
    justify-content: end;
    overflow: hidden;
    max-width: 100%;
    min-height: 100px;

    .frames-list {
        display: flex;
        flex-flow: wrap;
        gap: 5px;
        overflow: auto;
        max-height: 155px;
        padding: 2px;
        user-select: none;
        z-index: 100;
    }
`;

const Frame = styled.div`
    background-color: var(--theia-editorGroupHeader-tabsBackground);
    border: 1px solid var(--theia-dropdown-border);
    border-radius: 2px;
    box-sizing: border-box;
    cursor: pointer;
    max-height: 75px;
    max-width: 50px;
    min-height: 75px;
    min-width: 50px;
    padding: 28px 3px 3px !important;
    position: relative;

    canvas {
        border: 1px solid var(--theia-dropdown-border) !important;
        border-radius: 2px;
        box-sizing: border-box;
        height: 100%;
        object-fit: contain;
        width: 100%;
    }

    &.dragging {
        border-color: var(--theia-focusBorder);
        font-size: var(--theia-ui-font-size1);

        .remove-button {
            display: none;
        }
    }
`;

const DropTarget = styled.div`
    border: 1px dotted var(--theia-dropdown-border);
    border-radius: 2px;
    box-sizing: border-box;
    max-height: 75px;
    max-width: 50px;
    min-height: 75px;
    min-width: 50px;
`;

const FrameIndex = styled.div`
    cursor: grab;
    display: flex;
    left: 2px;
    position: absolute;
    top: 7px;
`;

export const mergeLayers = (layers: LayerPixelData[]): number[][] => {
    if (!layers) {
        return [];
    }

    const result: number[][] = [];
    const height = layers[0].data.length;
    const width = layers[0].data[0].length;

    // initialize as all black
    for (let i = 0; i < height; i++) {
        const row: number[] = [];
        for (let j = 0; j < width; j++) {
            row.push(0);
        }
        result.push(row);
    }

    deepClone(layers).reverse().forEach(layer => {
        if (layer.isVisible === false) {
            return;
        }

        layer.data.forEach((row, rowIndex) => row.forEach((color, columnIndex) => {
            if (color !== null) {
                if (result[rowIndex] !== undefined && result[rowIndex][columnIndex] !== undefined) {
                    result[rowIndex][columnIndex] = color;
                }
            }
        }));
    });

    return result;
};

interface PixelEditorFramesProps {
    frames: LayerPixelData[][]
    setFrames: (frames: LayerPixelData[][]) => void
    currentFrame: number
    setCurrentFrame: React.Dispatch<React.SetStateAction<number>>
    colorMode: ColorMode
    canvasReload: number
    reloadCanvas: () => void
    dottingRef: React.RefObject<DottingRef>
}

export default function PixelEditorFrames(props: PixelEditorFramesProps): React.JSX.Element {
    const { frames, setFrames, currentFrame, setCurrentFrame, colorMode, canvasReload, reloadCanvas, dottingRef } = props;
    const { setLayers } = useDotting(dottingRef);

    const removeFrame = (index: number): void => {
        const updatedFrames = frames.filter((_, i) => i !== index);
        const updatedCurrentFrame = Math.max(0, Math.min(
            index < currentFrame ? currentFrame - 1 : currentFrame,
            updatedFrames.length - 1,
        ));

        setCurrentFrame(updatedCurrentFrame);
        setFrames(updatedFrames);
        reloadCanvas();
    };

    const addFrame = (): void => {
        setFrames([
            ...frames,
            deepClone(frames[frames.length - 1]),
        ]);
        setCurrentFrame(frames.length);
    };

    const onSortEnd = (oldIndex: number, newIndex: number): void => {
        setFrames(arrayMove(frames, oldIndex, newIndex));

        if (currentFrame === oldIndex) {
            setCurrentFrame(newIndex);
        } else if (oldIndex < currentFrame && newIndex >= currentFrame) {
            setCurrentFrame(currentFrame - 1);
        } else if (oldIndex > currentFrame && newIndex <= currentFrame) {
            setCurrentFrame(currentFrame + 1);
        }
    };

    useEffect(() => {
        const frameLayers = frames[currentFrame];
        if (!frameLayers?.length) {
            return;
        }

        setLayers(convertToLayerProps(frameLayers, colorMode));
    }, [
        // NOTE: deliberately not reacting to colorMode, since palette indices are not remapped on a mode switch yet
        canvasReload,
        currentFrame
    ]);

    return (
        <FramesContainer>
            <label style={{ zIndex: 100 }}>
                {nls.localize('vuengine/editors/pixel/frames', 'Frames')}
            </label>
            <SortableList
                onSortEnd={onSortEnd}
                className="frames-list"
                draggedItemClassName='dragging'
                dropTarget={<DropTarget />}
            >
                {
                    frames.map((f, i) => (
                        <SortableItem key={i}>
                            <Frame
                                className={currentFrame === i ? 'item active' : 'item'}
                                onClick={() => setCurrentFrame(i)}
                            >
                                <SortableKnob>
                                    <FrameIndex>
                                        <DotsSixVertical size={16} />
                                        {i + 1}
                                    </FrameIndex>
                                </SortableKnob>
                                <CanvasImage
                                    height={f[0].data.length}
                                    palette={'11100100'}
                                    pixelData={[mergeLayers(f)]}
                                    displayMode={DisplayMode.Mono}
                                    width={f[0].data[0].length}
                                    colorMode={colorMode}
                                    drawBlack={true}
                                />
                                {frames.length > 1 &&
                                    <button
                                        className="remove-button"
                                        onClick={e => {
                                            e.stopPropagation();
                                            removeFrame(i);
                                        }}
                                        title={nls.localizeByDefault('Remove')}
                                    >
                                        <i className='codicon codicon-x' />
                                    </button>
                                }
                            </Frame>
                        </SortableItem>
                    ))
                }
                <button
                    className='theia-button add-button'
                    onClick={addFrame}
                    title={nls.localizeByDefault('Add')}
                    style={{
                        backgroundColor: 'var(--theia-editor-background)',
                        minHeight: 75,
                        minWidth: 26,
                        maxWidth: 26,
                        padding: 0,
                        zIndex: 100,
                    }}
                >
                    <i className='codicon codicon-plus' />
                </button>
            </SortableList>
        </FramesContainer>
    );
}
