import { nls } from '@theia/core';
import React, { useContext } from 'react';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import { clamp } from '../../Common/Utils';
import { ActorEditorContext, ActorEditorContextType, INPUT_BLOCKING_COMMANDS, MeshSegmentData } from '../ActorEditorTypes';

const MESH_SEGMENT_MIN_VALUE = -511;
const MESH_SEGMENT_MAX_VALUE = 512;
const MESH_SEGMENT_DEFAULT_VALUE = 0;

const MESH_SEGMENT_PARALLAX_MIN_VALUE = -63;
const MESH_SEGMENT_PARALLAX_MAX_VALUE = 64;
const MESH_SEGMENT_PARALLAX_DEFAULT_VALUE = 0;

interface MeshSegmentProps {
    index: number
    segment: MeshSegmentData
    updateSegment: (segmentData: Partial<MeshSegmentData>) => void
    removeSegment: () => void
}

export default function MeshSegment(props: MeshSegmentProps): React.JSX.Element {
    const { index, segment, updateSegment, removeSegment } = props;
    const { setPreviewCurrentMeshSegment } = useContext(ActorEditorContext) as ActorEditorContextType;

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
        <HContainer
            className="item"
            gap={15}
            grow={1}
            wrap='wrap'
            onMouseOver={() => setPreviewCurrentMeshSegment(index)}
            onMouseOut={() => setPreviewCurrentMeshSegment(-1)}
        >
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
                    <Input
                        type='number'
                        value={segment.fromVertex.x}
                        setValue={v => setPoint('from', 'x', v as number)}
                        commands={INPUT_BLOCKING_COMMANDS}
                        width={60}
                    />
                    <Input
                        type='number'
                        value={segment.fromVertex.y}
                        setValue={v => setPoint('from', 'y', v as number)}
                        commands={INPUT_BLOCKING_COMMANDS}
                        width={60}
                    />
                    <Input
                        type='number'
                        value={segment.fromVertex.z}
                        setValue={v => setPoint('from', 'z', v as number)}
                        commands={INPUT_BLOCKING_COMMANDS}
                        width={60}
                    />
                    <Input
                        type='number'
                        value={segment.fromVertex.parallax}
                        setValue={v => setPoint('from', 'parallax', v as number)}
                        commands={INPUT_BLOCKING_COMMANDS}
                        width={60}
                    />
                </HContainer>
            </VContainer>
            <VContainer>
                <label>To (x, y, z, parallax)</label>
                <HContainer wrap='wrap'>
                    <Input
                        type='number'
                        value={segment.toVertex.x}
                        setValue={v => setPoint('to', 'x', v as number)}
                        commands={INPUT_BLOCKING_COMMANDS}
                        width={60}
                    />
                    <Input
                        type='number'
                        value={segment.toVertex.y}
                        setValue={v => setPoint('to', 'y', v as number)}
                        commands={INPUT_BLOCKING_COMMANDS}
                        width={60}
                    />
                    <Input
                        type='number'
                        value={segment.toVertex.z}
                        setValue={v => setPoint('to', 'z', v as number)}
                        commands={INPUT_BLOCKING_COMMANDS}
                        width={60}
                    />
                    <Input
                        type='number'
                        value={segment.toVertex.parallax}
                        setValue={v => setPoint('to', 'parallax', v as number)}
                        commands={INPUT_BLOCKING_COMMANDS}
                        width={60}
                    />
                </HContainer>
            </VContainer>
        </HContainer>
    );
}
