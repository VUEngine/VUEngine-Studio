import {
    Asterisk,
    Atom,
    CaretDown,
    CaretRight,
    CircleDashed,
    Cube,
    FilmStrip,
    ImageSquare,
    Minus,
    Plus,
    SneakerMove,
    TreeStructure,
    UserFocus,
} from '@phosphor-icons/react';
import { QuickPickItem, QuickPickOptions, nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/HContainer';
import VContainer from '../../Common/VContainer';
import { BgmapMode, ColliderType, ComponentKey, DisplayMode, EntityEditorContext, EntityEditorContextType, Transparency, WireframeType } from '../EntityEditorTypes';

interface ComponentType {
    key?: ComponentKey
    labelSingular: string
    labelPlural: string
    addAction: () => void
    hasContent: boolean
    canHaveMany: boolean
    count: number
    iconComponent: React.JSX.Element
}

export default function ComponentsTree(): React.JSX.Element {
    const { data, setData } = useContext(EntityEditorContext) as EntityEditorContextType;
    const { services } = useContext(EditorsContext) as EditorsContextType;

    const addSprite = (): void => {
        const sprites = [...data.components?.sprites || []];
        sprites.push({
            _imageData: 0,
            name: '',
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
            name: '',
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
        const colliders = [...data.components?.colliders || []];
        colliders.push({
            name: '',
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
        const wireframes = [...data.components?.wireframes || []];
        wireframes.push({
            name: '',
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

    const addScript = (): void => {
        const scripts = [...data.components?.scripts || []];
        scripts.push({
            function: '',
        });

        setData({
            components: {
                ...data.components,
                scripts,
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

    const togglePhysics = (): void => {
        setData({
            physics: {
                ...data.physics,
                enabled: !data.physics.enabled,
            }
        });
    };

    const toggleExtraProperties = (): void => {
        setData({
            extraProperties: {
                ...data.extraProperties,
                enabled: !data.extraProperties.enabled,
            }
        });
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

    const componentTypes: ComponentType[] = [
        {
            key: 'sprites',
            labelSingular: nls.localize('vuengine/entityEditor/sprite', 'Sprite'),
            labelPlural: nls.localize('vuengine/entityEditor/sprites', 'Sprites'),
            addAction: addSprite,
            hasContent: data.components?.sprites?.length > 0,
            canHaveMany: true,
            count: data.components?.sprites?.length,
            iconComponent: <ImageSquare />
        },
        {
            key: 'animations',
            labelSingular: nls.localize('vuengine/entityEditor/animation', 'Animation'),
            labelPlural: nls.localize('vuengine/entityEditor/animations', 'Animations'),
            addAction: addAnimation,
            hasContent: data.components?.animations?.length > 0,
            canHaveMany: true,
            count: data.components?.animations?.length,
            iconComponent: <FilmStrip />
        },
        {
            key: 'colliders',
            labelSingular: nls.localize('vuengine/entityEditor/collider', 'Collider'),
            labelPlural: nls.localize('vuengine/entityEditor/colliders', 'Colliders'),
            addAction: addCollider,
            hasContent: data.components?.colliders?.length > 0,
            canHaveMany: true,
            count: data.components?.colliders?.length,
            iconComponent: <CircleDashed />
        },
        {
            key: 'wireframes',
            labelSingular: nls.localize('vuengine/entityEditor/wireframe', 'Wireframe'),
            labelPlural: nls.localize('vuengine/entityEditor/wireframes', 'Wireframes'),
            addAction: addWireframe,
            hasContent: data.components?.wireframes?.length > 0,
            canHaveMany: true,
            count: data.components?.wireframes?.length,
            iconComponent: <Cube />
        },
        {
            key: 'behaviors',
            labelSingular: nls.localize('vuengine/entityEditor/behavior', 'Behavior'),
            labelPlural: nls.localize('vuengine/entityEditor/behaviors', 'Behaviors'),
            addAction: addBehavior,
            hasContent: data.components?.behaviors?.length > 0,
            canHaveMany: true,
            count: data.components?.behaviors?.length,
            iconComponent: <SneakerMove />
        },
        {
            key: 'children',
            labelSingular: nls.localize('vuengine/entityEditor/child', 'Child'),
            labelPlural: nls.localize('vuengine/entityEditor/children', 'Children'),
            addAction: addPositionedEntity,
            hasContent: data.components?.children?.length > 0,
            canHaveMany: true,
            count: data.components?.children?.length,
            iconComponent: <UserFocus />
        },
        {
            key: 'scripts',
            labelSingular: nls.localize('vuengine/entityEditor/script', 'Script'),
            labelPlural: nls.localize('vuengine/entityEditor/scripts', 'Scripts'),
            addAction: addScript,
            hasContent: data.components?.scripts?.length > 0,
            canHaveMany: true,
            count: data.components?.scripts?.length,
            iconComponent: <TreeStructure />
        },
        {
            labelSingular: nls.localize('vuengine/entityEditor/physicalProperties', 'Physical Properties'),
            labelPlural: nls.localize('vuengine/entityEditor/physicalProperties', 'Physical Properties'),
            addAction: togglePhysics,
            hasContent: data.physics.enabled,
            canHaveMany: false,
            count: data.physics.enabled ? 1 : 0,
            iconComponent: <Atom />
        },
        {
            labelSingular: nls.localize('vuengine/entityEditor/extraProperties', 'Extra Properties'),
            labelPlural: nls.localize('vuengine/entityEditor/extraProperties', 'Extra Properties'),
            addAction: toggleExtraProperties,
            hasContent: data.extraProperties.enabled,
            canHaveMany: false,
            count: data.extraProperties.enabled ? 1 : 0,
            iconComponent: <Asterisk />
        },
    ];

    return <VContainer>
        {componentTypes.map((componentType, i) => <>
            <HContainer key={`component-${i}`} alignItems='center' className={!componentType.hasContent ? 'empty' : ''}>
                <HContainer alignItems='center' grow={1}>
                    <span style={{ alignItems: 'center', visibility: !componentType.hasContent ? 'hidden' : 'visible' }}>
                        {componentType.key
                            ? componentType.hasContent
                                ? <CaretDown />
                                : <CaretRight />
                            : componentType.iconComponent
                        }
                    </span>
                    {componentType.labelPlural}
                </HContainer>
                {componentType.key || !componentType.hasContent
                    ? <Plus
                        onClick={componentType.addAction}
                    />
                    : <Minus
                        onClick={componentType.addAction}
                    />
                }
            </HContainer>
            {componentType.key && data.components[componentType.key] && data.components[componentType.key].map((c, j) =>
                <HContainer key={`component-${i}-${j}`} alignItems='center' className='current' style={{ paddingLeft: 22 }}>
                    <HContainer grow={1}>
                        {/* TODO: properly get name, e.g. child name */}
                        {/* @ts-ignore */}
                        {componentType.iconComponent} {c.name || c.function || `${componentType.labelSingular} ${j + 1}`}
                    </HContainer>
                    <Minus
                        onClick={() => removeComponent(componentType.key!, j)}
                    />
                </HContainer>
            )}
        </>)}
    </VContainer>;
}
