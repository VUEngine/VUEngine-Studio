import { nls } from '@theia/core';
import React, { useContext, useState } from 'react';
import { NodeRendererProps } from 'react-arborist';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { LogicEditorContext, LogicEditorContextType } from '../LogicEditorTypes';
import { ConfirmDialog } from '@theia/core/lib/browser';

export default function MethodTreeNode(props: NodeRendererProps<any>): React.JSX.Element {
    const { node, style, dragHandle } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { setCurrentComponent } = useContext(LogicEditorContext) as LogicEditorContextType;
    const { data, updateData } = useContext(LogicEditorContext) as LogicEditorContextType;
    const [dragging, setDragging] = useState<boolean>(false);

    const nodeParts = node.id.split('-');
    const index = parseInt(nodeParts[1] || '-1');

    const addMethod = async (): Promise<void> => {
        const type = services.vesProjectService.getProjectDataType('Logic');
        if (!type) {
            return;
        }
        const schema = await window.electronVesCore.dereferenceJsonSchema(type.schema);
        if (!schema?.properties?.methods?.items) {
            return;
        }
        const newMethodData = services.vesProjectService.generateDataFromJsonSchema(schema?.properties?.methods?.items);
        if (!newMethodData) {
            return;
        }

        newMethodData.name = nls.localize('vuengine/editors/logic/method', 'Method');

        updateData({
            ...data,
            methods: [
                ...(data.methods ?? []),
                newMethodData,
            ]
        });

        setCurrentComponent(`methods-${(data.methods?.length ?? 0)}`);
    };

    const removeMethod = async (i: number): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/logic/removeMethod', 'Remove Method'),
            msg: nls.localize('vuengine/editors/logic/areYouSureYouWantToRemoveMethod', 'Are you sure you want to remove this method?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            updateData({
                ...data,
                methods: [
                    ...((data.methods ?? []).slice(0, i)),
                    ...((data.methods ?? []).slice(i + 1))
                ]
            });

            setCurrentComponent('');
        }
    };

    const getIcon = (): React.JSX.Element => {
        if (node.id === 'addMethod') {
            return <i className='codicon codicon-add' />;
        } else if (node.isLeaf) {
            return <i className='codicon codicon-symbol-method' />;
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

        if (node.id === 'addMethod') {
            return addMethod();
        }

        if (node.isInternal) {
            node.toggle();
        }

        setCurrentComponent(node.id);
    };

    const setName = (name: string): void => {
        const updatedMethod = {
            ...data.methods[index],
            name,
        };

        updateData({
            ...data,
            methods: [
                ...data.methods.slice(0, index),
                updatedMethod,
                ...data.methods.slice(index + 1),
            ]
        });
    };

    return (
        <div
            className={`ves-tree-node${dragging ? ' dragging' : ''}`}
            ref={!node.parent?.isRoot ? dragHandle : undefined}
            style={style}
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
                    if (!node.parent?.isRoot) {
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
                {!node.isLeaf && node.parent?.isRoot &&
                    <i
                        className='codicon codicon-plus'
                        onClick={addMethod}
                        title={nls.localizeByDefault('Add')}
                    />
                }
                {node.isLeaf && !node.parent?.isRoot &&
                    <i
                        className='codicon codicon-edit'
                        onClick={() => node.edit()}
                        title={nls.localize('vuengine/editors/logic/editName', 'Edit Name')}
                    />
                }
                {node.isLeaf && node.id !== 'addMethod' &&
                    <i
                        className='codicon codicon-trash'
                        onClick={() => removeMethod(index)}
                        title={nls.localizeByDefault('Remove')}
                    />
                }
            </div>
        </div>
    );
}
