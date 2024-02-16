import { QuickPickItem, QuickPickOptions, QuickPickSeparator, nls } from '@theia/core';
import React, { useContext } from 'react';
import { Tree } from 'react-arborist';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import VContainer from '../../Common/VContainer';
import { BgmapMode, ColliderType, ComponentKey, DisplayMode, EntityEditorContext, EntityEditorContextType, Transparency, WireframeType } from '../EntityEditorTypes';
import { ScriptType } from '../Scripts/ScriptTypes';
import ComponentTreeNode from './ComponentTreeNode';

interface ComponentType {
    key: ComponentKey | 'extraProperties' | 'physics'
    componentKey?: ComponentKey
    labelSingular: string
    labelPlural: string
    allowAdd: boolean
    addAction: () => void
    hasContent: boolean
}

interface TreeNode {
    id: string
    name: string
    children?: TreeNode[]
}

export default function ComponentTree(): React.JSX.Element {
    const { data, setData, state } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { services } = useContext(EditorsContext) as EditorsContextType;

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
                    t.addAction();
                    // setState({ currentComponent: `${t.key}-${i}` });
                }
            });
        }
    };

    const addSprite = (): void => {
        const sprites = [...data.components?.sprites || []];
        sprites.push({
            _imageData: 0,
            name: nls.localize('vuengine/entityEditor/sprite', 'Sprite'),
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
        const behaviors = [...data.components?.behaviors || []];
        behaviors.push({
            name: nls.localize('vuengine/entityEditor/behavior', 'Behavior'),
        });

        setData({
            components: {
                ...data.components,
                behaviors
            },
        });
    };

    const addAnimation = (): void => {
        const animations = [...data.components?.animations || []];
        animations.push({
            name: nls.localize('vuengine/entityEditor/animation', 'Animation'),
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
        const colliders = [...data.components?.colliders || []];
        colliders.push({
            name: nls.localize('vuengine/entityEditor/collider', 'Collider'),
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

    const addScript = (): void => {
        const scripts = [...data.components?.scripts || []];
        scripts.push({
            name: nls.localize('vuengine/entityEditor/script', 'Script'),
            type: ScriptType.Custom,
            script: [],
        });

        setData({
            components: {
                ...data.components,
                scripts,
            }
        });
    };

    const addWireframe = (): void => {
        const wireframes = [...data.components?.wireframes || []];
        wireframes.push({
            name: nls.localize('vuengine/entityEditor/wireframe', 'Wireframe'),
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
            const children = [...data.components?.children || []];
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

    const moveComponent = (
        dragIds: string[],
        parentId: string,
        targetIndex: number,
    ): void => {
        const [type, indexString] = dragIds[0].split('-');
        const currentIndex = parseInt(indexString || '-1');

        if (type === parentId) {
            // @ts-ignore
            const componentsOfType = [...data.components[type]];
            const removedItem = componentsOfType.splice(currentIndex, 1).pop();
            componentsOfType.splice(targetIndex > currentIndex
                ? targetIndex - 1
                : targetIndex, 0, removedItem
            );
            setData({
                components: {
                    ...data.components,
                    [type]: componentsOfType,
                }
            });
        }
    };

    const componentTypes: ComponentType[] = [
        {
            key: 'sprites',
            componentKey: 'sprites',
            labelSingular: nls.localize('vuengine/entityEditor/sprite', 'Sprite'),
            labelPlural: nls.localize('vuengine/entityEditor/sprites', 'Sprites'),
            allowAdd: true,
            addAction: addSprite,
            hasContent: data.components?.sprites?.length > 0,
        },
        {
            key: 'animations',
            componentKey: 'animations',
            labelSingular: nls.localize('vuengine/entityEditor/animation', 'Animation'),
            labelPlural: nls.localize('vuengine/entityEditor/animations', 'Animations'),
            allowAdd: true,
            addAction: addAnimation,
            hasContent: data.components?.animations?.length > 0,
        },
        {
            key: 'colliders',
            componentKey: 'colliders',
            labelSingular: nls.localize('vuengine/entityEditor/collider', 'Collider'),
            labelPlural: nls.localize('vuengine/entityEditor/colliders', 'Colliders'),
            allowAdd: true,
            addAction: addCollider,
            hasContent: data.components?.colliders?.length > 0,
        },
        {
            key: 'wireframes',
            componentKey: 'wireframes',
            labelSingular: nls.localize('vuengine/entityEditor/wireframe', 'Wireframe'),
            labelPlural: nls.localize('vuengine/entityEditor/wireframes', 'Wireframes'),
            allowAdd: true,
            addAction: addWireframe,
            hasContent: data.components?.wireframes?.length > 0,
        },
        {
            key: 'behaviors',
            componentKey: 'behaviors',
            labelSingular: nls.localize('vuengine/entityEditor/behavior', 'Behavior'),
            labelPlural: nls.localize('vuengine/entityEditor/behaviors', 'Behaviors'),
            allowAdd: true,
            addAction: addBehavior,
            hasContent: data.components?.behaviors?.length > 0,
        },
        {
            key: 'children',
            componentKey: 'children',
            labelSingular: nls.localize('vuengine/entityEditor/child', 'Child'),
            labelPlural: nls.localize('vuengine/entityEditor/children', 'Children'),
            allowAdd: true,
            addAction: addPositionedEntity,
            hasContent: data.components?.children?.length > 0,
        },
        {
            key: 'scripts',
            componentKey: 'scripts',
            labelSingular: nls.localize('vuengine/entityEditor/script', 'Script'),
            labelPlural: nls.localize('vuengine/entityEditor/scripts', 'Scripts'),
            allowAdd: true,
            addAction: addScript,
            hasContent: data.components?.scripts?.length > 0,
        },
        {
            key: 'physics',
            labelSingular: nls.localize('vuengine/entityEditor/physics', 'Physical Properties'),
            labelPlural: nls.localize('vuengine/entityEditor/physics', 'Physical Properties'),
            allowAdd: !data.physics.enabled,
            addAction: enablePhysics,
            hasContent: data.physics.enabled,
        },
        {
            key: 'extraProperties',
            labelSingular: nls.localize('vuengine/entityEditor/extraProperties', 'Extra Properties'),
            labelPlural: nls.localize('vuengine/entityEditor/extraProperties', 'Extra Properties'),
            allowAdd: !data.extraProperties.enabled,
            addAction: enableExtraProperties,
            hasContent: data.extraProperties.enabled,
        },
    ];

    const treeData: TreeNode[] = [];
    componentTypes
        .sort((a, b) => a.labelPlural.localeCompare(b.labelPlural))
        .map(componentType => {
            if (componentType.hasContent) {
                const newEntry: TreeNode = {
                    id: componentType.key,
                    name: componentType.labelPlural,
                };
                if (componentType.componentKey && data.components[componentType.componentKey]) {
                    const newEntryChildren: TreeNode[] = [];
                    data.components[componentType.componentKey].map((c, i) => {
                        newEntryChildren.push({
                            id: `${componentType.key}-${i}`,
                            // @ts-ignore
                            name: c.name ? c.name : `${componentType.labelPlural} ${i + 1}`,
                        });
                    });
                    newEntry.children = newEntryChildren;
                }
                treeData.push(newEntry);
            }
        });

    return (
        <VContainer>
            <label>
                {nls.localize('vuengine/entityEditor/components', 'Components')}
            </label>
            <div className='ves-tree'>
                <Tree
                    data={treeData}
                    indent={24}
                    rowHeight={24}
                    openByDefault={true}
                    width='100%'
                    onMove={({ dragIds, parentId, index }) => moveComponent(dragIds, parentId!, index)}
                    selection={state.currentComponent.split('-', 2).join('-')} // ignore sub selections
                >
                    {ComponentTreeNode}
                </Tree>
            </div>
            <button
                className='theia-button add-button full-width'
                onClick={addComponent}
                title={nls.localize('vuengine/entityEditor/addComponent', 'Add Component')}
            >
                <i className='codicon codicon-plus' />
            </button>
        </VContainer>
    );
}
