import { DotsSixVertical } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { DottingRef, useDotting } from 'dotting';
import React, { useEffect } from 'react';
import SortableList, { SortableItem } from 'react-easy-sort';
import styled from 'styled-components';
import { ColorMode } from '../../../../core/browser/ves-common-types';
import CanvasImage from '../Common/CanvasImage';
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
    border: var(--theia-border-width) solid var(--theia-dropdown-border);
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

const FrameIndex = styled.div`
    cursor: grab;
    display: flex;
    left: 2px;
    position: absolute;
    top: 7px;
`;

export const mergeLayers = (layers: LayerPixelData[]): number[][] => {
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

    [...layers].reverse().forEach(layer => {
        layer.data.forEach((row, rowIndex) => row.forEach((color, columnIndex) => {
            // eslint-disable-next-line no-null/no-null
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
    dottingRef: React.RefObject<DottingRef>
}

export default function PixelEditorFrames(props: PixelEditorFramesProps): React.JSX.Element {
    const { frames, setFrames, currentFrame, setCurrentFrame, colorMode, dottingRef } = props;
    const { setLayers } = useDotting(dottingRef);

    const removeFrame = (index: number): void => {
        if (currentFrame === (frames.length - 1)) {
            setCurrentFrame(frames.length - 2);
        }
        setFrames([
            ...frames.slice(0, index),
            ...frames.slice(index + 1)
        ]);
    };

    const addFrame = (): void => {
        setFrames([
            ...frames,
            [
                ...frames[frames.length - 1]
            ],
        ]);
        setCurrentFrame(frames.length);
    };

    const arrayMove = (arr: any[], oldIndex: number, newIndex: number) => {
        const result = [...arr];
        if (newIndex >= result.length) {
            let k = newIndex - result.length + 1;
            while (k--) {
                result.push(undefined);
            }
        }
        result.splice(newIndex, 0, result.splice(oldIndex, 1)[0]);
        return result;
    };

    const onSortEnd = (oldIndex: number, newIndex: number): void => {
        setFrames(arrayMove(frames, oldIndex, newIndex));
        setCurrentFrame(newIndex);
    };

    useEffect(() => {
        setLayers(convertToLayerProps(frames[currentFrame], colorMode));
    }, [
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
            >
                {
                    frames.map((f, i) => (
                        <SortableItem
                            key={i}
                        >
                            <Frame
                                className={currentFrame === i ? 'item active' : 'item'}
                                onClick={() => setCurrentFrame(i)}
                            >
                                <FrameIndex>
                                    <DotsSixVertical size={16} />
                                    {i + 1}
                                </FrameIndex>
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
                        zIndex: 100,
                    }}
                >
                    <i className='codicon codicon-plus' />
                </button>
            </SortableList>
        </FramesContainer>
    );
}
