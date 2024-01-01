import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext } from 'react';
import ColorSelector from '../../Common/ColorSelector';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import {
    EntityEditorContext,
    EntityEditorContextType,
    MAX_SPHERE_RADIUS,
    MAX_WIREFRAME_DISPLACEMENT,
    MIN_SPHERE_RADIUS,
    MIN_WIREFRAME_DISPLACEMENT,
    MeshSegmentData,
    STEP_SPHERE_RADIUS,
    STEP_WIREFRAME_DISPLACEMENT,
    Transparency,
    Wireframe,
    WireframeData,
    WireframeType,
} from '../EntityEditorTypes';
import MeshSegment from './MeshSegment';

interface WireframeProps {
    index: number
    wireframe: WireframeData
}

export default function Wireframe(props: WireframeProps): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { index, wireframe } = props;

    const setWireframe = (partialWireframeData: Partial<WireframeData>): void => {
        const updatedWireframesArray = [...data.wireframes.wireframes];
        updatedWireframesArray[index] = {
            ...updatedWireframesArray[index],
            ...partialWireframeData,
        };

        const updatedWireframes = { ...data.wireframes };
        updatedWireframes.wireframes = updatedWireframesArray;

        setData({ wireframes: updatedWireframes });
    };

    const setSegment = (segmentIndex: number, segmentData: Partial<MeshSegmentData>): void => {
        const updatedSegments = [...wireframe.segments];
        updatedSegments[segmentIndex] = {
            ...updatedSegments[segmentIndex],
            ...segmentData,
        };
        setWireframe({ segments: updatedSegments });
    };

    const setWireframeWireframe = (partialWireframe: Partial<Wireframe>): void => {
        setWireframe({
            wireframe: {
                ...wireframe.wireframe,
                ...partialWireframe,
            }
        });
    };

    const setType = (type: WireframeType): void => {
        setWireframeWireframe({
            type,
        });
    };

    const setDisplacementX = (x: number): void => {
        setWireframeWireframe({
            displacement: {
                ...wireframe.wireframe.displacement,
                x: Math.min(Math.max(x, MIN_WIREFRAME_DISPLACEMENT), MAX_WIREFRAME_DISPLACEMENT),
            },
        });
    };

    const setDisplacementY = (y: number): void => {
        setWireframeWireframe({
            displacement: {
                ...wireframe.wireframe.displacement,
                y: Math.min(Math.max(y, MIN_WIREFRAME_DISPLACEMENT), MAX_WIREFRAME_DISPLACEMENT),
            },
        });
    };

    const setDisplacementZ = (z: number): void => {
        setWireframeWireframe({
            displacement: {
                ...wireframe.wireframe.displacement,
                z: Math.min(Math.max(z, MIN_WIREFRAME_DISPLACEMENT), MAX_WIREFRAME_DISPLACEMENT),
            },
        });
    };

    const setColor = (color: number): void => {
        setWireframeWireframe({
            color
        });
    };

    const setTransparency = (transparency: Transparency): void => {
        setWireframeWireframe({
            transparency
        });
    };

    const toggleInterlaced = (): void => {
        setWireframeWireframe({
            interlaced: !wireframe.wireframe.interlaced,
        });
    };

    const setRadius = (radius: number): void => {
        setWireframe({
            radius
        });
    };

    const setLength = (length: number): void => {
        setWireframe({
            length
        });
    };

    const toggleDrawCenter = (): void => {
        setWireframe({
            drawCenter: !wireframe.drawCenter
        });
    };

    const addSegment = (): void => {
        setWireframe({
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
            setWireframe({
                segments: [
                    ...wireframe.segments.slice(0, segmentIndex),
                    ...wireframe.segments.slice(segmentIndex + 1)
                ]
            });
        }
    };

    const removeWireframe = async (): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/entityEditor/removeWireframe', 'Remove Wireframe'),
            msg: nls.localize('vuengine/entityEditor/areYouSureYouWantToRemoveWireframe', 'Are you sure you want to remove this Wireframe?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            const updatedWireframes = { ...data.wireframes };
            updatedWireframes.wireframes = [
                ...data.wireframes.wireframes.slice(0, index),
                ...data.wireframes.wireframes.slice(index + 1)
            ];

            setData({ wireframes: updatedWireframes });
        }
    };

    return <div className='item'>
        <button
            className="remove-button"
            onClick={removeWireframe}
            title={nls.localize('vuengine/entityEditor/remove', 'Remove')}
        >
            <i className='codicon codicon-x' />
        </button>
        <VContainer gap={15}>
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
                    <label>
                        {nls.localize('vuengine/entityEditor/transparency', 'Transparency')}
                    </label>
                    <SelectComponent
                        options={[{
                            value: Transparency.None,
                            label: nls.localize('vuengine/entityEditor/transparencyNone', 'None'),
                            description: nls.localize('vuengine/entityEditor/transparencyNoneDescription', 'Display every frame'),
                        }, {
                            value: Transparency.Odd,
                            label: nls.localize('vuengine/entityEditor/transparencyOdd', 'Odd'),
                            description: nls.localize('vuengine/entityEditor/transparencyOddDescription', 'Display only every odd frame'),
                        }, {
                            value: Transparency.Even,
                            label: nls.localize('vuengine/entityEditor/transparencyEven', 'Even'),
                            description: nls.localize('vuengine/entityEditor/transparencyEvenDescription', 'Display only every even frame'),
                        }]}
                        defaultValue={wireframe.wireframe.transparency}
                        onChange={option => setTransparency(option.value as Transparency)}
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
                    <label>Displacement (X, Y, Z)</label>
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
