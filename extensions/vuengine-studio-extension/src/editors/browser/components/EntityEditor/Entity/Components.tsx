import { QuickPickItem, QuickPickOptions, QuickPickSeparator, nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import PositionedEntity from '../../Common/PositionedEntities/PositionedEntity';
import VContainer from '../../Common/VContainer';
import Animation from '../Animation/Animation';
import Behavior from '../Behavior/Behavior';
import Collider from '../Collider/Collider';
import { EntityEditorSaveDataOptions } from '../EntityEditor';
import {
    AnimationData,
    BehaviorData,
    BgmapMode,
    ColliderData,
    ColliderType,
    ComponentData,
    ComponentKey,
    DisplayMode,
    EntityEditorContext,
    EntityEditorContextType,
    SpriteData,
    Transparency,
    WireframeData,
    WireframeType,
} from '../EntityEditorTypes';
import Sprite from '../Sprites/Sprite';
import Wireframe from '../Wireframes/Wireframe';
import ExtraProperties from './ExtraProperties';
import Physics from './Physics';

interface ComponentType {
    labelSingular: string
    labelPlural: string
    allowAdd: boolean
    addAction: () => void
    showTab: boolean
    count: number
    showCount: boolean
    tabContent: React.JSX.Element
}

export default function Components(): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;
    const [currentTab, setCurrentTab] = useState<number>(0);

    const addSprite = (): void => {
        const sprites = [...data.components?.sprites];
        sprites.push({
            _imageData: 0,
            bgmapMode: BgmapMode.Bgmap,
            displayMode: DisplayMode.Both,
            transparency: Transparency.None,
            displacement: {
                x: 0,
                y: 0,
                z: 0,
                parallax: 0,
            },
            manipulationFunction: '',
            texture: {
                files: [],
                padding: {
                    x: 0,
                    y: 0,
                },
                palette: 0,
                recycleable: false,
                flip: {
                    horizontal: false,
                    vertical: false,
                },
            },
        });

        setData({
            components: {
                ...data.components,
                sprites
            }
        });
    };

    const addBehavior = (): void => {
        const behaviors = [...data.components?.behaviors];
        behaviors.push({
            'name': '',
        });

        setData({
            components: {
                ...data.components,
                behaviors
            },
        });
    };

    const addAnimation = (): void => {
        const animations = [...data.components?.animations];
        animations.push({
            name: data.components?.animations.length
                ? ''
                : nls.localize('vuengine/entityEditor/default', 'Default'),
            cycles: 8,
            frames: [],
            loop: true,
            callback: '',
        });

        setData({
            components: {
                ...data.components,
                animations
            }
        });
    };

    const addCollider = (): void => {
        const colliders = [...data.components?.colliders];
        colliders.push({
            type: ColliderType.Ball,
            pixelSize: {
                x: 32,
                y: 32,
                z: 32,
            },
            displacement: {
                x: 0,
                y: 0,
                z: 0,
                parallax: 0,
            },
            rotation: {
                x: 0,
                y: 0,
                z: 0,
            },
            scale: {
                x: 1,
                y: 1,
                z: 1,
            },
            checkForCollisions: false,
            layers: [],
            layersToCheck: [],
        });

        setData({
            components: {
                ...data.components,
                colliders,
            }
        });
    };

    const addWireframe = (): void => {
        const wireframes = [...data.components?.wireframes];
        wireframes.push({
            wireframe: {
                type: WireframeType.Sphere,
                displacement: {
                    x: 0,
                    y: 0,
                    z: 0,
                },
                color: 3,
                transparency: Transparency.None,
                interlaced: false,
            },
            segments: [],
            length: 0,
            radius: 0,
            drawCenter: true,
        });

        setData({
            components: {
                ...data.components,
                wireframes,
            }
        });
    };

    const showEntitySelection = async (): Promise<QuickPickItem | undefined> => {
        const quickPickOptions: QuickPickOptions<QuickPickItem> = {
            title: nls.localize('vuengine/editors/selectEntity', 'Select Entity'),
            placeholder: nls.localize('vuengine/editors/selectEntityToAdd', 'Select an Entity to add...'),
        };
        const items: QuickPickItem[] = [];
        const entities = services.vesProjectService.getProjectDataItemsForType('Entity');
        if (entities) {
            Object.keys(entities).map(k => {
                if (k !== data._id) {
                    const entity = entities[k];
                    // @ts-ignore
                    if (entity._id) {
                        // @ts-ignore
                        items.push({ id: entity._id, label: entity.name || entity._id });
                    }
                }
            });
        }

        return services.quickPickService.show(items, quickPickOptions);
    };

    const addPositionedEntity = async (): Promise<void> => {
        const entityToAdd = await showEntitySelection();
        if (entityToAdd !== undefined) {
            const children = [...data.components?.children];
            children.push({
                itemId: entityToAdd.id!,
                onScreenPosition: {
                    x: 0,
                    y: 0,
                    z: 0,
                    zDisplacement: 0,
                },
                name: '',
                children: [],
                extraInfo: '',
                loadRegardlessOfPosition: false,
            });

            setData({
                components: {
                    ...data.components,
                    children,
                }
            });
        }
    };

    const enablePhysics = (): void => {
        setData({
            physics: {
                ...data.physics,
                enabled: true,
            }
        });
    };

    const enableExtraProperties = (): void => {
        setData({
            extraProperties: {
                ...data.extraProperties,
                enabled: true,
            }
        });
    };

    const componentTypes: ComponentType[] = [
        {
            labelSingular: nls.localize('vuengine/entityEditor/sprite', 'Sprite'),
            labelPlural: nls.localize('vuengine/entityEditor/sprites', 'Sprites'),
            allowAdd: true,
            addAction: addSprite,
            showTab: data.components?.sprites.length > 0,
            count: data.components?.sprites.length,
            showCount: true,
            tabContent: <VContainer>
                {data.components?.sprites.map((sprite, index) =>
                    <Sprite
                        key={`sprite-${index}`}
                        index={index}
                        sprite={sprite}
                        updateSprite={(partialData: Partial<SpriteData>) => updateComponent('sprites', index, partialData)}
                        removeSprite={() => removeComponent('sprites', index)}
                    />
                )}
            </VContainer>
        },
        {
            labelSingular: nls.localize('vuengine/entityEditor/animation', 'Animation'),
            labelPlural: nls.localize('vuengine/entityEditor/animations', 'Animations'),
            allowAdd: true,
            addAction: addAnimation,
            showTab: data.components?.animations.length > 0,
            count: data.components?.animations.length,
            showCount: true,
            tabContent: <VContainer>
                {data.components?.animations.map((animation, index) =>
                    <Animation
                        key={`animation-${index}`}
                        index={index}
                        animation={animation}
                        updateAnimation={(partialData: Partial<AnimationData>) => updateComponent('animations', index, partialData)}
                        removeAnimation={() => removeComponent('animations', index)}
                        totalFrames={data.animations.totalFrames}
                    />
                )}
            </VContainer>
        },
        {
            labelSingular: nls.localize('vuengine/entityEditor/collider', 'Collider'),
            labelPlural: nls.localize('vuengine/entityEditor/colliders', 'Colliders'),
            allowAdd: true,
            addAction: addCollider,
            showTab: data.components?.colliders.length > 0,
            count: data.components?.colliders.length,
            showCount: true,
            tabContent: <VContainer>
                {data.components?.colliders.map((collider, index) =>
                    <Collider
                        key={`collider-${index}`}
                        collider={collider}
                        updateCollider={(partialData: Partial<ColliderData>) => updateComponent('colliders', index, partialData)}
                        removeCollider={() => removeComponent('colliders', index)}
                    />
                )}
            </VContainer>
        },
        {
            labelSingular: nls.localize('vuengine/entityEditor/wireframe', 'Wireframe'),
            labelPlural: nls.localize('vuengine/entityEditor/wireframes', 'Wireframes'),
            allowAdd: true,
            addAction: addWireframe,
            showTab: data.components?.wireframes.length > 0,
            count: data.components?.wireframes.length,
            showCount: true,
            tabContent: <VContainer>
                {data.components?.wireframes.map((wireframe, index) =>
                    <Wireframe
                        key={`wireframe-${index}`}
                        wireframe={wireframe}
                        updateWireframe={(partialData: Partial<WireframeData>) => updateComponent('wireframes', index, partialData)}
                        removeWireframe={() => removeComponent('wireframes', index)}
                    />
                )}
            </VContainer>
        },
        {
            labelSingular: nls.localize('vuengine/entityEditor/behavior', 'Behavior'),
            labelPlural: nls.localize('vuengine/entityEditor/behaviors', 'Behaviors'),
            allowAdd: true,
            addAction: addBehavior,
            showTab: data.components?.behaviors.length > 0,
            count: data.components?.behaviors.length,
            showCount: true,
            tabContent: <VContainer>
                {data.components?.behaviors.map((behavior, index) =>
                    <Behavior
                        key={'behavior-' + index}
                        behavior={behavior}
                        updateBehavior={(partialData: Partial<BehaviorData>) => updateComponent('behaviors', index, partialData)}
                        removeBehavior={() => removeComponent('behaviors', index)}
                    />
                )}
            </VContainer>
        },
        {
            labelSingular: nls.localize('vuengine/entityEditor/child', 'Child'),
            labelPlural: nls.localize('vuengine/entityEditor/children', 'Children'),
            allowAdd: true,
            addAction: addPositionedEntity,
            showTab: data.components?.children.length > 0,
            count: data.components?.children.length,
            showCount: true,
            tabContent: <VContainer>
                {data.components?.children.map((child, index) =>
                    <PositionedEntity
                        key={'child-' + index}
                        positionedEntity={child}
                        updatePositionedEntity={partialPositionedEntity => updateComponent('children', index, partialPositionedEntity)}
                        removePositionedEntity={() => removeComponent('children', index)}
                    />
                )}
            </VContainer>
        },
        {
            labelSingular: nls.localize('vuengine/entityEditor/physics', 'Physics'),
            labelPlural: nls.localize('vuengine/entityEditor/physics', 'Physics'),
            allowAdd: !data.physics.enabled,
            addAction: enablePhysics,
            showTab: data.physics.enabled,
            count: data.physics.enabled ? 1 : 0,
            showCount: false,
            tabContent: <Physics />
        },
        {
            labelSingular: nls.localize('vuengine/entityEditor/extraProperties', 'Extra Properties'),
            labelPlural: nls.localize('vuengine/entityEditor/extraProperties', 'Extra Properties'),
            allowAdd: !data.extraProperties.enabled,
            addAction: enableExtraProperties,
            showTab: data.extraProperties.enabled,
            count: data.extraProperties.enabled ? 1 : 0,
            showCount: false,
            tabContent: <ExtraProperties />
        },
    ];

    const showComponentSelection = async (): Promise<QuickPickItem | undefined> => {
        const quickPickOptions: QuickPickOptions<QuickPickItem> = {
            title: nls.localize('vuengine/editors/addComponent', 'Add Component'),
            placeholder: nls.localize('vuengine/editors/selectComponentTypeToAdd', 'Select a component type to add...'),
        };
        const items: (QuickPickItem | QuickPickSeparator)[] = [];
        componentTypes.map((t, i) => {
            if (t.allowAdd) {
                items.push({
                    id: i.toString(),
                    label: t.labelSingular,
                });
            }
        });

        return services.quickPickService.show(
            items,
            quickPickOptions
        );
    };

    const addComponent = async (): Promise<void> => {
        const componentToAdd = await showComponentSelection();
        if (componentToAdd) {
            componentTypes.map((t, i) => {
                if (componentToAdd.id === i.toString()) {
                    setCurrentTab(i + 1);
                    t.addAction();
                }
            });
        }
    };

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

    const removeComponent = async (key: ComponentKey, index: number): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/entityEditor/removeComponent', 'Remove Component'),
            msg: nls.localize('vuengine/entityEditor/areYouSureYouWantToRemoveComponent', 'Are you sure you want to remove this component?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            setData({
                components: {
                    ...data.components,
                    [key]: [
                        ...data.components[key].slice(0, index),
                        ...data.components[key].slice(index + 1)
                    ],
                }
            });
        }
    };

    const totalComponents = componentTypes.reduce((n, t) => n + t.count, 0);

    return <VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/entityEditor/components', 'Components')}
            </label>
            {totalComponents > 0 &&
                <Tabs
                    className='react-tabs sub'
                    selectedIndex={currentTab}
                    onSelect={setCurrentTab}
                >
                    <TabList>
                        <Tab>
                            {nls.localize('vuengine/entityEditor/all', 'All')}
                            {' '}<span className='count'>
                                {totalComponents}
                            </span>
                        </Tab>
                        {componentTypes.map((t, i) =>
                            <Tab key={'tab' + i}>
                                {t.showTab && <>
                                    {t.labelPlural}
                                    {t.showCount && <>
                                        {' '}<span key={'tab-' + i} className='count'>
                                            {t.count}
                                        </span>
                                    </>}
                                </>}
                            </Tab>
                        )}
                    </TabList>
                    <TabPanel>
                        <VContainer>
                            {componentTypes.map((t, i) =>
                                <>
                                    {t.showTab && <>
                                        {totalComponents > 1 &&
                                            <label key={'tabPanel-' + i} className='light-label'>{t.labelPlural}</label>
                                        }
                                        {t.tabContent}
                                    </>}
                                </>
                            )}
                        </VContainer>
                    </TabPanel>
                    {componentTypes.map((t, i) =>
                        <TabPanel key={'tabPanel-' + i}>
                            {t.showTab && t.tabContent}
                        </TabPanel>
                    )}
                </Tabs>
            }
            <button
                className='theia-button add-button large full-width'
                onClick={addComponent}
                title={nls.localize('vuengine/entityEditor/addComponent', 'Add Component')}
            >
                <i className='codicon codicon-plus' />
            </button>
        </VContainer>
    </VContainer >;
}
