/********************************************************************************
 * Copyright (c) 2019-2020 EclipseSource and others.
 *
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v. 2.0 which is available at
 * https://www.eclipse.org/legal/epl-2.0, or the MIT License which is
 * available at https://opensource.org/licenses/MIT.
 *
 * SPDX-License-Identifier: EPL-2.0 OR MIT
 ********************************************************************************/
import { TreeEditor, TREE_PROPS } from '@eclipse-emfcloud/theia-tree-editor';
import { Emitter, MenuPath } from '@theia/core';
import { codicon, ConfirmDialog, ExpandableTreeNode, TreeModel } from '@theia/core/lib/browser';
import { ContextMenuRenderer, RenderContextMenuOptions } from '@theia/core/lib/browser/context-menu-renderer';
import { TreeNode } from '@theia/core/lib/browser/tree/tree';
import { NodeProps, TreeProps, TreeWidget } from '@theia/core/lib/browser/tree/tree-widget';
import { inject, injectable, postConstruct } from 'inversify';
import * as React from 'react';
import { v4 } from 'uuid';
import { registeredTypes } from './ves-editors-tree-schema';

export interface AddCommandProperty {
    /** The node to add a new child to. */
    node: TreeEditor.Node;
    /** The property to add a new child to. */
    property: string;
    /** The type identifier of the new child to create. */
    type: string;
}

export interface TreeAnchor {
    x: number;
    y: number;
    node: TreeEditor.Node;
    onClick: (property: string, type: string) => void;
}

export namespace TreeContextMenu {
    export const CONTEXT_MENU: MenuPath = ['theia-tree-editor-tree-context-menu'];
    export const ADD_MENU: MenuPath = ['theia-tree-editor-tree-add-menu'];
}

export const VES_TREE_PROPS = {
    ...TREE_PROPS,
    expandOnlyOnExpansionToggleClick: true,
    search: true,
} as TreeProps;

@injectable()
export class VesMasterTreeWidget extends TreeWidget {
    protected onTreeWidgetSelectionEmitter = new Emitter<
        readonly Readonly<TreeEditor.Node>[]
    >();
    protected onDeleteEmitter = new Emitter<Readonly<TreeEditor.Node>>();
    protected onAddEmitter = new Emitter<Readonly<AddCommandProperty>>();
    protected data: TreeEditor.TreeData;

    constructor(
        @inject(TreeProps)
        readonly props: TreeProps,
        @inject(TreeModel)
        readonly model: TreeModel,
        @inject(ContextMenuRenderer)
        readonly contextMenuRenderer: ContextMenuRenderer,
        @inject(TreeEditor.NodeFactory)
        protected readonly nodeFactory: TreeEditor.NodeFactory
    ) {
        super(props, model, contextMenuRenderer);
        this.id = VesMasterTreeWidget.WIDGET_ID;
        this.title.label = VesMasterTreeWidget.WIDGET_LABEL;
        this.title.caption = VesMasterTreeWidget.WIDGET_LABEL;

        model.root = {
            id: VesMasterTreeWidget.WIDGET_ID,
            name: VesMasterTreeWidget.WIDGET_LABEL,
            parent: undefined,
            visible: false,
            children: []
        } as TreeEditor.RootNode;
    }

    @postConstruct()
    protected init(): void {
        super.init();

        this.toDispose.push(this.onTreeWidgetSelectionEmitter);
        this.toDispose.push(this.onDeleteEmitter);
        this.toDispose.push(this.onAddEmitter);
        this.toDispose.push(
            this.model.onSelectionChanged(e => {
                this.onTreeWidgetSelectionEmitter.fire(e as readonly Readonly<
                    TreeEditor.Node
                >[]);
            })
        );
    }

    /** Overrides method in TreeWidget */
    protected handleClickEvent(
        node: TreeNode | undefined,
        event: React.MouseEvent<HTMLElement>
    ): void {
        const x = event.target as HTMLElement;
        if (x.classList.contains('node-button')) {
            // Don't do anything because the event is handled in the button's handler
            return;
        }
        super.handleClickEvent(node, event);
    }

    /*
     * Overrides TreeWidget.renderTailDecorations
     * Add a add child and a remove button.
     */
    protected renderTailDecorations(
        node: TreeNode,
        props: NodeProps
    ): React.ReactNode {
        const deco = super.renderTailDecorations(node, props);
        if (!TreeEditor.Node.is(node)) {
            return deco;
        }

        const addPlus = this.nodeFactory.hasCreatableChildren(node);
        // @ts-ignore
        const addRemoveButton = props.depth > 0 && this.nodeFactory.canBeDeleted(node);

        return (
            <React.Fragment>
                {deco}
                <div className='node-buttons'>
                    {addPlus
                        ? (
                            <div
                                className={`node-button ${codicon('plus')}`}
                                onClick={this.createAddHandler(node)}
                            />
                        )
                        : ('')}
                    {addRemoveButton
                        ? (
                            <div
                                className={`node-button ${codicon('trash')}`}
                                onClickCapture={this.createRemoveHandler(node)}
                            />
                        )
                        : ('')}
                </div>
            </React.Fragment>
        );
    }

    /**
     * Creates a handler for the delete button of a tree node.
     * @param node The tree node to create a remove handler for
     */
    private createRemoveHandler(node: TreeEditor.Node): (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void {
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

    private createAddHandler(node: TreeEditor.Node): (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void {
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
        this.data = data;
        await this.refreshModelChildren();
        this.selectFirst();
    }

    public selectFirst(): void {
        if (
            this.model.root &&
            TreeEditor.RootNode.is(this.model.root) &&
            this.model.root.children.length > 0 &&
            TreeEditor.Node.is(this.model.root.children[0])
        ) {
            this.model.selectNode(this.model.root.children[0] as TreeEditor.Node);
            this.model.refresh();
        }
    }

    public findNode(propIndexPaths: { property: string; index?: string }[]): TreeEditor.Node {
        const rootNode = this.model.root as TreeEditor.RootNode;
        return propIndexPaths.reduce((parent, segment) => {
            const fitting = parent.children.filter(n => TreeEditor.Node.is(n) && n.jsonforms.property === segment.property && n.jsonforms.index === segment.index);
            return fitting[0] as TreeEditor.Node;
        }, rootNode.children[0] as TreeEditor.Node);
    }

    public select(paths: string[]): void {
        if (paths.length === 0) {
            return;
        }
        const rootNode = this.model.root as TreeEditor.Node;
        const toSelect = paths.reduceRight((node, path) => node.children.find(value => value.name === path), rootNode) as TreeEditor.Node;
        this.model.selectNode(toSelect);
        this.model.refresh();
    }

    get onSelectionChange(): import('@theia/core').Event<
        readonly Readonly<TreeEditor.Node>[]
        > {
        return this.onTreeWidgetSelectionEmitter.event;
    }
    get onDelete(): import('@theia/core').Event<Readonly<TreeEditor.Node>> {
        return this.onDeleteEmitter.event;
    }
    get onAdd(): import('@theia/core').Event<Readonly<AddCommandProperty>> {
        return this.onAddEmitter.event;
    }

    protected async refreshModelChildren(): Promise<void> {
        if (this.model.root && TreeEditor.RootNode.is(this.model.root)) {
            const newTree =
                !this.data || this.data.error ? [] : await this.nodeFactory.mapDataToNodes(this.data);
            this.model.root.children = newTree;
            this.model.refresh();
        }
    }

    protected defaultNode(): Pick<TreeEditor.Node, 'id' | 'expanded' | 'selected' | 'parent' | 'decorationData' | 'children'> {
        return {
            id: v4(),
            expanded: false,
            selected: false,
            parent: undefined,
            decorationData: {},
            children: []
        };
    }

    protected isExpandable(node: TreeNode): node is ExpandableTreeNode {
        return TreeEditor.Node.is(node) && node.children.length > 0;
    }

    protected renderIcon(node: TreeNode): React.ReactNode {
        return (
            <div className='tree-icon-container'>
                <div className={this.labelProvider.getIcon(node)} />
            </div>
        );
    }

    /**
     * Overrides super method because there are no context menus on nodes of the tree editor.
     * Without this, the editor tab flashes when right clicking a tree node
     * because an empty context menu is opened and immediately closed again.
     * This causes unfocus and refocus of the editor tab leading to a 'flash'.
     *
     * Override this in case you need a context menu on nodes or somewhere else in the tree.
     *
     * ---
     *
     * Handle the context menu click event.
     * - The context menu click event is triggered by the right-click.
     * @param node the tree node if available.
     * @param event the right-click mouse event.
     */
    protected handleContextMenuEvent(node: TreeNode | undefined, event: React.MouseEvent<HTMLElement>): void {
        event.stopPropagation();
        event.preventDefault();
    }

    /**
     * Updates the data of the given node with the new data. Refreshes the tree if necessary.
     * Note that this method will only work properly if only data relevant for this node was changed.
     * If data of the subtree was changed, too, please call updateDataForSubtree instead.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public updateDataForNode(node: TreeEditor.Node, data: any): void {
        const oldName = this.labelProvider.getName(node);
        Object.assign(node.jsonforms.data, data);
        const newName = this.labelProvider.getName(node);
        if (oldName !== newName) {
            node.name = newName;
            this.model.refresh();
        }
    }

    /**
     * Updates the data of the given node and recreates its whole subtree. Refreshes the tree.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async updateDataForSubtree(node: TreeEditor.Node, data: any): Promise<void> {
        Object.assign(node.jsonforms.data, data);
        const newNode = await this.nodeFactory.mapData(data);
        node.name = newNode.name;
        node.children = newNode.children;
        this.model.refresh();
    }

    /**
     * Creates new tree nodes for the given data and adds them to the given node.
     *
     * @param node The node to add children to
     * @param data The data array to generate the new tree nodes from
     * @param property The property of the parent data which will contain the new nodes.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async addChildren(node: TreeEditor.Node, data: any[], property: string): Promise<void> {
        const currentValue = node.jsonforms.data[property];
        let index = 0;
        if (Array.isArray(currentValue)) {
            index = currentValue.length;
        }
        const iterableEntriesWithIndex = data.map((d, i) => ({ d, i }));
        for (const { d, i } of iterableEntriesWithIndex) {
            await this.nodeFactory.mapData(d, node, property, index + i);
        }
        this.updateIndex(node, property);
        this.model.refresh();
    }

    public removeChildren(node: TreeEditor.Node, indices: number[], property: string): void {
        const toDelete = node.children.filter(n =>
            TreeEditor.Node.is(n) &&
            n.jsonforms.property === property &&
            indices.includes(Number(n.jsonforms.index))
        ).map(n => node.children.indexOf(n));
        toDelete.forEach(i => node.children.splice(i, 1));
        this.updateIndex(node, property);
        this.model.refresh();
    }
    private updateIndex(node: TreeEditor.Node, property: string): void {
        let realIndex = 0;
        node.children.forEach((n, i) => {
            if (TreeEditor.Node.is(n) && n.jsonforms.property === property) {
                n.jsonforms.index = realIndex.toString();
                realIndex++;
            }
        });
    }
}

// eslint-disable-next-line no-redeclare
export namespace VesMasterTreeWidget {
    export const WIDGET_ID = 'theia-tree-editor-tree';
    export const WIDGET_LABEL = 'Visual Editor Tree';
}
