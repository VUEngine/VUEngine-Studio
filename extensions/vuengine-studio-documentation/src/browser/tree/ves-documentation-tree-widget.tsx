import { inject, injectable } from 'inversify';
import * as React from 'react';
import { join as joinPath } from 'path';
import {
  ContextMenuRenderer,
  TreeProps,
  TreeWidget,
  TreeNode,
  ExpandableTreeNode,
  LabelProvider,
  NodeProps,
  open,
  OpenerService,
} from '@theia/core/lib/browser';
import { PreviewUri } from '@theia/preview/lib/browser';
import URI from '@theia/core/lib/common/uri';

import { VesDocumentationChildNode, VesDocumentationRootNode } from './ves-documentation-tree';
import { VesDocumentationTreeModel } from './ves-documentation-tree-model';
import { CommandService } from '@theia/core';
import { VesDocumentationCommands } from '../ves-documentation-commands';

@injectable()
export class VesDocumentationTreeWidget extends TreeWidget {
  @inject(CommandService)
  protected readonly commandService: CommandService;
  @inject(LabelProvider)
  protected readonly labelProvider: LabelProvider;
  @inject(OpenerService)
  protected readonly openerService: OpenerService;

  static readonly ID = 'ves-documentation-tree-widget';
  static readonly LABEL = 'Documentation';

  constructor(
    @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer,
    @inject(VesDocumentationTreeModel) readonly model: VesDocumentationTreeModel,
    @inject(TreeProps) readonly props: TreeProps,
  ) {
    super(props, model, contextMenuRenderer);

    this.title.label = VesDocumentationTreeWidget.LABEL;
    this.id = VesDocumentationTreeWidget.ID;
    this.title.iconClass = 'fa fa-book';
    this.title.closable = true;
  }

  protected handleClickEvent(node: VesDocumentationChildNode | undefined, event: React.MouseEvent<HTMLElement>): void {
    super.handleClickEvent(node, event);
    this.handleDocOpen(node);
  }

  protected handleDblClickEvent(node: VesDocumentationChildNode | undefined, event: React.MouseEvent<HTMLElement>): void {
    super.handleDblClickEvent(node, event);
    this.handleDocOpen(node);
  }

  protected handleDocOpen(node: VesDocumentationChildNode | undefined): void {
    if (node) {
      if (node.member.file === '<vbsts>') {
        this.commandService.executeCommand(VesDocumentationCommands.OPEN_TECH_SCROLL.id);
      } else if (node.member.file && node.member.file !== '') {
        open(this.openerService, this.getHandbookUri(node.member.file ?? ''));
      }
    }
  }

  protected renderIcon(node: VesDocumentationChildNode, props: NodeProps): React.ReactNode {
    const iconClass = props.depth === 0
      ? 'fa fa-book'
      : node.member.children !== undefined && node.member.children.length > 0 && node.member.file === undefined
        ? 'fa fa-folder'
        : 'fa fa-file-text-o';
    return <i className={iconClass} style={{ marginRight: 5 }} />;
  }

  protected isExpandable(node: TreeNode): node is ExpandableTreeNode {
    if (VesDocumentationRootNode.is(node)) {
      return true;
    }

    if (VesDocumentationChildNode.is(node) && node.member.children) {
      return node.member.children.length > 0;
    }

    return false;
  }

  protected getHandbookUri(file: string): URI {
    const docUri = new URI(joinPath(
      this.model.getHandbookRoot(),
      ...(file + '.md').split('/'),
    ));

    return PreviewUri.encode(docUri);
  }
}
