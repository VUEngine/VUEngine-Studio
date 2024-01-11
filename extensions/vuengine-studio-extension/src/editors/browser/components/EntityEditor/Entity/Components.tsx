import { QuickPickItem, QuickPickOptions, nls } from '@theia/core';
import React, { useContext, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import VContainer from '../../Common/VContainer';
import AnimationsList from '../Animation/AnimationsList';
import CollidersList from '../Collider/CollidersList';
import BehaviorsList from '../Behavior/BehaviorsList';
import ChildrenList from './ChildrenList';
import ExtraProperties from './ExtraProperties';
import Physics from './Physics';
import { BgmapMode, ColliderType, DisplayMode, EntityEditorContext, EntityEditorContextType, Transparency, WireframeType } from '../EntityEditorTypes';
import SpritesList from '../Sprites/SpritesList';
import WireframesList from '../Wireframes/WireframesList';

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
        const updatedSprites = { ...data.sprites };
        updatedSprites.sprites = [
            ...updatedSprites.sprites,
            {
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
            },
        ];

        setData({
            sprites: updatedSprites,
        });
    };

    const addBehavior = (): void => {
        const updatedBehaviors = { ...data.behaviors };
        updatedBehaviors.behaviors.push('');

        setData({
            behaviors: updatedBehaviors,
        });
    };

    const addAnimation = (): void => {
        const updatedAnimations = { ...data.animations };
        updatedAnimations.animations = [
            ...updatedAnimations.animations,
            {
                name: data.animations.animations.length
                    ? ''
                    : nls.localize('vuengine/entityEditor/default', 'Default'),
                cycles: 8,
                frames: [],
                loop: true,
                callback: '',
            },
        ];

        setData({ animations: updatedAnimations });
    };

    const addCollider = (): void => {
        const colliders = { ...data.colliders };
        colliders.colliders = [
            ...colliders.colliders,
            {
                type: ColliderType.Ball,
                pixelSize: {
                    x: 0,
                    y: 0,
                    z: 0,
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
                    x: 0,
                    y: 0,
                    z: 0,
                },
                checkForCollisions: false,
                layers: [],
                layersToCheck: [],
            },
        ];

        setData({ colliders });
    };

    const addWireframe = (): void => {
        const updatedWireframes = { ...data.wireframes };
        updatedWireframes.wireframes = [
            ...updatedWireframes.wireframes,
            {
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
            },
        ];

        setData({ wireframes: updatedWireframes });
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
            const children = { ...data.children };
            children.children = [
                ...children.children,
                {
                    itemId: entityToAdd.id!,
                    position: {
                        x: 0,
                        y: 0,
                        z: 0,
                        parallax: 0,
                    },
                    name: '',
                    extraInfo: '',
                    loadRegardlessOfPosition: false,
                },
            ];

            setData({ children });
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
            showTab: data.sprites.sprites.length > 0,
            count: data.sprites.sprites.length,
            showCount: true,
            tabContent: <SpritesList />
        },
        {
            labelSingular: nls.localize('vuengine/entityEditor/animation', 'Animation'),
            labelPlural: nls.localize('vuengine/entityEditor/animations', 'Animations'),
            allowAdd: true,
            addAction: addAnimation,
            showTab: data.animations.animations.length > 0,
            count: data.animations.animations.length,
            showCount: true,
            tabContent: <AnimationsList />
        },
        {
            labelSingular: nls.localize('vuengine/entityEditor/collider', 'Collider'),
            labelPlural: nls.localize('vuengine/entityEditor/colliders', 'Colliders'),
            allowAdd: true,
            addAction: addCollider,
            showTab: data.colliders.colliders.length > 0,
            count: data.colliders.colliders.length,
            showCount: true,
            tabContent: <CollidersList />
        },
        {
            labelSingular: nls.localize('vuengine/entityEditor/wireframe', 'Wireframe'),
            labelPlural: nls.localize('vuengine/entityEditor/wireframes', 'Wireframes'),
            allowAdd: true,
            addAction: addWireframe,
            showTab: data.wireframes.wireframes.length > 0,
            count: data.wireframes.wireframes.length,
            showCount: true,
            tabContent: <WireframesList />
        },
        {
            labelSingular: nls.localize('vuengine/entityEditor/behavior', 'Behavior'),
            labelPlural: nls.localize('vuengine/entityEditor/behaviors', 'Behaviors'),
            allowAdd: true,
            addAction: addBehavior,
            showTab: data.behaviors.behaviors.length > 0,
            count: data.behaviors.behaviors.length,
            showCount: true,
            tabContent: <BehaviorsList />
        },
        {
            labelSingular: nls.localize('vuengine/entityEditor/child', 'Child'),
            labelPlural: nls.localize('vuengine/entityEditor/children', 'Children'),
            allowAdd: true,
            addAction: addPositionedEntity,
            showTab: data.children.children.length > 0,
            count: data.children.children.length,
            showCount: true,
            tabContent: <ChildrenList />
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
        const items: QuickPickItem[] = [];
        componentTypes.map((t, i) => {
            if (t.allowAdd) {
                items.push({
                    id: i.toString(),
                    label: t.labelSingular,
                });
            }
        });

        return services.quickPickService.show(
            items.sort((a, b) => a.label.localeCompare(b.label)),
            quickPickOptions
        );
    };

    const addComponent = async (): Promise<void> => {
        const componentToAdd = await showComponentSelection();
        if (componentToAdd) {
            componentTypes.map((t, i) => {
                if (componentToAdd.id === i.toString()) {
                    setCurrentTab(i);
                    t.addAction();
                }
            });
        }
    };

    const totalComponents = componentTypes.reduce((n, t) => n + t.count, 0);

    return <VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/entityEditor/components', 'Components')}
                {totalComponents > 0 &&
                    <>
                        {' '}<span className='count'>{totalComponents}</span>
                    </>
                }
            </label>
            {totalComponents > 0 &&
                <Tabs
                    className='react-tabs sub'
                    selectedIndex={currentTab}
                    onSelect={setCurrentTab}
                >
                    <TabList>
                        {componentTypes.map((t, i) =>
                            <Tab key={'tab' + i}>
                                {t.showTab && <>
                                    {t.labelPlural}
                                    {t.showCount && <>
                                        {' '}<span className='count'>
                                            {t.count}
                                        </span>
                                    </>}
                                </>}
                            </Tab>
                        )}
                    </TabList>
                    {componentTypes.map((t, j) =>
                        <TabPanel key={'tabpanel' + j}>
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
