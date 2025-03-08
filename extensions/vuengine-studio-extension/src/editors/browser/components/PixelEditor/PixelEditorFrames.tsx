import { nls } from '@theia/core';
import { DottingRef, useDotting } from 'dotting';
import React, { useEffect } from 'react';
import { ColorMode } from '../../../../core/browser/ves-common-types';
import HContainer from '../Common/Base/HContainer';
import VContainer from '../Common/Base/VContainer';
import { convertToLayerProps } from './PixelEditor';
import { LayerPixelData } from './PixelEditorTypes';
import styled from 'styled-components';
import { DotsSixVertical } from '@phosphor-icons/react';
import CanvasImage from '../Common/CanvasImage';
import { DisplayMode } from '../Common/VUEngineTypes';

const Frame = styled.div`
    box-sizing: border-box;
    cursor: pointer;
    flex-grow: unset;
    min-height: 75px;
    max-height: 75px;
    min-width: 50px;
    max-width: 50px;
    padding: 28px 3px 3px  !important;
    position: relative;

    canvas {
        border: 1px solid var(--theia-dropdown-border) !important;
        border-radius: 2px;
        box-sizing: border-box;
        height: 100%;
        object-fit: contain;
        width: 100%;
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

    // initialize as all black
    for (let i = 0; i < layers[0].data.length; i++) {
        const row: number[] = [];
        for (let j = 0; j < layers[0].data[0].length; j++) {
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

    useEffect(() => {
        setLayers(convertToLayerProps(frames[currentFrame], colorMode));
    }, [
        currentFrame
    ]);

    return (
        <VContainer
            alignItems="start"
            justifyContent="end"
            overflow="hidden"
            style={{
                maxWidth: '100%',
            }}
        >
            <label style={{ zIndex: 100 }}>
                {nls.localize('vuengine/editors/pixel/frames', 'Frames')}
            </label>
            <HContainer
                overflow="auto"
                wrap="wrap"
                style={{
                    maxHeight: 155,
                    padding: 2,
                    zIndex: 100,
                }}
            >
                {
                    frames.map((f, i) => (
                        <Frame
                            key={i}
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
            </HContainer>
        </VContainer >
    );
}
