import {
    Asterisk,
    Atom,
    Circle,
    CircleDashed,
    DotsThreeOutline,
    File,
    FilmStrip,
    Hexagon,
    Image,
    Images,
    MusicNotes,
    Plus,
    Selection,
    SelectionInverse,
    SneakerMove,
    UserFocus
} from '@phosphor-icons/react';
import { nls } from '@theia/core';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { NodeRendererProps } from 'react-arborist';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { ColliderType, DisplayMode, WireframeType } from '../../Common/VUEngineTypes';
import { ActorEditorCommands } from '../ActorEditorCommands';
import {
    ActorEditorContext,
    ActorEditorContextType,
    ADDABLE_COMPONENT_TYPES,
    CLONABLE_COMPONENT_TYPES,
    ComponentKey,
    HIDEABLE_COMPONENT_TYPES,
    HideableComponent,
    RENAMABLE_COMPONENT_TYPES,
} from '../ActorEditorTypes';

export default function ComponentTreeNode(props: NodeRendererProps<any>): React.JSX.Element {
    const { node, style, dragHandle } = props;
    const {
        addComponent, removeComponent,
        setCurrentComponent,
        previewShowChildren, setPreviewShowChildren,
        previewShowColliders, setPreviewShowColliders,
        previewShowSprites, setPreviewShowSprites,
        previewShowWireframes, setPreviewShowWireframes,
    } = useContext(ActorEditorContext) as ActorEditorContextType;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { data, setData } = useContext(ActorEditorContext) as ActorEditorContextType;
    const [dragging, setDragging] = useState<boolean>(false);

    const nodeParts = node.id.split('-');
    const type = nodeParts[0] as ComponentKey;
    const index = parseInt(nodeParts[1] || '-1');

    const showPreview = useMemo(() => {
        switch (type) {
            case 'children':
                return previewShowChildren;
            case 'colliders':
                return previewShowColliders;
            case 'sprites':
                return previewShowSprites;
            case 'wireframes':
                return previewShowWireframes;
        }

        return true;
    }, [
        type,
        previewShowChildren,
        previewShowColliders,
        previewShowSprites,
        previewShowWireframes,
    ]);

    const setShowPreview = useCallback((hideableType: HideableComponent, value: boolean) => {
        switch (type) {
            case 'children':
                return setPreviewShowChildren(value);
            case 'colliders':
                return setPreviewShowColliders(value);
            case 'sprites':
                return setPreviewShowSprites(value);
            case 'wireframes':
                return setPreviewShowWireframes(value);
        }
    }, [
        type,
        setPreviewShowChildren,
        setPreviewShowColliders,
        setPreviewShowSprites,
        setPreviewShowWireframes,
    ]);

    const getIcon = (): React.JSX.Element => {
        if (showPreview === false) {
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
                case 'bodies':
                    return <Atom size={16} />;
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
                case 'mutators':
                    return <SneakerMove size={16} />;
                case 'sounds':
                    return <MusicNotes size={16} />;
                case 'sprites':
                    if (data.components.sprites[index].displayMode === DisplayMode.Stereo ||
                        ((data.components.sprites[index].texture?.files?.length ?? 0) +
                            (data.components.sprites[index].texture?.files2?.length ?? 0) > 1)) {
                        return <Images size={16} />;
                    }
                    return <Image size={16} />;
                case 'wireframes':
                    switch (data.components.wireframes[index].type) {
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
            return services.commandService.executeCommand(ActorEditorCommands.ADD_COMPONENT.id);
        }

        if (node.isInternal) {
            node.toggle();
        }

        setCurrentComponent(node.id);
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
        const visible = showPreview === false;
        setShowPreview(t, visible);

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
                opacity: showPreview === false ? .5 : undefined,
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
                        className={showPreview === false ? 'fa fa-eye-slash' : 'fa fa-eye'}
                        onClick={toggleComponentVisibility}
                        title={nls.localize('vuengine/editors/actor/toggleComponentVisibility', 'Toggle Component Visibility')}
                    />
                }
                {!node.isLeaf && node.parent?.isRoot && ADDABLE_COMPONENT_TYPES.includes(type) &&
                    <i
                        className='codicon codicon-plus'
                        onClick={() => addComponent(type as ComponentKey)}
                        title={nls.localizeByDefault('Add')}
                    />
                }
                {node.isLeaf && !node.parent?.isRoot && RENAMABLE_COMPONENT_TYPES.includes(type) &&
                    <i
                        className='codicon codicon-edit'
                        onClick={() => node.edit()}
                        title={nls.localize('vuengine/editors/actor/editName', 'Edit Name')}
                    />
                }
                {node.isLeaf && CLONABLE_COMPONENT_TYPES.includes(type) &&
                    <i
                        className='codicon codicon-copy'
                        onClick={cloneComponent}
                        title={nls.localize('vuengine/editors/actor/clone', 'Clone')}
                    />
                }
                {node.isLeaf && node.id !== 'addComponent' &&
                    <i
                        className='codicon codicon-trash'
                        onClick={() => removeComponent(type, index)}
                        title={nls.localizeByDefault('Remove')}
                    />
                }
            </div>
        </div>
    );
}
