import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import { clamp } from '../../Common/Utils';
import VContainer from '../../Common/Base/VContainer';
import { INPUT_BLOCKING_COMMANDS } from '../EntityEditor';
import { MeshSegmentData } from '../EntityEditorTypes';

const MIN_MESH_SEGMENT_VALUE = 0;
const MAX_MESH_SEGMENT_VALUE = 512;

interface MeshSegmentProps {
    segment: MeshSegmentData
    updateSegment: (segmentData: Partial<MeshSegmentData>) => void
    removeSegment: () => void
}

export default function MeshSegment(props: MeshSegmentProps): React.JSX.Element {
    const { segment, updateSegment, removeSegment } = props;
    const { enableCommands, disableCommands } = useContext(EditorsContext) as EditorsContextType;

    const setFromX = (x: number): void => {
        updateSegment({
            fromVertex: {
                ...segment.fromVertex,
                x,
            },
        });
    };

    const setFromY = (value: number): void => {
        updateSegment({
            fromVertex: {
                ...segment.fromVertex,
                y: clamp(value, MIN_MESH_SEGMENT_VALUE, MAX_MESH_SEGMENT_VALUE),
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

    return (
        <HContainer className="item" gap={15} grow={1} wrap='wrap'>
            <button
                className="remove-button"
                onClick={removeSegment}
                title={nls.localize('vuengine/entityEditor/removeComponent', 'Remove Component')}
            >
                <i className='codicon codicon-x' />
            </button>
            <VContainer>
                <label>From (x, y, z, parallax)</label>
                <HContainer wrap='wrap'>
                    <input
                        className='theia-input'
                        style={{ width: 50 }}
                        type='number'
                        value={segment.fromVertex.x}
                        onChange={e => setFromX(parseFloat(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 50 }}
                        type='number'
                        value={segment.fromVertex.y}
                        onChange={e => setFromY(parseFloat(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 50 }}
                        type='number'
                        value={segment.fromVertex.z}
                        onChange={e => setFromZ(parseFloat(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 50 }}
                        type='number'
                        value={segment.fromVertex.parallax}
                        onChange={e => setFromParallax(parseFloat(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                </HContainer>
            </VContainer>
            <VContainer>
                <label>To (x, y, z, parallax)</label>
                <HContainer wrap='wrap'>
                    <input
                        className='theia-input'
                        style={{ width: 50 }}
                        type='number'
                        value={segment.toVertex.x}
                        onChange={e => setToX(parseFloat(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 50 }}
                        type='number'
                        value={segment.toVertex.y}
                        onChange={e => setToY(parseFloat(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 50 }}
                        type='number'
                        value={segment.toVertex.z}
                        onChange={e => setToZ(parseFloat(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 50 }}
                        type='number'
                        value={segment.toVertex.parallax}
                        onChange={e => setToParallax(parseFloat(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                </HContainer>
            </VContainer>
        </HContainer>
    );
}
