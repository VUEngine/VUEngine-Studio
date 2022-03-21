import { CommandService } from '@theia/core';
import {
  ContextMenuRenderer, ExpandableTreeNode,
  LabelProvider,
  NodeProps,
  TreeModel, TreeNode, TreeProps,
  TreeWidget
} from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { VesDocumentationCommands } from '../ves-documentation-commands';
import { VesDocumentationService } from '../ves-documentation-service';
import { VesDocumentationChild, VesDocumentationChildNode, VesDocumentationRootNode, VesDocumentTree } from './ves-documentation-tree';

@injectable()
export class VesDocumentationTreeWidget extends TreeWidget {
  @inject(CommandService)
  protected readonly commandService: CommandService;
  @inject(FileService)
  protected readonly fileService: FileService;
  @inject(LabelProvider)
  protected readonly labelProvider: LabelProvider;
  @inject(VesDocumentationService)
  protected readonly vesDocumentationService: VesDocumentationService;

  static readonly ID = 'ves-documentation-tree-widget';
  static readonly LABEL = 'Documentation';

  constructor(
    @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer,
    @inject(TreeModel) readonly model: TreeModel,
    @inject(TreeProps) readonly props: TreeProps,
  ) {
    super(props, model, contextMenuRenderer);

    this.id = VesDocumentationTreeWidget.ID;
    this.title.label = VesDocumentationTreeWidget.LABEL;
    this.title.caption = VesDocumentationTreeWidget.LABEL;
    this.title.iconClass = 'codicon codicon-book';
    this.title.closable = true;
  }

  async init(): Promise<void> {
    super.init();

    const documents: VesDocumentTree = {
      members: [
        {
          name: 'VUEngine Studio Handbook',
          url: '<handbook>',
          children: []
        },
        /* {
          name: 'VUEngine Code Docs',
          // url: '<doxy>',
          children: []
        }, */
        {
          name: 'Hardware Documentation',
          url: '<stsvb>'
        }
      ]
    };

    const handbookIndexUri = await this.vesDocumentationService.getHandbookIndex();
    const handbookIndexContents = await this.fileService.readFile(handbookIndexUri);
    const handbookIndex = JSON.parse(handbookIndexContents.value.toString());

    for (const index in handbookIndex) {
      if (handbookIndex.hasOwnProperty(index)) {
        const newNode: VesDocumentationChild = {
          name: index,
          children: []
        };

        for (const documentIndex in handbookIndex[index]) {
          if (handbookIndex[index].hasOwnProperty(documentIndex)) {
            newNode.children?.push(handbookIndex[index][documentIndex]);
          }
        }

        documents.members[0].children?.push(newNode);
      }
    }

    const root: VesDocumentationRootNode = {
      id: 'ves-documentation-root',
      name: 'ves-documentation-root',
      visible: false,
      parent: undefined,
      children: [],
      documents
    };

    this.model.root = root;
  }

  protected async handleClickEvent(node: VesDocumentationChildNode | undefined, event: React.MouseEvent<HTMLElement>): Promise<void> {
    super.handleClickEvent(node, event);
    this.handleDocOpen(node);
  }

  protected async handleDblClickEvent(node: VesDocumentationChildNode | undefined, event: React.MouseEvent<HTMLElement>): Promise<void> {
    super.handleDblClickEvent(node, event);
    this.handleDocOpen(node);
  }

  protected async handleDocOpen(node: VesDocumentationChildNode | undefined): Promise<void> {
    if (node) {
      if (node.member.url === '<stsvb>') {
        this.commandService.executeCommand(VesDocumentationCommands.OPEN_TECH_SCROLL.id);
      } else if (node.member.url && node.member.url !== '' && !node.member.url.startsWith('<')) {
        this.commandService.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id, node.member.url ?? '');
      }
    }
  }

  protected renderIcon(node: VesDocumentationChildNode, props: NodeProps): React.ReactNode {
    const iconClass = props.depth === 0
      ? 'codicon codicon-book'
      : node.member.children !== undefined && node.member.children.length > 0 && node.member.url === undefined
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
}
