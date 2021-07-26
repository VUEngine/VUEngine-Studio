import { inject, injectable } from 'inversify';
import * as React from 'react';
import { join as joinPath } from 'path';
import { env } from 'process';
import { CommandService } from '@theia/core';
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
import { PreviewUri } from '@theia/preview/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import URI from '@theia/core/lib/common/uri';

import { VesDocumentationChild, VesDocumentationChildNode, VesDocumentationRootNode, VesDocumentTree } from './ves-documentation-tree';
import { VesDocumentationCommands } from '../ves-documentation-commands';

@injectable()
export class VesDocumentationTreeWidget extends TreeWidget {
  @inject(CommandService)
  protected readonly commandService: CommandService;
  @inject(FileService)
  protected readonly fileService: FileService;
  @inject(LabelProvider)
  protected readonly labelProvider: LabelProvider;

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
          children: [
            {
              name: 'Graphics',
            },
            {
              name: 'Printing',
            }
          ]
        },
        {
          name: 'Hardware Documentation',
          file: '<vbsts>'
        }
      ]
    };

    const handbookIndexUri = new URI(this.getHandbookIndex());
    const handbookIndexContents = await this.fileService.readFile(handbookIndexUri); /* eslint-disable-line */
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
      } else if (node.member.file && node.member.file !== '' && !node.member.file.startsWith('<')) {
        this.commandService.executeCommand(VesDocumentationCommands.OPEN_HANDBOOK.id, this.getHandbookUri(node.member.file ?? ''));
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

  protected getResourcesPath(): string {
    return env.THEIA_APP_PROJECT_PATH ?? '';
  }

  protected getHandbookRoot(): string {
    return joinPath(
      this.getResourcesPath(),
      'documentation',
      'vuengine-studio-documentation',
    );
  }

  protected getHandbookIndex(): string {
    return joinPath(
      this.getHandbookRoot(),
      'index.json',
    );
  }

  protected getHandbookUri(file: string): URI {
    const docUri = new URI(joinPath(
      this.getHandbookRoot(),
      ...(file + '.md').split('/'),
    ));

    return PreviewUri.encode(docUri);
  }
}
