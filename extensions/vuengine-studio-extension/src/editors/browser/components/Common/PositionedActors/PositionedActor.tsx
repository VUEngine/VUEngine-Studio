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
                    <VContainer grow={1}>
                        <label>
                            {nls.localize('vuengine/editors/actor/actor', 'Actor')}
                        </label>
                        <input
                            className='theia-input'
                            value={actor._fileUri.path.name}
                            title={actor._contributorUri.parent.path.relative(actor._fileUri.path)?.fsPath()}
                            disabled
                        />
                    </VContainer>
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
                    <HContainer>
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={positionedActor.onScreenPosition.x}
                            onChange={e => setPosition('x', e.target.value === '' ? 0 : parseInt(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={positionedActor.onScreenPosition.y}
                            onChange={e => setPosition('y', e.target.value === '' ? 0 : parseInt(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 48 }}
                            type='number'
                            value={positionedActor.onScreenPosition.z}
                            onChange={e => setPosition('z', e.target.value === '' ? 0 : parseInt(e.target.value))}
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
                        <input
                            className='theia-input'
                            style={{ width: 50 }}
                            type='number'
                            min={MIN_SCALE}
                            max={MAX_SCALE}
                            step={0.5}
                            value={positionedActor.onScreenScale?.x ?? 0}
                            onChange={e => setScale('x', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 50 }}
                            type='number'
                            min={MIN_SCALE}
                            max={MAX_SCALE}
                            step={0.5}
                            value={positionedActor.onScreenScale?.y ?? 0}
                            onChange={e => setScale('y', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        />
                        <input
                            className='theia-input'
                            style={{ width: 50 }}
                            type='number'
                            min={MIN_SCALE}
                            max={MAX_SCALE}
                            step={0.1}
                            value={positionedActor.onScreenScale?.z ?? 0}
                            onChange={e => setScale('z', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        />
                    </HContainer>
                </VContainer>

                <HContainer gap={15} wrap='wrap'>
                    <VContainer>
                        <label>Name</label>
                        <HContainer>
                            <input
                                className='theia-input'
                                style={{ width: 48 }}
                                value={positionedActor.name}
                                onChange={e => setName(e.target.value)}
                            />
                        </HContainer>
                    </VContainer>
                    <VContainer>
                        <label>Extra Info</label>
                        <HContainer>
                            <input
                                className='theia-input'
                                style={{ width: 48 }}
                                value={positionedActor.extraInfo}
                                onChange={e => setExtraInfo(e.target.value)}
                            />
                        </HContainer>
                    </VContainer>
                    <VContainer>
                        <label>
                            {nls.localize('vuengine/editors/general/loadRegardlessOfPosition', 'Always load')}
                        </label>
                        <input
                            type="checkbox"
                            checked={positionedActor.loadRegardlessOfPosition}
                            onChange={toggleLoadRegardlessOfPosition}
                        />
                    </VContainer>
                </HContainer>
            </>
                : <VContainer className='error'>
                    {nls.localize('vuengine/editors/general/actorNotFound', 'Actor could not be found')}
                </VContainer>}
        </VContainer>
    );
}
