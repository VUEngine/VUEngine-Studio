import { nls } from '@theia/core';
import React from 'react';
import { NodeRendererProps } from 'react-arborist';
import { ProjectContributor } from '../../ves-project-types';
import styled from 'styled-components';

const CountLabel = styled.span`
    background-color: rgba(255, 255, 255, .1);
    border-radius: 50px;
    font-size: 60%;
    margin-left: 5px;
    padding: 1px 5px;
    vertical-align: middle;

    body.theia-light &,
    body.theia-hc & {
        background-color: rgba(0, 0, 0, .1);
    }
`;

const ContributorLabel = styled.span`
    opacity: .3;
`;

export default function AssetsTreeNode(props: NodeRendererProps<any>): React.JSX.Element {
    const { node, style, dragHandle } = props;

    const getIcon = (): React.JSX.Element => {
        if (!node.isLeaf) {
            if (node.isOpen) {
                return <>
                    <i className='codicon codicon-chevron-down' />
                    {node.data.icon !== undefined
                        ? <i className={node.data.icon} />
                        : <i className='codicon codicon-folder-opened' />
                    }
                </>;
            } else {
                return <>
                    <i className='codicon codicon-chevron-right' />
                    {node.data.icon !== undefined
                        ? <i className={node.data.icon} />
                        : <i className='codicon codicon-folder' />
                    }
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
                        node.edit();
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
                    <>
                        {node.data.name}
                        {node.data.isLeaf && node.data.contributor !== ProjectContributor.Project && <>
                            {' '}
                            <ContributorLabel>
                                ({node.data.contributor === ProjectContributor.Engine
                                    ? nls.localize('vuengine/editors/projects/engine', 'Engine')
                                    : nls.localize('vuengine/editors/projects/plugin', 'Plugin')
                                })
                            </ContributorLabel>
                        </>}
                        {!node.data.isLeaf &&
                            <CountLabel>
                                {node.children?.length ?? 0}
                            </CountLabel>
                        }
                    </>
                )}
            </div>
            <div className='ves-tree-node-actions'>
                {node.data.add &&
                    <i
                        className='codicon codicon-plus'
                        onClick={node.data.add}
                        title={nls.localizeByDefault('Add')}
                    />
                }
                {node.data.isLeaf && !node.parent?.isRoot && node.data.contributor === ProjectContributor.Project &&
                    <i
                        className='codicon codicon-edit'
                        onClick={node.edit}
                        title={nls.localize('vuengine/editors/actor/editName', 'Edit Name')}
                    />
                }
                {node.data.clone &&
                    <i
                        className='codicon codicon-copy'
                        onClick={node.data.clone}
                        title={nls.localize('vuengine/editors/projects/clone', 'Clone')}
                    />
                }
                {node.data.remove &&
                    <i
                        className='codicon codicon-trash'
                        onClick={node.data.remove}
                        title={nls.localizeByDefault('Remove')}
                    />
                }
            </div>
        </div>
    );
}
