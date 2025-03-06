import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import { LayerPixelData } from '../PixelEditorTypes';

interface PixelEditorFramesProps {
    frames: LayerPixelData[][]
    setFrames: (frames: LayerPixelData[][]) => void
    currentFrame: number
    setCurrentFrame: React.Dispatch<React.SetStateAction<number>>
}

export default function PixelEditorFrames(props: PixelEditorFramesProps): React.JSX.Element {
    const { frames, setFrames, currentFrame, setCurrentFrame } = props;

    const removeFrame = (index: number): void => {
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
    };

    return (
        <VContainer
            overflow="hidden"
            style={{
                maxHeight: 106,
                minHeight: 106,
                zIndex: 100,
            }}
        >
            <label>
                {nls.localize('vuengine/editors/pixel/frames', 'Frames')}
            </label>
            <HContainer overflow="auto">
                {
                    frames.map((f, i) => (
                        <div
                            key={i}
                            className={currentFrame === i ? 'item frame active' : 'item frame'}
                            style={{ zIndex: 100 }}
                            onClick={() => setCurrentFrame(i)}
                        >
                            <div className="frame-index">{i + 1}</div>
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
                        </div>
                    ))
                }
                <button
                    className='theia-button add-button'
                    onClick={addFrame}
                    title={nls.localizeByDefault('Add')}
                    style={{
                        backgroundColor: 'var(--theia-editor-background)',
                        zIndex: 100,
                    }}
                >
                    <i className='codicon codicon-plus' />
                </button>
            </HContainer>
        </VContainer>
    );
}
