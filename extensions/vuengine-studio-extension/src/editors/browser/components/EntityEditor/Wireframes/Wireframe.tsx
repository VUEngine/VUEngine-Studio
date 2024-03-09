import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React from 'react';
import ColorSelector from '../../Common/ColorSelector';
import HContainer from '../../Common/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import RadioSelect from '../../Common/RadioSelect';
import { clamp } from '../../Common/Utils';
import VContainer from '../../Common/VContainer';
import { Transparency, WireframeType } from '../../Common/VUEngineTypes';
import {
    MAX_SPHERE_RADIUS,
    MAX_WIREFRAME_DISPLACEMENT,
    MIN_SPHERE_RADIUS,
    MIN_WIREFRAME_DISPLACEMENT,
    MeshSegmentData,
    STEP_SPHERE_RADIUS,
    STEP_WIREFRAME_DISPLACEMENT,
    WireframeConfigData,
    WireframeData,
} from '../EntityEditorTypes';
import MeshSegment from './MeshSegment';

interface WireframeProps {
    wireframe: WireframeData
    updateWireframe: (partialData: Partial<WireframeData>) => void
}

export default function Wireframe(props: WireframeProps): React.JSX.Element {
    const { wireframe, updateWireframe } = props;

    const setSegment = (segmentIndex: number, segmentData: Partial<MeshSegmentData>): void => {
        const updatedSegments = [...wireframe.segments];
        updatedSegments[segmentIndex] = {
            ...updatedSegments[segmentIndex],
            ...segmentData,
        };
        updateWireframe({ segments: updatedSegments });
    };

    const updateWireframeWireframe = (partialWireframe: Partial<WireframeConfigData>): void => {
        updateWireframe({
            wireframe: {
                ...wireframe.wireframe,
                ...partialWireframe,
            }
        });
    };

    const setType = (type: WireframeType): void => {
        updateWireframeWireframe({
            type,
        });
    };

    const setDisplacement = (axis: 'x' | 'y' | 'z', value: number): void => {
        updateWireframeWireframe({
            displacement: {
                ...wireframe.wireframe.displacement,
                [axis]: clamp(value, MIN_WIREFRAME_DISPLACEMENT, MAX_WIREFRAME_DISPLACEMENT),
            },
        });
    };

    const setColor = (color: number): void => {
        updateWireframeWireframe({
            color
        });
    };

    const setTransparency = (transparency: Transparency): void => {
        updateWireframeWireframe({
            transparency
        });
    };

    const toggleInterlaced = (): void => {
        updateWireframeWireframe({
            interlaced: !wireframe.wireframe.interlaced,
        });
    };

    const setRadius = (radius: number): void => {
        updateWireframe({
            radius
        });
    };

    const setLength = (length: number): void => {
        updateWireframe({
            length
        });
    };

    const toggleDrawCenter = (): void => {
        updateWireframe({
            drawCenter: !wireframe.drawCenter
        });
    };

    const addSegment = (): void => {
        updateWireframe({
            segments: [
                ...wireframe.segments,
                {
                    fromVertex: {
                        x: 0,
                        y: 0,
                        z: 0,
                        parallax: 0,
                    },
                    toVertex: {
                        x: 0,
                        y: 0,
                        z: 0,
                        parallax: 0,
                    },
                }
            ]
        });
    };

    const removeSegment = async (segmentIndex: number): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/entityEditor/removeSegment', 'Remove Segment'),
            msg: nls.localize('vuengine/entityEditor/areYouSureYouWantToRemoveSegment', 'Are you sure you want to remove this segment?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            updateWireframe({
                segments: [
                    ...wireframe.segments.slice(0, segmentIndex),
                    ...wireframe.segments.slice(segmentIndex + 1)
                ]
            });
        }
    };

    return (
        <VContainer gap={15}>
            <HContainer alignItems='start' gap={15} wrap='wrap'>
                <VContainer grow={1}>
                    <label>
                        {nls.localize('vuengine/entityEditor/type', 'Type')}
                    </label>
                    <SelectComponent
                        options={[{
                            value: WireframeType.Sphere,
                            label: nls.localize('vuengine/entityEditor/wireframeTypeAffine', 'Sphere'),
                        }, {
                            value: WireframeType.Mesh,
                            label: nls.localize('vuengine/entityEditor/wireframeTypeMesh', 'Mesh'),
                        }, {
                            value: WireframeType.Asterisk,
                            label: nls.localize('vuengine/entityEditor/wireframeTypeAsterisk', 'Asterisk'),
                        }]}
                        defaultValue={wireframe.wireframe.type}
                        onChange={option => setType(option.value as WireframeType)}
                    />
                </VContainer>
                <VContainer>
                    {nls.localize('vuengine/entityEditor/color', 'Color')}
                    <ColorSelector
                        color={wireframe.wireframe.color}
                        updateColor={setColor}
                    />
                </VContainer>
            </HContainer>
            <HContainer alignItems='start' gap={15} wrap='wrap'>
                <VContainer>
                    <InfoLabel
                        label={nls.localize('vuengine/entityEditor/transparency', 'Transparency')}
                        tooltip={nls.localize(
                            'vuengine/entityEditor/wireframeTransparencyDescription',
                            'With transparency enabled, this wireframe will only be shown on every even or odd frame' +
                            'resulting in it appearing transparent (and slightly dimmer). ' +
                            'This also halves CPU load since 50% less pixels have to be rendered per frame in average.'
                        )}
                    />
                    <RadioSelect
                        options={[{
                            value: Transparency.None,
                            label: nls.localize('vuengine/entityEditor/transparencyNone', 'None'),
                        }, {
                            value: Transparency.Odd,
                            label: nls.localize('vuengine/entityEditor/transparencyOdd', 'Odd'),
                        }, {
                            value: Transparency.Even,
                            label: nls.localize('vuengine/entityEditor/transparencyEven', 'Even'),
                        }]}
                        defaultValue={wireframe.wireframe.transparency}
                        onChange={options => setTransparency(options[0].value as Transparency)}
                    />
                </VContainer>
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/interlaced', 'Interlaced')}
                    </label>
                    <input
                        type="checkbox"
                        checked={wireframe.wireframe.interlaced}
                        onChange={toggleInterlaced}
                    />
                </VContainer>
            </HContainer>
            <VContainer>
                <label>Displacement (x, y, z)</label>
                <HContainer>
                    <input
                        className='theia-input'
                        type='number'
                        min={MIN_WIREFRAME_DISPLACEMENT}
                        max={MAX_WIREFRAME_DISPLACEMENT}
                        step={STEP_WIREFRAME_DISPLACEMENT}
                        value={wireframe.wireframe.displacement.x}
                        onChange={e => setDisplacement('x', parseFloat(e.target.value))}
                    />
                    <input
                        className='theia-input'
                        type='number'
                        min={MIN_WIREFRAME_DISPLACEMENT}
                        max={MAX_WIREFRAME_DISPLACEMENT}
                        step={STEP_WIREFRAME_DISPLACEMENT}
                        value={wireframe.wireframe.displacement.y}
                        onChange={e => setDisplacement('y', parseFloat(e.target.value))}
                    />
                    <input
                        className='theia-input'
                        type='number'
                        min={MIN_WIREFRAME_DISPLACEMENT}
                        max={MAX_WIREFRAME_DISPLACEMENT}
                        step={STEP_WIREFRAME_DISPLACEMENT}
                        value={wireframe.wireframe.displacement.z}
                        onChange={e => setDisplacement('z', parseFloat(e.target.value))}
                    />
                </HContainer>
            </VContainer>
            {wireframe.wireframe.type === WireframeType.Mesh &&
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/segments', 'Segments')}
                        {wireframe.segments.length > 0 &&
                            <>
                                {' '}<span className='count'>{wireframe.segments.length}</span>
                            </>
                        }
                    </label>
                    {wireframe.segments.map((segment, segmentIndex) =>
                        <MeshSegment
                            key={`segment-${segmentIndex}`}
                            segment={segment}
                            updateSegment={(s: Partial<MeshSegmentData>) => setSegment(segmentIndex, s)}
                            removeSegment={() => removeSegment(segmentIndex)}
                        />
                    )}
                    <button
                        className='theia-button add-button full-width'
                        onClick={addSegment}
                        title={nls.localize('vuengine/entityEditor/addSegment', 'Add Segment')}
                    >
                        <i className='codicon codicon-plus' />
                    </button>
                </VContainer>
            }
            {wireframe.wireframe.type === WireframeType.Sphere &&
                <HContainer gap={15}>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/entityEditor/radius', 'Radius')}
                        </label>
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            min={MIN_SPHERE_RADIUS}
                            max={MAX_SPHERE_RADIUS}
                            step={STEP_SPHERE_RADIUS}
                            value={wireframe.radius}
                            onChange={e => setRadius(parseFloat(e.target.value))}
                        />
                    </VContainer>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/entityEditor/drawCenter', 'Draw Center')}
                        </label>
                        <input
                            type="checkbox"
                            checked={wireframe.drawCenter}
                            onChange={toggleDrawCenter}
                        />
                    </VContainer>
                </HContainer>
            }
            {wireframe.wireframe.type === WireframeType.Asterisk &&
                <VContainer>
                    <label>
                        {nls.localize('vuengine/entityEditor/length', 'Length')}
                    </label>
                    <input
                        className='theia-input'
                        style={{ width: 48 }}
                        type='number'
                        min={0}
                        max={255}
                        step={0.1}
                        value={wireframe.length}
                        onChange={e => setLength(parseFloat(e.target.value))}
                    />
                </VContainer>
            }
        </VContainer >
    );
}
