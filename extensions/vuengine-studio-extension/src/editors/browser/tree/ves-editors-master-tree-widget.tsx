import { MasterTreeWidget, TreeAnchor, TreeContextMenu, TreeEditor, TREE_PROPS } from '@eclipse-emfcloud/theia-tree-editor';
import { nls } from '@theia/core';
import { codicon, ConfirmDialog, ExpandableTreeNode } from '@theia/core/lib/browser';
import { RenderContextMenuOptions } from '@theia/core/lib/browser/context-menu-renderer';
import { TreeNode } from '@theia/core/lib/browser/tree/tree';
import { NodeProps, TreeProps } from '@theia/core/lib/browser/tree/tree-widget';
import { inject, injectable } from 'inversify';
import * as React from 'react';
import { VesProjectService } from '../../../project/browser/ves-project-service';

export const VES_TREE_PROPS = {
    ...TREE_PROPS,
    expandOnlyOnExpansionToggleClick: true,
} as TreeProps;

@injectable()
export class VesMasterTreeWidget extends MasterTreeWidget {
    @inject(VesProjectService)
    protected readonly vesProjectService: VesProjectService;

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
            const registeredTypes = this.vesProjectService.getProjectDataTypes();
            if (registeredTypes) {
                const typeLabel = registeredTypes[node.jsonforms.type].schema.title;
                const dialog = new ConfirmDialog({
                    title: nls.localize('vuengine/editors/deleteNodeQuestion', 'Delete Node?'),
                    msg: nls.localize('vuengine/editors/areYouSureYouWantToDeleteItem', 'Are you sure you want to delete the {0} "{1}"?', typeLabel, node.name),
                });
                dialog.open().then(remove => {
                    if (remove && node.parent && node.parent && TreeEditor.Node.is(node.parent)) {
                        this.onDeleteEmitter.fire(node);
                    }
                });
            }
        };
    }

    protected vesCreateAddHandler(node: TreeEditor.Node): (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void {
        return event => {
            const registeredTypes = this.vesProjectService.getProjectDataTypes();
            if (registeredTypes) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const addHandler = (property: string, type: string): any =>
                    this.onAddEmitter.fire({ node, property, type });

                const childTypes = Object.values(registeredTypes).filter(registeredType =>
                    registeredType.parent?.typeId === node.jsonforms.type
                );
                if (childTypes.length === 1) {
                    addHandler('children', childTypes[0].schema.properties?.typeId.const);
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

    protected handleDblClickEvent(node: TreeNode | undefined, event: React.MouseEvent<HTMLElement>): void {
        // do not allow collapsing of root node
        if (node && node?.parent?.parent) {
            super.handleDblClickEvent(node, event);
        }
    }
}
