import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React from 'react';
import ColorSelector from '../../Common/ColorSelector';
import HContainer from '../../Common/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import RadioSelect from '../../Common/RadioSelect';
import VContainer from '../../Common/VContainer';
import {
    MAX_SPHERE_RADIUS,
    MAX_WIREFRAME_DISPLACEMENT,
    MIN_SPHERE_RADIUS,
    MIN_WIREFRAME_DISPLACEMENT,
    MeshSegmentData,
    STEP_SPHERE_RADIUS,
    STEP_WIREFRAME_DISPLACEMENT,
    Transparency,
    WireframeConfigData,
    WireframeData,
    WireframeType
} from '../EntityEditorTypes';
import MeshSegment from './MeshSegment';

interface WireframeProps {
    wireframe: WireframeData
    updateWireframe: (partialData: Partial<WireframeData>) => void
    removeWireframe: () => void
}

export default function Wireframe(props: WireframeProps): React.JSX.Element {
    const { wireframe, updateWireframe, removeWireframe } = props;

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

    const setName = (name: string): void => {
        updateWireframe({
            name
        });
    };

    const setType = (type: WireframeType): void => {
        updateWireframeWireframe({
            type,
        });
    };

    const setDisplacementX = (x: number): void => {
        updateWireframeWireframe({
            displacement: {
                ...wireframe.wireframe.displacement,
                x: Math.min(Math.max(x, MIN_WIREFRAME_DISPLACEMENT), MAX_WIREFRAME_DISPLACEMENT),
            },
        });
    };

    const setDisplacementY = (y: number): void => {
        updateWireframeWireframe({
            displacement: {
                ...wireframe.wireframe.displacement,
                y: Math.min(Math.max(y, MIN_WIREFRAME_DISPLACEMENT), MAX_WIREFRAME_DISPLACEMENT),
            },
        });
    };

    const setDisplacementZ = (z: number): void => {
        updateWireframeWireframe({
            displacement: {
                ...wireframe.wireframe.displacement,
                z: Math.min(Math.max(z, MIN_WIREFRAME_DISPLACEMENT), MAX_WIREFRAME_DISPLACEMENT),
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

    return <div className='item'>
        <button
            className="remove-button"
            onClick={removeWireframe}
            title={nls.localize('vuengine/entityEditor/removeComponent', 'Remove Component')}
        >
            <i className='codicon codicon-x' />
        </button>
        <VContainer gap={15}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/entityEditor/name', 'Name')}
                </label>
                <input
                    className='theia-input'
                    value={wireframe.name}
                    onChange={e => setName(e.target.value)}
                />
            </VContainer>
            <HContainer alignItems='start' gap={15} grow={1} wrap='wrap'>
                <VContainer>
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
                <VContainer>
                    <label>Displacement (x, y, z)</label>
                    <HContainer>
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            min={MIN_WIREFRAME_DISPLACEMENT}
                            max={MAX_WIREFRAME_DISPLACEMENT}
                            step={STEP_WIREFRAME_DISPLACEMENT}
                            value={wireframe.wireframe.displacement.x}
                            onChange={e => setDisplacementX(parseFloat(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            min={MIN_WIREFRAME_DISPLACEMENT}
                            max={MAX_WIREFRAME_DISPLACEMENT}
                            step={STEP_WIREFRAME_DISPLACEMENT}
                            value={wireframe.wireframe.displacement.y}
                            onChange={e => setDisplacementY(parseFloat(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            min={MIN_WIREFRAME_DISPLACEMENT}
                            max={MAX_WIREFRAME_DISPLACEMENT}
                            step={STEP_WIREFRAME_DISPLACEMENT}
                            value={wireframe.wireframe.displacement.z}
                            onChange={e => setDisplacementZ(parseFloat(e.target.value))}
                        />
                    </HContainer>
                </VContainer>
            </HContainer>
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
        </VContainer>
    </div>;
}
