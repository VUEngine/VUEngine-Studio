import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import { SelectComponent } from '@theia/core/lib/browser/widgets/select-component';
import React, { useContext } from 'react';
import SortableList from 'react-easy-sort';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import ColorSelector from '../../Common/ColorSelector';
import TransparencySelect from '../../Common/TransparencySelect';
import { arrayMove, clamp } from '../../Common/Utils';
import { Transparency, WireframeType } from '../../Common/VUEngineTypes';
import {
    INPUT_BLOCKING_COMMANDS, MAX_SPHERE_RADIUS,
    MAX_WIREFRAME_DISPLACEMENT,
    MIN_SPHERE_RADIUS,
    MIN_WIREFRAME_DISPLACEMENT,
    MeshSegmentData,
    STEP_SPHERE_RADIUS,
    STEP_WIREFRAME_DISPLACEMENT,
    WireframeData
} from '../ActorEditorTypes';
import MeshSegment from './MeshSegment';

interface WireframeProps {
    wireframe: WireframeData
    updateWireframe: (partialData: Partial<WireframeData>) => void
}

export default function Wireframe(props: WireframeProps): React.JSX.Element {
    const { wireframe, updateWireframe } = props;
    const { enableCommands, disableCommands } = useContext(EditorsContext) as EditorsContextType;

    const setSegment = (segmentIndex: number, segmentData: Partial<MeshSegmentData>): void => {
        const updatedSegments = [...wireframe.segments];
        updatedSegments[segmentIndex] = {
            ...updatedSegments[segmentIndex],
            ...segmentData,
        };
        updateWireframe({ segments: updatedSegments });
    };

    const setType = (type: WireframeType): void => {
        updateWireframe({
            type,
        });
    };

    const resetDisplacement = (): void => {
        updateWireframe({
            displacement: {
                ...wireframe.displacement,
                x: 0,
                y: 0,
                z: 0,
            },
        });
    };

    const setDisplacement = (axis: 'x' | 'y' | 'z', value: number): void => {
        updateWireframe({
            displacement: {
                ...wireframe.displacement,
                [axis]: clamp(value, MIN_WIREFRAME_DISPLACEMENT, MAX_WIREFRAME_DISPLACEMENT),
            },
        });
    };

    const setColor = (color: number): void => {
        updateWireframe({
            color
        });
    };

    const setTransparency = (transparency: Transparency): void => {
        updateWireframe({
            transparency
        });
    };

    const toggleInterlaced = (): void => {
        updateWireframe({
            interlaced: !wireframe.interlaced,
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
        const fromVertex = wireframe.segments.length
            ? wireframe.segments[wireframe.segments.length - 1].toVertex
            : {
                x: 0,
                y: 0,
                z: 0,
                parallax: 0,
            };

        updateWireframe({
            segments: [
                ...wireframe.segments,
                {
                    fromVertex,
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
            title: nls.localize('vuengine/editors/actor/removeSegment', 'Remove Segment'),
            msg: nls.localize('vuengine/editors/actor/areYouSureYouWantToRemoveSegment', 'Are you sure you want to remove this segment?'),
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

    const onSortEnd = (oldIndex: number, newIndex: number): void => {
        updateWireframe({ segments: arrayMove(wireframe.segments, oldIndex, newIndex) });
    };

    return (
        <VContainer gap={15}>
            <HContainer alignItems='start' gap={15} wrap='wrap'>
                <VContainer grow={1}>
                    <label>
                        {nls.localizeByDefault('Type')}
                    </label>
                    <SelectComponent
                        options={[{
                            value: WireframeType.Sphere,
                            label: nls.localize('vuengine/editors/actor/wireframeTypeAffine', 'Sphere'),
                        }, {
                            value: WireframeType.Mesh,
                            label: nls.localize('vuengine/editors/actor/wireframeTypeMesh', 'Mesh'),
                        }, {
                            value: WireframeType.Asterisk,
                            label: nls.localize('vuengine/editors/actor/wireframeTypeAsterisk', 'Asterisk'),
                        }]}
                        defaultValue={wireframe.type}
                        onChange={option => setType(option.value as WireframeType)}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                </VContainer>
                <VContainer>
                    {nls.localize('vuengine/editors/actor/color', 'Color')}
                    <ColorSelector
                        color={wireframe.color}
                        updateColor={setColor}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                </VContainer>
            </HContainer>
            <HContainer alignItems='start' gap={15} wrap='wrap'>
                <TransparencySelect
                    value={wireframe.transparency}
                    setValue={setTransparency}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/actor/interlaced', 'Interlaced')}
                    </label>
                    <input
                        type="checkbox"
                        checked={wireframe.interlaced}
                        onChange={toggleInterlaced}
                        onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                        onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                    />
                </VContainer>
            </HContainer>
            <VContainer>
                <label>Displacement (x, y, z)</label>
                <HContainer alignItems="center">
                    <Input
                        type="number"
                        min={MIN_WIREFRAME_DISPLACEMENT}
                        max={MAX_WIREFRAME_DISPLACEMENT}
                        step={STEP_WIREFRAME_DISPLACEMENT}
                        value={wireframe.displacement.x}
                        setValue={v => setDisplacement('x', v as number)}
                        commands={INPUT_BLOCKING_COMMANDS}
                        width={64}
                    />
                    <Input
                        type="number"
                        min={MIN_WIREFRAME_DISPLACEMENT}
                        max={MAX_WIREFRAME_DISPLACEMENT}
                        step={STEP_WIREFRAME_DISPLACEMENT}
                        value={wireframe.displacement.y}
                        setValue={v => setDisplacement('y', v as number)}
                        commands={INPUT_BLOCKING_COMMANDS}
                        width={64}
                    />
                    <Input
                        type="number"
                        min={MIN_WIREFRAME_DISPLACEMENT}
                        max={MAX_WIREFRAME_DISPLACEMENT}
                        step={STEP_WIREFRAME_DISPLACEMENT}
                        value={wireframe.displacement.z}
                        setValue={v => setDisplacement('z', v as number)}
                        commands={INPUT_BLOCKING_COMMANDS}
                        width={64}
                    />
                    <i
                        className='codicon codicon-issues'
                        title={nls.localize('vuengine/editors/actor/center', 'Center')}
                        onClick={resetDisplacement}
                        style={{
                            cursor: 'pointer'
                        }}
                    />
                </HContainer>
            </VContainer>
            {wireframe.type === WireframeType.Mesh &&
                <SortableList
                    onSortEnd={onSortEnd}
                    draggedItemClassName='item dragging'
                    lockAxis='y'
                >
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/editors/actor/segments', 'Segments')}
                            {wireframe.segments.length > 0 &&
                                <>
                                    {' '}<span className='count'>{wireframe.segments.length}</span>
                                </>
                            }
                        </label>
                        {wireframe.segments.map((segment, segmentIndex) =>
                            <MeshSegment
                                index={segmentIndex}
                                segment={segment}
                                updateSegment={(s: Partial<MeshSegmentData>) => setSegment(segmentIndex, s)}
                                removeSegment={() => removeSegment(segmentIndex)}
                            />
                        )}
                        <button
                            className='theia-button add-button full-width'
                            onClick={addSegment}
                            title={nls.localizeByDefault('Add')}
                        >
                            <i className='codicon codicon-plus' />
                        </button>
                    </VContainer>
                </SortableList>
            }
            {
                wireframe.type === WireframeType.Sphere &&
                <HContainer gap={15}>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/editors/actor/radius', 'Radius')}
                        </label>
                        <Input
                            type="number"
                            min={MIN_SPHERE_RADIUS}
                            max={MAX_SPHERE_RADIUS}
                            step={STEP_SPHERE_RADIUS}
                            value={wireframe.radius}
                            setValue={setRadius}
                            commands={INPUT_BLOCKING_COMMANDS}
                            width={64}
                        />
                    </VContainer>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/editors/actor/drawCenter', 'Draw Center')}
                        </label>
                        <input
                            type="checkbox"
                            checked={wireframe.drawCenter}
                            onChange={toggleDrawCenter}
                            onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                            onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                        />
                    </VContainer>
                </HContainer>
            }
            {
                wireframe.type === WireframeType.Asterisk &&
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/actor/length', 'Length')}
                    </label>
                    <Input
                        type="number"
                        min={0}
                        max={255}
                        step={0.1}
                        value={wireframe.length}
                        setValue={setLength}
                        commands={INPUT_BLOCKING_COMMANDS}
                        width={64}
                    />
                </VContainer>
            }
        </VContainer >
    );
}
