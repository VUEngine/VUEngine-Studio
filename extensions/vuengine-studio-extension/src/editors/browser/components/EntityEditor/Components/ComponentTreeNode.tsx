import { Asterisk, Atom, CircleDashed, Cube, File, FilmStrip, Image, SneakerMove, TreeStructure, UserFocus } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext } from 'react';
import { NodeRendererProps } from 'react-arborist';
import { ComponentKey, EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';
import { ScriptType } from '../Scripts/ScriptTypes';

export default function ComponentTreeNode(props: NodeRendererProps<any>): React.JSX.Element {
    const { node, style, dragHandle } = props;
    const { data, setData, setState } = useContext(EntityEditorContext) as EntityEditorContextType;

    const [type, indexString] = node.id.split('-');
    const index = parseInt(indexString || '-1');

    const getIcon = (): React.JSX.Element => {
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
                    return <CircleDashed size={16} />;
                case 'extraProperties':
                    return <Asterisk size={16} />;
                case 'physics':
                    return <Atom size={16} />;
                case 'scripts':
                    return <TreeStructure size={16} />;
                case 'sprites':
                    return <Image size={16} />;
                case 'wireframes':
                    return <Cube size={16} />;
            }
        } else {
            if (node.isOpen) {
                return <i className='codicon codicon-chevron-down' />;
            } else {
                return <i className='codicon codicon-chevron-right' />;
            }
        }
    };

    const handleClick = () => {
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
                    return removeComponent(type, index);
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

    const removeComponent = async (key: ComponentKey, i: number): Promise<void> => {
        setData({
            components: {
                ...data.components,
                [key]: [
                    ...data.components[key].slice(0, i),
                    ...data.components[key].slice(i + 1)
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

    return (
        <div
            className='ves-tree-node'
            ref={dragHandle}
            style={style}
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
                {node.isLeaf && !node.parent?.isRoot && type !== 'children' &&
                    <i
                        className='codicon codicon-edit'
                        onClick={() => node.edit()}
                        title={nls.localize('vuengine/entityEditor/editName', 'Edit Name')}
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
