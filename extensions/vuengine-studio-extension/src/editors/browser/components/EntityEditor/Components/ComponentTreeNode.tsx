import {
    Asterisk,
    Atom,
    Circle,
    CircleDashed,
    DotsThreeOutline,
    FadersHorizontal,
    File,
    FilmStrip,
    Hexagon,
    Image,
    Images,
    Plus,
    Selection,
    SelectionInverse,
    SneakerMove,
    TreeStructure,
    UserFocus,
} from '@phosphor-icons/react';
import { QuickPickItem, QuickPickOptions, QuickPickSeparator, nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext, useState } from 'react';
import { NodeRendererProps } from 'react-arborist';
import { ColorMode } from '../../../../../core/browser/ves-common-types';
import { ImageCompressionType } from '../../../../../images/browser/ves-images-types';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { DataSection } from '../../Common/CommonTypes';
import { showEntitySelection } from '../../Common/Utils';
import { BgmapMode, BgmapRepeatMode, ColliderType, DisplayMode, Displays, Transparency, WireframeType } from '../../Common/VUEngineTypes';
import { ComponentKey, EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import { ScriptType } from '../Scripts/ScriptTypes';

const CLONABLE_COMPONENT_TYPES = [
    'animations',
    'children',
    'colliders',
    'scripts',
    'sprites',
    'wireframes',
];

const ADDABLE_COMPONENT_TYPES = CLONABLE_COMPONENT_TYPES;

type HideableComponent = 'children' | 'colliders' | 'sprites' | 'wireframes';
const HIDEABLE_COMPONENT_TYPES = [
    'children',
    'colliders',
    'sprites',
    'wireframes',
];

export default function ComponentTreeNode(props: NodeRendererProps<any>): React.JSX.Element {
    const { node, style, dragHandle } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data, setData, state, setState } = useContext(EntityEditorContext) as EntityEditorContextType;
    const [dragging, setDragging] = useState<boolean>(false);

    const nodeParts = node.id.split('-');
    const type = nodeParts[0] as ComponentKey | 'physics' | 'extraProperties';
    const index = parseInt(nodeParts[1] || '-1');

    const getIcon = (): React.JSX.Element => {
        if (state.preview[type as HideableComponent] === false) {
            return <i className='fa fa-eye-slash' />;
        }
        if (node.id === 'addComponent') {
            return <Plus size={16} />;
        } else if (node.isLeaf) {
            switch (type) {
                default:
                    return <File size={16} />;
                case 'animations':
                    return <FilmStrip size={16} />;
                case 'behaviors':
                    return <SneakerMove size={16} />;
                case 'children':
                    return <UserFocus size={16} />;
                case 'colliders':
                    switch (data.components.colliders[index].type) {
                        default:
                        case ColliderType.Ball:
                            return <CircleDashed size={16} />;
                        case ColliderType.Box:
                            return <Selection size={16} />;
                        case ColliderType.InverseBox:
                            return <SelectionInverse size={16} />;
                        case ColliderType.LineField:
                            return <DotsThreeOutline size={16} />;
                    }
                case 'extraProperties':
                    return <FadersHorizontal size={16} />;
                case 'physics':
                    return <Atom size={16} />;
                case 'scripts':
                    return <TreeStructure size={16} />;
                case 'sprites':
                    if (data.components.sprites[index].displayMode === DisplayMode.Stereo ||
                        ((data.components.sprites[index].texture?.files?.length ?? 0) +
                            (data.components.sprites[index].texture?.files2?.length ?? 0) > 1)) {
                        return <Images size={16} />;
                    }
                    return <Image size={16} />;
                case 'wireframes':
                    switch (data.components.wireframes[index].wireframe.type) {
                        default:
                        case WireframeType.Mesh:
                            return <Hexagon size={16} />;
                        case WireframeType.Sphere:
                            return <Circle size={16} />;
                        case WireframeType.Asterisk:
                            return <Asterisk size={16} />;
                    }
            }
        } else {
            if (node.isOpen) {
                return <i className='codicon codicon-chevron-down' />;
            } else {
                return <i className='codicon codicon-chevron-right' />;
            }
        }
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (node.id === 'addComponent') {
            return addComponent();
        }

        if (node.isInternal) {
            node.toggle();
        }

        setState({ currentComponent: node.id });
    };

    const handleRemove = async () => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/entityEditor/removeComponent', 'Remove Component'),
            msg: nls.localize('vuengine/entityEditor/areYouSureYouWantToRemoveComponent', 'Are you sure you want to remove this component?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            setState({ currentComponent: '' });
            switch (type) {
                case 'animations':
                case 'behaviors':
                case 'children':
                case 'colliders':
                case 'scripts':
                case 'sprites':
                case 'wireframes':
                    return removeComponent();
                case 'physics':
                    return disablePhysics();
                case 'extraProperties':
                    return disableExtraProperties();
            }
        }
    };

    const disablePhysics = async (): Promise<void> => {
        setData({
            physics: {
                ...data.physics,
                enabled: false,
            }
        });
    };

    const disableExtraProperties = async (): Promise<void> => {
        setData({
            extraProperties: {
                ...data.extraProperties,
                enabled: false,
            }
        });
    };

    const removeComponent = async (): Promise<void> => {
        setData({
            components: {
                ...data.components,
                [type]: [
                    ...data.components[type as ComponentKey].slice(0, index),
                    ...data.components[type as ComponentKey].slice(index + 1)
                ],
            }
        });
    };

    const cloneComponent = async (): Promise<void> => {
        const clone = {
            ...data.components[type as ComponentKey][index],
        };
        setData({
            components: {
                ...data.components,
                [type]: [
                    ...data.components[type as ComponentKey].slice(0, index + 1),
                    clone,
                    ...data.components[type as ComponentKey].slice(index + 1),
                ],
            }
        });
    };

    const setName = (name: string): void => {
        const updatedComponent = {
            // @ts-ignore
            ...data.components[type][index],
            name,
        };

        if (type === 'scripts') {
            updatedComponent.type = ScriptType.Custom;
        }

        const components = {
            ...data.components,
            [type]: [
                // @ts-ignore
                ...data.components[type].slice(0, index),
                updatedComponent,
                // @ts-ignore
                ...data.components[type].slice(index + 1),
            ]
        };

        setData({ components });
    };

    const toggleComponentVisibility = async (): Promise<void> => {
        const t = type as 'children' | 'colliders' | 'sprites' | 'wireframes';
        const visible = !state.preview[t];
        setState({
            preview: {
                ...state.preview,
                [t]: visible,
            },
        });

        if (!visible) {
            node.close();
        } else {
            node.open();
        }
    };

    const showComponentSelection = async (): Promise<QuickPickItem | undefined> => {
        const quickPickOptions: QuickPickOptions<QuickPickItem> = {
            title: nls.localize('vuengine/editors/addComponent', 'Add Component'),
            placeholder: nls.localize('vuengine/editors/selectComponentTypeToAdd', 'Select a component type to add...'),
        };
        const items: (QuickPickItem | QuickPickSeparator)[] = [];
        [{
            key: 'sprites',
            label: nls.localize('vuengine/entityEditor/sprite', 'Sprite'),
            allowAdd: true,
        }, {
            key: 'animations',
            label: nls.localize('vuengine/entityEditor/animation', 'Animation'),
            allowAdd: true,
        }, {
            key: 'colliders',
            label: nls.localize('vuengine/entityEditor/collider', 'Collider'),
            allowAdd: true,
        }, {
            key: 'wireframes',
            label: nls.localize('vuengine/entityEditor/wireframe', 'Wireframe'),
            allowAdd: true,
        }, {
            key: 'behaviors',
            label: nls.localize('vuengine/entityEditor/behavior', 'Behavior'),
            allowAdd: true,
        }, {
            key: 'children',
            label: nls.localize('vuengine/entityEditor/child', 'Child'),
            allowAdd: true,
        }, /*
        {
            key: 'scripts',
            label: nls.localize('vuengine/entityEditor/script', 'Script'),
            allowAdd: true,
        },*/
        {
            key: 'physics',
            label: nls.localize('vuengine/entityEditor/physics', 'Physical Properties'),
            allowAdd: !data.physics.enabled,
        }, {
            key: 'extraProperties',
            label: nls.localize('vuengine/entityEditor/extraProperties', 'Extra Properties'),
            allowAdd: !data.extraProperties.enabled,
        }]
            .sort((a, b) => a.label.localeCompare(b.label))
            .map(t => {
                if (t.allowAdd) {
                    items.push({
                        id: t.key,
                        label: t.label,
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
        if (componentToAdd && componentToAdd.id) {
            doAddComponent(componentToAdd.id);
        }
    };

    const doAddComponent = async (t: string): Promise<void> => {
        switch (t) {
            case 'animations':
                return addAnimation();
            case 'behaviors':
                return addBehavior();
            case 'children':
                return addPositionedEntity();
            case 'colliders':
                return addCollider();
            case 'extraProperties':
                return enableExtraProperties();
            case 'physics':
                return enablePhysics();
            case 'scripts':
                return addScript();
            case 'sprites':
                return addSprite();
            case 'wireframes':
                return addWireframe();
        }
    };

    const addSprite = (): void => {
        const sprites = [...data.components?.sprites || []];
        sprites.push({
            _imageData: 0,
            name: nls.localize('vuengine/entityEditor/sprite', 'Sprite'),
            bgmapMode: BgmapMode.Bgmap,
            colorMode: ColorMode.Default,
            displayMode: DisplayMode.Mono,
            displays: Displays.Both,
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
                files2: [],
                padding: {
                    x: 0,
                    y: 0,
                },
                palette: 0,
                recycleable: false,
                flip: {
                    x: false,
                    y: false,
                },
                repeat: {
                    mode: BgmapRepeatMode['1x1'],
                    x: false,
                    y: false,
                    size: {
                        x: 0,
                        y: 0,
                    },
                },
            },
            section: DataSection.ROM,
            compression: ImageCompressionType.NONE,
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
            length: 32,
            radius: 32,
            drawCenter: true,
        });

        setData({
            components: {
                ...data.components,
                wireframes,
            }
        });
    };

    const addPositionedEntity = async (): Promise<void> => {
        const entityToAdd = await showEntitySelection(services.workspaceService, services.quickPickService, services.vesProjectService, [data._id]);
        if (entityToAdd !== undefined) {
            const children = [...data.components?.children || []];
            children.push({
                itemId: entityToAdd.id!,
                onScreenPosition: {
                    x: 0,
                    y: 0,
                    z: 0,
                },
                onScreenRotation: {
                    x: 0,
                    y: 0,
                    z: 0,
                },
                onScreenScale: {
                    x: 0,
                    y: 0,
                    z: 0,
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

    return (
        <div
            className={`ves-tree-node${dragging ? ' dragging' : ''}`}
            ref={!node.parent?.isRoot ? dragHandle : undefined}
            style={{
                ...style,
                opacity: state.preview[type as HideableComponent] === false ? .5 : undefined,
            }}
            onDragStart={() => setDragging(true)}
            onDragEnd={() => setDragging(false)}
        >
            <div
                className='ves-tree-node-icon'
                onClick={handleClick}
            >
                {getIcon()}
            </div>
            <div
                className='ves-tree-node-name'
                onClick={handleClick}
                onDoubleClick={() => {
                    if (!node.parent?.isRoot && type !== 'children') {
                        node.edit();
                    }
                }}
            >
                {node.isEditing ? (
                    <input
                        type="text"
                        defaultValue={node.data.name}
                        onFocus={e => e.currentTarget.select()}
                        onBlur={e => {
                            node.submit(e.currentTarget.value);
                            setName(e.currentTarget.value);
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Escape') {
                                node.reset();
                            } else if (e.key === 'Enter') {
                                node.submit(e.currentTarget.value);
                                setName(e.currentTarget.value);
                            };
                        }}
                        autoFocus
                    />
                ) : (
                    node.data.name
                )}
            </div>
            <div className='ves-tree-node-actions'>
                {!node.isLeaf && node.parent?.isRoot && HIDEABLE_COMPONENT_TYPES.includes(type) &&
                    <i
                        className={state.preview[type as HideableComponent] === false ? 'fa fa-eye-slash' : 'fa fa-eye'}
                        onClick={toggleComponentVisibility}
                        title={nls.localize('vuengine/entityEditor/toggleComponentVisibility', 'Toggle Component Visibility')}
                    />
                }
                {!node.isLeaf && node.parent?.isRoot && ADDABLE_COMPONENT_TYPES.includes(type) &&
                    <i
                        className='codicon codicon-plus'
                        onClick={() => doAddComponent(type)}
                        title={nls.localize('vuengine/entityEditor/addComponent', 'Add Component')}
                    />
                }
                {node.isLeaf && !node.parent?.isRoot && type !== 'children' &&
                    <i
                        className='codicon codicon-edit'
                        onClick={() => node.edit()}
                        title={nls.localize('vuengine/entityEditor/editName', 'Edit Name')}
                    />
                }
                {node.isLeaf && CLONABLE_COMPONENT_TYPES.includes(type) &&
                    <i
                        className='codicon codicon-copy'
                        onClick={cloneComponent}
                        title={nls.localize('vuengine/entityEditor/cloneComponent', 'Clone Component')}
                    />
                }
                {node.isLeaf && node.id !== 'addComponent' &&
                    <i
                        className='codicon codicon-trash'
                        onClick={handleRemove}
                        title={nls.localize('vuengine/entityEditor/removeComponent', 'Remove Component')}
                    />
                }
            </div>
        </div>
    );
}
