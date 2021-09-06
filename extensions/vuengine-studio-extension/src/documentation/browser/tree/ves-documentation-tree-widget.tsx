import { CommandService } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import {
  ContextMenuRenderer,
  TreeProps,
  TreeWidget,
  TreeNode,
  ExpandableTreeNode,
  LabelProvider,
  NodeProps,
  TreeModel,
} from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import URI from '@theia/core/lib/common/uri';
import { VesDocumentationChild, VesDocumentationChildNode, VesDocumentationRootNode, VesDocumentTree } from './ves-documentation-tree';
import { VesDocumentationCommands } from '../ves-documentation-commands';
import { VesDocumentationService } from '../ves-documentation-service';

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
    this.title.iconClass = 'fa fa-book';
    this.title.closable = true;
  }

  async init(): Promise<void> {
    super.init();

    const documents: VesDocumentTree = {
      members: [
        {
          name: 'Handbook',
          file: '<handbook>',
          children: []
        },
        {
          name: 'Engine Code Docs',
          // file: '<doxy>',
          children: []
        },
        {
          name: 'Hardware Documentation',
          file: '<stsvb>'
        }
      ]
    };

    const handbookIndexUri = new URI(await this.vesDocumentationService.getHandbookIndex());
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
      if (node.member.file === '<stsvb>') {
        this.commandService.executeCommand(VesDocumentationCommands.OPEN_TECH_SCROLL.id);
      } else if (node.member.file && node.member.file !== '' && !node.member.file.startsWith('<')) {
        this.commandService.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id, node.member.file ?? '');
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
}
