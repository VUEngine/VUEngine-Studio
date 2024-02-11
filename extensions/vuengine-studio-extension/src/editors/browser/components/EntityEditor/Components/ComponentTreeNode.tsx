import { Asterisk, Atom, CircleDashed, Cube, File, FilmStrip, Image, SneakerMove, TreeStructure, UserFocus } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext } from 'react';
import { NodeRendererProps } from 'react-arborist';
import { ComponentKey, EntityEditorContext, EntityEditorContextType } from '../EntityEditorTypes';

export default function ComponentTreeNode(props: NodeRendererProps<any>): React.JSX.Element {
    const { node, style, dragHandle } = props;
    const { data, setData, setState } = useContext(EntityEditorContext) as EntityEditorContextType;

    const getIcon = (): React.JSX.Element => {
        if (node.isLeaf) {
            const [type] = node.id.split('-');
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
        setState({ currentComponent: '' });

        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/entityEditor/removeComponent', 'Remove Component'),
            msg: nls.localize('vuengine/entityEditor/areYouSureYouWantToRemoveComponent', 'Are you sure you want to remove this component?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            const [type, indexString] = node.id.split('-');
            const index = parseInt(indexString || '0');
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

    const removeComponent = async (key: ComponentKey, index: number): Promise<void> => {
        setData({
            components: {
                ...data.components,
                [key]: [
                    ...data.components[key].slice(0, index),
                    ...data.components[key].slice(index + 1)
                ],
            }
        });
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
            >
                {node.data.name}
            </div>
            <div className='ves-tree-node-actions'>
                {node.isLeaf &&
                    <i
                        className='codicon codicon-remove'
                        onClick={handleRemove}
                    />
                }
            </div>
        </div>
    );
}
