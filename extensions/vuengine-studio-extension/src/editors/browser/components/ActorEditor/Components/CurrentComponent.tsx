import React, { useContext } from 'react';
import VContainer from '../../Common/Base/VContainer';
import PositionedActor from '../../Common/PositionedActors/PositionedActor';
import Body from '../Actor/Body';
import ExtraProperties from '../Actor/ExtraProperties';
import Logic from '../Actor/Logic';
import { ActorEditorSaveDataOptions } from '../ActorEditor';
import {
    ActorEditorContext,
    ActorEditorContextType,
    AnimationData,
    ColliderData,
    ComponentData,
    ComponentKey,
    MutatorData,
    SpriteData,
    WireframeData,
} from '../ActorEditorTypes';
import Animation from '../Animation/Animation';
import AnimationsSettings from '../Animation/AnimationsSettings';
import Collider from '../Collider/Collider';
import CollidersSettings from '../Collider/CollidersSettings';
import Mutator from '../Mutator/Mutator';
import Sprite from '../Sprites/Sprite';
import SpritesSettings from '../Sprites/SpritesSettings';
import Wireframe from '../Wireframes/Wireframe';

interface CurrentComponentProps {
    isMultiFileAnimation: boolean
    updateComponent: (key: ComponentKey, index: number, partialData: Partial<ComponentData>, options?: ActorEditorSaveDataOptions) => void,
}

export default function CurrentComponent(props: CurrentComponentProps): React.JSX.Element {
    const { isMultiFileAnimation, updateComponent } = props;
    const { data, currentComponent } = useContext(ActorEditorContext) as ActorEditorContextType;

    const getComponentEditor = (): React.JSX.Element => {
        const [type, indexString] = currentComponent.split('-');
        const index = parseInt(indexString || '-1');
        if (index > -1) {
            switch (type) {
                case 'animations':
                    return <Animation
                        index={index}
                        animation={data.components.animations[index]}
                        updateAnimation={(partialData: Partial<AnimationData>) => updateComponent('animations', index, partialData)}
                        totalFrames={data.animations.totalFrames}
                        isMultiFileAnimation={isMultiFileAnimation}
                    />;
                case 'mutators':
                    return <Mutator
                        mutator={data.components.mutators[index]}
                        updateMutator={(partialData: Partial<MutatorData>) => updateComponent('mutators', index, partialData)}
                    />;
                case 'children':
                    return <PositionedActor
                        positionedActor={data.components.children[index]}
                        updatePositionedActor={partialPositionedActor => updateComponent('children', index, partialPositionedActor)}
                    />;
                case 'colliders':
                    return <Collider
                        collider={data.components.colliders[index]}
                        updateCollider={(partialData: Partial<ColliderData>) => updateComponent('colliders', index, partialData)}
                    />;
                case 'sprites':
                    return <Sprite
                        sprite={data.components.sprites[index]}
                        updateSprite={(partialData: Partial<SpriteData>, options?: ActorEditorSaveDataOptions) => updateComponent('sprites', index, partialData, options)}
                        isMultiFileAnimation={isMultiFileAnimation}
                    />;
                case 'wireframes':
                    return <Wireframe
                        wireframe={data.components.wireframes[index]}
                        updateWireframe={(partialData: Partial<WireframeData>) => updateComponent('wireframes', index, partialData)}
                    />;
            }
        } else {
            switch (type) {
                case 'extraProperties':
                    return <ExtraProperties />;
                case 'logic':
                    return <Logic />;
                case 'body':
                    return <Body />;
                /*
                default:
                    return <div className="lightLabel">
                        {nls.localize(
                            'vuengine/actorEditor/noComponentSelected',
                            'No component selected. Select any component to edit its properties.',
                        )}
                    </div>;
                */
            }
        }

        return <></>;
    };

    return (
        <VContainer
            gap={15}
            style={{
                overflow: 'auto',
                padding: 'var(--padding)',
                zIndex: 1,
            }}
        >
            {getComponentEditor()}
            {currentComponent === 'animations' &&
                <AnimationsSettings
                    isMultiFileAnimation={isMultiFileAnimation}
                />
            }
            {currentComponent === 'sprites' &&
                <SpritesSettings />
            }
            {currentComponent === 'colliders' &&
                <CollidersSettings />
            }
        </VContainer>
    );
}
