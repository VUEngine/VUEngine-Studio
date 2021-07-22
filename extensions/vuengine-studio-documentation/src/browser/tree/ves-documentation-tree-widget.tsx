import { inject, injectable } from 'inversify';
import * as React from 'react';
import {
  ContextMenuRenderer,
  TreeProps,
  TreeWidget,
  TreeNode,
  ExpandableTreeNode,
  LabelProvider,
  NodeProps
} from '@theia/core/lib/browser';

import { VesDocumentationChildNode, VesDocumentationRootNode } from './ves-documentation-tree';
import { VesDocumentationTreeModel } from './ves-documentation-tree-model';

@injectable()
export class VesDocumentationTreeWidget extends TreeWidget {
  static readonly ID = 'ves-documentation-tree-widget';
  static readonly LABEL = 'Documentation';

  constructor(
    @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer,
    @inject(LabelProvider) protected readonly labelProvider: LabelProvider,
    @inject(VesDocumentationTreeModel) readonly model: VesDocumentationTreeModel,
    @inject(TreeProps) readonly props: TreeProps,
  ) {
    super(props, model, contextMenuRenderer);

    this.title.label = VesDocumentationTreeWidget.LABEL;
    this.id = VesDocumentationTreeWidget.ID;
    this.title.iconClass = 'fa fa-book';
    this.title.closable = true;
  }

  protected renderIcon(node: VesDocumentationChildNode, props: NodeProps): React.ReactNode {
    const iconClass = node.member.children !== undefined && node.member.children.length > 0 ? 'fa fa-folder' : 'fa fa-file-o';
    return <i className={iconClass} style={{ marginRight: 5 }} />;
  }

  protected isExpandable(node: TreeNode): node is ExpandableTreeNode {
    if (VesDocumentationRootNode.is(node)) { return true; }

    if (VesDocumentationChildNode.is(node) && node.member.children) { return node.member.children.length > 0; }

    return false;
  }
}
