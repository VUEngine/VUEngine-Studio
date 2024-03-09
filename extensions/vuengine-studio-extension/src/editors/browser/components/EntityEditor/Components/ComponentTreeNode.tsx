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
    Selection,
    SelectionInverse,
    SneakerMove,
    TreeStructure,
    UserFocus,
} from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext, useState } from 'react';
import { NodeRendererProps } from 'react-arborist';
import { ComponentKey, EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import { ScriptType } from '../Scripts/ScriptTypes';
import { ColliderType, WireframeType } from '../../Common/VUEngineTypes';

const CLONABLE_COMPONENT_TYPES = [
    'animations',
    'children',
    'colliders',
    'scripts',
    'sprites',
    'wireframes',
];

type HideableComponent = 'children' | 'colliders' | 'sprites' | 'wireframes';
const HIDEABLE_COMPONENT_TYPES = [
    'children',
    'colliders',
    'sprites',
    'wireframes',
];

export default function ComponentTreeNode(props: NodeRendererProps<any>): React.JSX.Element {
    const { node, style, dragHandle } = props;
    const { data, setData, state, setState } = useContext(EntityEditorContext) as EntityEditorContextType;
    const [dragging, setDragging] = useState<boolean>(false);

    const nodeParts = node.id.split('-');
    const type = nodeParts[0] as ComponentKey | 'physics' | 'extraProperties';
    const index = parseInt(nodeParts[1] || '-1');

    const getIcon = (): React.JSX.Element => {
        if (state.preview[type as HideableComponent] === false) {
            return <i className='fa fa-eye-slash' />;
        }
        if (node.isLeaf) {
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
                {node.isLeaf &&
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
