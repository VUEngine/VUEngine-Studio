import { inject, injectable } from 'inversify';
import * as React from 'react';
import { join as joinPath } from 'path';
import { env } from 'process';
import {
  ContextMenuRenderer,
  TreeModel,
  TreeProps,
  TreeWidget,
  TreeNode,
  ExpandableTreeNode,
  LabelProvider,
  NodeProps
} from '@theia/core/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';

import { VesDocumentationChild, VesDocumentationChildNode, VesDocumentationRootNode, VesDocumentTree } from './ves-documentation-tree';
import URI from '@theia/core/lib/common/uri';

@injectable()
export class VesDocumentationTreeWidget extends TreeWidget {
  static readonly ID = 'ves-documentation-tree-widget';
  static readonly LABEL = 'Documentation';

  constructor(
    @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer,
    @inject(FileService) protected readonly fileService: FileService,
    @inject(LabelProvider) protected readonly labelProvider: LabelProvider,
    @inject(TreeModel) readonly model: TreeModel,
    @inject(TreeProps) readonly props: TreeProps,
  ) {
    super(props, model, contextMenuRenderer);

    this.title.label = VesDocumentationTreeWidget.LABEL;
    this.id = VesDocumentationTreeWidget.ID;
    this.title.iconClass = 'fa fa-book';
    this.title.closable = true;
  }

  protected async init(): Promise<void> {
    super.init();



    const documents: VesDocumentTree = {
      members: [
        {
          name: 'Handbook',
          children: []
        },
        {
          name: 'Engine Code Docs',
          children: [
            {
              name: 'Digns',
            },
            {
              name: 'Brät',
            }
          ]
        },
        {
          name: 'Hardware Documentation',
          file: 'vbsts'
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

  protected renderIcon(node: VesDocumentationChildNode, props: NodeProps): React.ReactNode {
    const iconClass = node.member.children !== undefined && node.member.children.length > 0 ? 'fa fa-folder' : 'fa fa-file-o';
    return <i className={iconClass} style={{ marginRight: 5 }} />;
  }

  protected isExpandable(node: TreeNode): node is ExpandableTreeNode {
    if (VesDocumentationRootNode.is(node)) { return true; }

    if (VesDocumentationChildNode.is(node) && node.member.children) { return node.member.children.length > 0; }

    return false;
  }

  getResourcesPath(): string {
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
}
