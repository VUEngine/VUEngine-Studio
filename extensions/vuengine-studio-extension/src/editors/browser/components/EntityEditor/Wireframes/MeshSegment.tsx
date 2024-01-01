import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../../Common/HContainer';
import { MeshSegmentData } from '../EntityEditorTypes';
import VContainer from '../../Common/VContainer';

interface MeshSegmentProps {
    segment: MeshSegmentData
    updateSegment: (segmentData: Partial<MeshSegmentData>) => void
    removeSegment: () => void
}

export default function MeshSegment(props: MeshSegmentProps): React.JSX.Element {
    const { segment, updateSegment, removeSegment } = props;

    const setFromX = (x: number): void => {
        updateSegment({
            fromVertex: {
                ...segment.fromVertex,
                x,
            },
        });
    };

    const setFromY = (y: number): void => {
        updateSegment({
            fromVertex: {
                ...segment.fromVertex,
                y,
            },
        });
    };

    const setFromZ = (z: number): void => {
        updateSegment({
            fromVertex: {
                ...segment.fromVertex,
                z,
            },
        });
    };

    const setFromParallax = (parallax: number): void => {
        updateSegment({
            fromVertex: {
                ...segment.fromVertex,
                parallax,
            },
        });
    };

    const setToX = (x: number): void => {
        updateSegment({
            toVertex: {
                ...segment.toVertex,
                x,
            },
        });
    };

    const setToY = (y: number): void => {
        updateSegment({
            toVertex: {
                ...segment.toVertex,
                y,
            },
        });
    };

    const setToZ = (z: number): void => {
        updateSegment({
            toVertex: {
                ...segment.toVertex,
                z,
            },
        });
    };

    const setToParallax = (parallax: number): void => {
        updateSegment({
            toVertex: {
                ...segment.toVertex,
                parallax,
            },
        });
    };

    return <div className="item">
        <button
            className="remove-button"
            onClick={removeSegment}
            title={nls.localize('vuengine/entityEditor/remove', 'Remove')}
        >
            <i className='codicon codicon-x' />
        </button>
        <HContainer gap={10} grow={1} wrap='wrap'>
            <VContainer>
                <label>From (X, Y, Z, Parallax)</label>
                <HContainer>
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        value={segment.fromVertex.x}
                        onChange={e => setFromX(parseFloat(e.target.value))}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        value={segment.fromVertex.y}
                        onChange={e => setFromY(parseFloat(e.target.value))}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        value={segment.fromVertex.z}
                        onChange={e => setFromZ(parseFloat(e.target.value))}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        value={segment.fromVertex.parallax}
                        onChange={e => setFromParallax(parseFloat(e.target.value))}
                    />
                </HContainer>
            </VContainer>
            <VContainer>
                <label>To (X, Y, Z, Parallax)</label>
                <HContainer>
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        value={segment.toVertex.x}
                        onChange={e => setToX(parseFloat(e.target.value))}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        value={segment.toVertex.y}
                        onChange={e => setToY(parseFloat(e.target.value))}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        value={segment.toVertex.z}
                        onChange={e => setToZ(parseFloat(e.target.value))}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        value={segment.toVertex.parallax}
                        onChange={e => setToParallax(parseFloat(e.target.value))}
                    />
                </HContainer>
            </VContainer>
        </HContainer>
    </div>;
}
