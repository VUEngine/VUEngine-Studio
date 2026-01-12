import React from 'react';
import { NodeRendererProps } from 'react-arborist';

export default function AssetsTreeNode(props: NodeRendererProps<any>): React.JSX.Element {
    const { node, style, dragHandle } = props;

    const getIcon = (): React.JSX.Element => {
        if (!node.isLeaf) {
            if (node.isOpen) {
                return <>
                    <i className='codicon codicon-chevron-down' />
                    <i className='codicon codicon-folder-opened' />
                </>;
            } else {
                return <>
                    <i className='codicon codicon-chevron-right' />
                    <i className='codicon codicon-folder' />
                </>;
            }
        } else if (node.data.icon) {
            return <i className={node.data.icon} />;
        } else {
            return <i className='codicon codicon-file' />;
        }
    };

    const handleClick = () => {
        if (node.isLeaf) {
            if (node.data.handleClick) {
                node.data.handleClick();
            }
        } else {
            node.toggle();
        }
    };

    return (
        <div
            className="ves-tree-node"
            ref={!node.parent?.isRoot ? dragHandle : undefined}
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
                    if (node.data.isLeaf && !node.parent?.isRoot) {
                        // node.edit();
                    }
                }}
            >
                {node.isEditing ? (
                    <input
                        type="text"
                        defaultValue={node.data.name}
                        onFocus={e => {
                            e.currentTarget.select();
                        }}
                        onBlur={e => {
                            node.submit(e.currentTarget.value);
                            // TODO: rename file
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Escape') {
                                node.reset();
                            } else if (e.key === 'Enter') {
                                node.submit(e.currentTarget.value);
                                // TODO: rename file
                            };
                        }}
                        autoFocus
                    />
                ) : (
                    node.data.name
                )}
            </div>
            { /* }
            <div className='ves-tree-node-actions'>
                {!node.data.isLeaf &&
                    <i
                        className='codicon codicon-plus'
                        onClick={() => { }}
                        title={nls.localizeByDefault('Add')}
                    />
                }
                {node.data.isLeaf && !node.parent?.isRoot &&
                    <i
                        className='codicon codicon-edit'
                        onClick={() => node.edit()}
                        title={nls.localize('vuengine/editors/actor/editName', 'Edit Name')}
                    />
                }
                {node.data.isLeaf && !node.parent?.isRoot &&
                    <i
                        className='codicon codicon-copy'
                        onClick={() => { }}
                        title={nls.localize('vuengine/editors/projects/clone', 'Clone')}
                    />
                }
                {node.data.isLeaf && !node.parent?.isRoot &&
                    <i
                        className='codicon codicon-trash'
                        onClick={() => { }}
                        title={nls.localizeByDefault('Remove')}
                    />
                }
            </div>
            { */ }
        </div>
    );
}
