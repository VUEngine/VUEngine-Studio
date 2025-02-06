import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import { INPUT_BLOCKING_COMMANDS } from '../ActorEditor';
import { MeshSegmentData } from '../ActorEditorTypes';
import { clamp } from '../../Common/Utils';

const MESH_SEGMENT_MIN_VALUE = -511;
const MESH_SEGMENT_MAX_VALUE = 512;
const MESH_SEGMENT_DEFAULT_VALUE = 0;

const MESH_SEGMENT_PARALLAX_MIN_VALUE = -63;
const MESH_SEGMENT_PARALLAX_MAX_VALUE = 64;
const MESH_SEGMENT_PARALLAX_DEFAULT_VALUE = 0;

interface MeshSegmentProps {
    segment: MeshSegmentData
    updateSegment: (segmentData: Partial<MeshSegmentData>) => void
    removeSegment: () => void
}

export default function MeshSegment(props: MeshSegmentProps): React.JSX.Element {
    const { segment, updateSegment, removeSegment } = props;
    const { enableCommands, disableCommands } = useContext(EditorsContext) as EditorsContextType;

    const setPoint = (point: 'to' | 'from', axis: 'x' | 'y' | 'z' | 'parallax', value: number): void => {
        const idx = point === 'to' ? 'toVertex' : 'fromVertex';
        updateSegment({
            [idx]: {
                ...segment[idx],
                [axis]: axis === 'parallax'
                    ? clamp(value, MESH_SEGMENT_PARALLAX_MIN_VALUE, MESH_SEGMENT_PARALLAX_MAX_VALUE, MESH_SEGMENT_PARALLAX_DEFAULT_VALUE)
                    : clamp(value, MESH_SEGMENT_MIN_VALUE, MESH_SEGMENT_MAX_VALUE, MESH_SEGMENT_DEFAULT_VALUE)
            },
        });
    };

    return (
        <HContainer className="item" gap={15} grow={1} wrap='wrap'>
            <button
                className="remove-button"
                onClick={removeSegment}
                title={nls.localize('vuengine/editors/actor/removeComponent', 'Remove Component')}
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
                        onChange={e => setPoint('from', 'x', e.target.value === '' ? MESH_SEGMENT_DEFAULT_VALUE : parseFloat(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 50 }}
                        type='number'
                        value={segment.fromVertex.y}
                        onChange={e => setPoint('from', 'y', e.target.value === '' ? MESH_SEGMENT_DEFAULT_VALUE : parseFloat(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 50 }}
                        type='number'
                        value={segment.fromVertex.z}
                        onChange={e => setPoint('from', 'z', e.target.value === '' ? MESH_SEGMENT_DEFAULT_VALUE : parseFloat(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 50 }}
                        type='number'
                        value={segment.fromVertex.parallax}
                        onChange={e => setPoint('from', 'parallax', e.target.value === '' ? MESH_SEGMENT_PARALLAX_DEFAULT_VALUE : parseFloat(e.target.value))}
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
                        onChange={e => setPoint('to', 'x', e.target.value === '' ? MESH_SEGMENT_DEFAULT_VALUE : parseFloat(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 50 }}
                        type='number'
                        value={segment.toVertex.y}
                        onChange={e => setPoint('to', 'y', e.target.value === '' ? MESH_SEGMENT_DEFAULT_VALUE : parseFloat(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 50 }}
                        type='number'
                        value={segment.toVertex.z}
                        onChange={e => setPoint('to', 'z', e.target.value === '' ? MESH_SEGMENT_DEFAULT_VALUE : parseFloat(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                    <input
                        className='theia-input'
                        style={{ width: 50 }}
                        type='number'
                        value={segment.toVertex.parallax}
                        onChange={e => setPoint('to', 'parallax', e.target.value === '' ? MESH_SEGMENT_PARALLAX_DEFAULT_VALUE : parseFloat(e.target.value))}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                </HContainer>
            </VContainer>
        </HContainer>
    );
}
