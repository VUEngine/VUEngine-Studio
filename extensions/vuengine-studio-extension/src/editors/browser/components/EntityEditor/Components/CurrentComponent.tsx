import React, { useContext } from 'react';
import PositionedEntity from '../../Common/PositionedEntities/PositionedEntity';
import VContainer from '../../Common/VContainer';
import Animation from '../Animation/Animation';
import Behavior from '../Behavior/Behavior';
import Collider from '../Collider/Collider';
import CollidersSettings from '../Collider/CollidersSettings';
import ExtraProperties from '../Entity/ExtraProperties';
import Physics from '../Entity/Physics';
import { EntityEditorSaveDataOptions } from '../EntityEditor';
import {
    AnimationData,
    BehaviorData,
    ColliderData,
    ComponentData,
    ComponentKey,
    EntityEditorContext,
    EntityEditorContextType,
    SpriteData,
    WireframeData,
} from '../EntityEditorTypes';
import Sprite from '../Sprites/Sprite';
import SpritesSettings from '../Sprites/SpritesSettings';
import Wireframe from '../Wireframes/Wireframe';
import ScriptedActionDetail from '../Scripts/ScriptedActionDetail';

interface CurrentComponentProps {
    isMultiFileAnimation: boolean
}

export default function CurrentComponent(props: CurrentComponentProps): React.JSX.Element {
    const { isMultiFileAnimation } = props;
    const { state, data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;

    const updateComponent = (key: ComponentKey, index: number, partialData: Partial<ComponentData>, options?: EntityEditorSaveDataOptions): void => {
        const componentsArray = [...data.components[key]];
        componentsArray[index] = {
            ...componentsArray[index],
            ...partialData,
        };

        setData({
            components: {
                ...data.components,
                [key]: componentsArray,
            }
        }, options);
    };

    const getComponentEditor = (): React.JSX.Element => {
        const [type, indexString] = state.currentComponent.split('-');
        const index = parseInt(indexString || '-1');
        if (index > -1) {
            switch (type) {
                case 'animations':
                    return <Animation
                        index={index}
                        animation={data.components.animations[index]}
                        updateAnimation={(partialData: Partial<AnimationData>) => updateComponent('animations', index, partialData)}
                        totalFrames={data.animations.totalFrames}
                    />;
                case 'behaviors':
                    return <Behavior
                        behavior={data.components.behaviors[index]}
                        updateBehavior={(partialData: Partial<BehaviorData>) => updateComponent('behaviors', index, partialData)}
                    />;
                case 'children':
                    return <PositionedEntity
                        positionedEntity={data.components.children[index]}
                        updatePositionedEntity={partialPositionedEntity => updateComponent('children', index, partialPositionedEntity)}
                    />;
                case 'colliders':
                    return <Collider
                        collider={data.components.colliders[index]}
                        updateCollider={(partialData: Partial<ColliderData>) => updateComponent('colliders', index, partialData)}
                    />;
                case 'scripts':
                    return <ScriptedActionDetail />;
                case 'sprites':
                    return <Sprite
                        sprite={data.components.sprites[index]}
                        updateSprite={(partialData: Partial<SpriteData>) => updateComponent('sprites', index, partialData)}
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
                case 'physics':
                    return <Physics />;
            }
        }

        return <></>;
    };

    const componentEditor = getComponentEditor();

    return (
        <VContainer gap={30}>
            {state.currentComponent?.startsWith('sprites') &&
                <SpritesSettings
                    isMultiFileAnimation={isMultiFileAnimation}
                />
            }
            {state.currentComponent?.startsWith('colliders') &&
                <CollidersSettings />
            }
            {componentEditor}
        </VContainer>
    );
}
