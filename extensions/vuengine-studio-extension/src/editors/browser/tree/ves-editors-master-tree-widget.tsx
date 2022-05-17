import { MasterTreeWidget, TreeAnchor, TreeContextMenu, TreeEditor, TREE_PROPS } from '@eclipse-emfcloud/theia-tree-editor';
import { codicon, ConfirmDialog, ExpandableTreeNode } from '@theia/core/lib/browser';
import { RenderContextMenuOptions } from '@theia/core/lib/browser/context-menu-renderer';
import { TreeNode } from '@theia/core/lib/browser/tree/tree';
import { NodeProps, TreeProps } from '@theia/core/lib/browser/tree/tree-widget';
import { injectable } from 'inversify';
import * as React from 'react';
import { registeredTypes } from './ves-editors-tree-schema';

export const VES_TREE_PROPS = {
    ...TREE_PROPS,
    expandOnlyOnExpansionToggleClick: true,
} as TreeProps;

@injectable()
export class VesMasterTreeWidget extends MasterTreeWidget {
    protected renderTailDecorations(
        node: TreeNode,
        props: NodeProps
    ): React.ReactNode {
        if (!TreeEditor.Node.is(node)) {
            return <></>;
        }

        const addPlus = this.nodeFactory.hasCreatableChildren(node);
        // @ts-ignore
        const addRemoveButton = props.depth > 0 && this.nodeFactory.canBeDeleted(node);

        return (
            <React.Fragment>
                <div className='node-buttons'>
                    {addPlus
                        ? (
                            <div
                                className={`node-button ${codicon('plus')}`}
                                onClick={this.vesCreateAddHandler(node)}
                            />
                        )
                        : ('')}
                    {addRemoveButton
                        ? (
                            <div
                                className={`node-button ${codicon('trash')}`}
                                onClickCapture={this.vesCreateRemoveHandler(node)}
                            />
                        )
                        : ('')}
                </div>
            </React.Fragment>
        );
    }

    protected vesCreateRemoveHandler(node: TreeEditor.Node): (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void {
        return event => {
            event.stopPropagation();
            const dialog = new ConfirmDialog({
                title: 'Delete Node?',
                msg: 'Are you sure you want to delete the selected node?'
            });
            dialog.open().then(remove => {
                if (remove && node.parent && node.parent && TreeEditor.Node.is(node.parent)) {
                    this.onDeleteEmitter.fire(node);
                }
            });
        };
    }

    protected vesCreateAddHandler(node: TreeEditor.Node): (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void {
        return event => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const addHandler = (property: string, type: string): any => this.onAddEmitter.fire({ node, property, type });

            // @ts-ignore
            if (registeredTypes[node.jsonforms.type]?.children !== undefined &&
                // @ts-ignore
                Object.keys(registeredTypes[node.jsonforms.type].children).length === 1) {
                // @ts-ignore
                addHandler('children', Object.keys(registeredTypes[node.jsonforms.type].children)[0]);
            } else {
                const treeAnchor: TreeAnchor = {
                    x: event.nativeEvent.x,
                    y: event.nativeEvent.y,
                    node: node,
                    onClick: addHandler
                };
                const renderOptions: RenderContextMenuOptions = {
                    menuPath: TreeContextMenu.ADD_MENU,
                    anchor: treeAnchor
                };
                this.contextMenuRenderer.render(renderOptions);
            }
        };
    }

    public async setData(data: TreeEditor.TreeData): Promise<void> {
        await super.setData(data);
        this.selectFirst();
    }

    protected isExpandable(node: TreeNode): node is ExpandableTreeNode {
        return node.parent?.parent !== undefined && super.isExpandable(node);
    }
}
