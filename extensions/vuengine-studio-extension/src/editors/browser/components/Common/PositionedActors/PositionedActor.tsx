import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { WithContributor, WithFileUri } from '../../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { ActorData, MAX_SCALE, MIN_SCALE, PositionedActorData } from '../../ActorEditor/ActorEditorTypes';
import HContainer from '../Base/HContainer';
import Rotation from '../Rotation';
import { clamp } from '../Utils';
import VContainer from '../Base/VContainer';
import { PixelVector } from '../VUEngineTypes';
import Input from '../Base/Input';
import Checkbox from '../Base/Checkbox';

interface PositionedActorProps {
    positionedActor: PositionedActorData
    updatePositionedActor: (partialPositionedActor: Partial<PositionedActorData>) => void
}

export default function PositionedActor(props: PositionedActorProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { positionedActor, updatePositionedActor } = props;

    const actor = services.vesProjectService.getProjectDataItemById(positionedActor.itemId, 'Actor') as ActorData & WithFileUri & WithContributor;

    const setName = (name: string): void => {
        updatePositionedActor({
            name,
        });
    };

    const setExtraInfo = (extraInfo: string): void => {
        updatePositionedActor({
            extraInfo,
        });
    };

    const resetPosition = (): void => {
        updatePositionedActor({
            onScreenPosition: {
                ...positionedActor.onScreenPosition,
                x: 0,
                y: 0,
                z: 0,
            },
        });
    };

    const setPosition = (a: 'x' | 'y' | 'z', value: number): void => {
        updatePositionedActor({
            onScreenPosition: {
                ...positionedActor.onScreenPosition,
                [a]: clamp(value, -256, 256),
            },
        });
    };

    const setRotation = (rotation: PixelVector): void => {
        updatePositionedActor({
            onScreenRotation: rotation,
        });
    };

    const setScale = (a: 'x' | 'y' | 'z', value: number): void => {
        updatePositionedActor({
            onScreenScale: {
                ...positionedActor.onScreenScale,
                [a]: clamp(value, MIN_SCALE, MAX_SCALE),
            },
        });
    };

    const toggleLoadRegardlessOfPosition = (): void => {
        updatePositionedActor({
            loadRegardlessOfPosition: !positionedActor.loadRegardlessOfPosition,
        });
    };

    const openEditor = async (): Promise<void> => {
        if (actor && actor._fileUri) {
            const opener = await services.openerService.getOpener(actor._fileUri);
            await opener.open(actor._fileUri);
        }
    };

    return (
        <VContainer gap={15}>
            {actor ? <>
                <HContainer alignItems='end' grow={1}>
                    <Input
                        label={nls.localize('vuengine/editors/actor/actor', 'Actor')}
                        title={actor._contributorUri.parent.path.relative(actor._fileUri.path)?.fsPath()}
                        value={actor._fileUri.path.name}
                        grow={1}
                        disabled
                    />
                    <button
                        className='theia-button secondary'
                        onClick={openEditor}
                        title={nls.localize('vuengine/editors/actor/editActor', 'Edit Actor')}
                    >
                        <i className='codicon codicon-edit' />
                    </button>
                </HContainer>
                <VContainer>
                    <label>Position (x, y, z)</label>
                    <HContainer alignItems="center">
                        <Input
                            type="number"
                            value={positionedActor.onScreenPosition.x}
                            setValue={v => setPosition('x', v as number)}
                            width={64}
                        />
                        <Input
                            type="number"
                            value={positionedActor.onScreenPosition.y}
                            setValue={v => setPosition('y', v as number)}
                            width={64}
                        />
                        <Input
                            type="number"
                            value={positionedActor.onScreenPosition.z}
                            setValue={v => setPosition('z', v as number)}
                            width={64}
                        />
                        <i
                            className='codicon codicon-issues'
                            title={nls.localize('vuengine/editors/actor/center', 'Center')}
                            onClick={resetPosition}
                            style={{
                                cursor: 'pointer'
                            }}
                        />
                    </HContainer>
                </VContainer>
                <Rotation
                    rotation={positionedActor.onScreenRotation}
                    updateRotation={setRotation}
                />
                <VContainer>
                    <label>
                        {nls.localize('vuengine/editors/actor/scale', 'Scale (x, y, z)')}
                    </label>
                    <HContainer>
                        <Input
                            type="number"
                            min={MIN_SCALE}
                            max={MAX_SCALE}
                            step={0.5}
                            value={positionedActor.onScreenScale?.x ?? 0}
                            setValue={v => setScale('x', v as number)}
                            width={64}
                        />
                        <Input
                            type="number"
                            min={MIN_SCALE}
                            max={MAX_SCALE}
                            step={0.5}
                            value={positionedActor.onScreenScale?.y ?? 0}
                            setValue={v => setScale('y', v as number)}
                            width={64}
                        />
                        <Input
                            type="number"
                            min={MIN_SCALE}
                            max={MAX_SCALE}
                            step={0.1}
                            value={positionedActor.onScreenScale?.z ?? 0}
                            setValue={v => setScale('z', v as number)}
                            width={64}
                        />
                    </HContainer>
                </VContainer>
                <Input
                    label={nls.localizeByDefault('Name')}
                    value={positionedActor.name}
                    setValue={setName}
                    width={202}
                />
                <Input
                    label={nls.localize('vuengine/editors/general/extraInfo', 'Extra Info')}
                    value={positionedActor.extraInfo}
                    setValue={setExtraInfo}
                    width={202}
                />
                <Checkbox
                    label={nls.localize('vuengine/editors/general/loadRegardlessOfPosition', 'Always load')}
                    checked={positionedActor.loadRegardlessOfPosition}
                    setChecked={toggleLoadRegardlessOfPosition}
                />
            </>
                : <VContainer className='error'>
                    {nls.localize('vuengine/editors/general/actorNotFound', 'Actor could not be found')}
                </VContainer>
            }
        </VContainer >
    );
}
