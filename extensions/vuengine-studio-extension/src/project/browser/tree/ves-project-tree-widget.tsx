import { CommandService } from '@theia/core';
import {
  codicon,
  ContextMenuRenderer, ExpandableTreeNode,
  LabelProvider,
  NodeProps,
  TreeModel, TreeNode, TreeProps,
  TreeWidget
} from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { registeredProjectNodes } from '../../../editors/browser/tree/ves-editors-tree-schema';
import { VesProjectService } from '../ves-project-service';
import { VesProjectChildNode, VesProjectDocumentChild, VesProjectDocumentsTree, VesProjectRootNode } from './ves-project-tree';

@injectable()
export class VesProjectTreeWidget extends TreeWidget {
  @inject(CommandService)
  protected readonly commandService: CommandService;
  @inject(FileService)
  protected readonly fileService: FileService;
  @inject(LabelProvider)
  protected readonly labelProvider: LabelProvider;
  @inject(VesProjectService)
  protected readonly vesProjectService: VesProjectService;

  static readonly ID = 'ves-project-tree-widget';
  static readonly LABEL = 'Project';

  constructor(
    @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer,
    @inject(TreeModel) readonly model: TreeModel,
    @inject(TreeProps) readonly props: TreeProps,
  ) {
    super(props, model, contextMenuRenderer);

    this.id = VesProjectTreeWidget.ID;
    this.title.label = VesProjectTreeWidget.LABEL;
    this.title.caption = VesProjectTreeWidget.LABEL;
    this.title.iconClass = 'codicon codicon-home';
    this.title.closable = true;
  }

  async init(): Promise<void> {
    super.init();

    const projectName = await this.vesProjectService.getProjectName();
    if (projectName) {
      this.title.label = `${VesProjectTreeWidget.LABEL}: ${projectName}`;
    }

    const documents: VesProjectDocumentsTree = {
      members: []
    };

    Object.keys(registeredProjectNodes).forEach(key => {
      // @ts-ignore
      const registeredProjectNode = registeredProjectNodes[key];
      const childNode: VesProjectDocumentChild = {
        name: registeredProjectNode.title,
        iconClass: registeredProjectNode.icon
      };
      if (!registeredProjectNode.leaf) {
        childNode.children = [{
          name: 'FinishLine',
          iconClass: 'fa fa-id-card-o'
        }, {
          name: 'Racer',
          iconClass: 'fa fa-id-card-o'
        }, {
          name: 'Test',
          iconClass: 'fa fa-id-card-o'
        }];
      }
      documents.members.push(childNode);
    });

    const root: VesProjectRootNode = {
      id: 'ves-project-root',
      name: 'ves-project-root',
      visible: false,
      parent: undefined,
      children: [],
      documents
    };

    this.model.root = root;
  }

  protected renderTailDecorations(
    node: TreeNode,
    props: NodeProps
  ): React.ReactNode {
    const addPlus = this.isExpandable(node);
    const addRemoveButton = node.parent && !VesProjectRootNode.is(node.parent)
      ? this.isExpandable(node.parent)
      : false;

    return (
      <div className='node-buttons'>
        {addPlus
          ? (
            <div
              className={`node-button ${codicon('plus')}`}
            />
          )
          : ('')}
        {addRemoveButton
          ? (
            <div
              className={`node-button ${codicon('trash')}`}
            />
          )
          : ('')}
      </div>
    );
  }

  protected createNodeClassNames(node: TreeNode, props: NodeProps): string[] {
    const classNames = super.createNodeClassNames(node, props);
    if (node.parent && VesProjectRootNode.is(node.parent)) {
      classNames.push('root-node');
    }
    return classNames;
  }

  protected async handleClickEvent(node: VesProjectChildNode | undefined, event: React.MouseEvent<HTMLElement>): Promise<void> {
    super.handleClickEvent(node, event);
    this.handleDocOpen(node);
  }

  protected async handleDblClickEvent(node: VesProjectChildNode | undefined, event: React.MouseEvent<HTMLElement>): Promise<void> {
    super.handleDblClickEvent(node, event);
    this.handleDocOpen(node);
  }

  protected async handleDocOpen(node: VesProjectChildNode | undefined): Promise<void> {
    if (node) {
      // this.commandService.executeCommand(VesProjectCommands.OPEN_HANDBOOK.id, node.member.url ?? '');
    }
  }

  protected renderIcon(node: VesProjectChildNode, props: NodeProps): React.ReactNode {
    const iconClass = node.member?.iconClass
      ? node.member?.iconClass
      : node.member.children && node.member.children.length > 0
        ? 'codicon codicon-folder'
        : 'codicon codicon-file';
    return <i className={iconClass} style={{ marginRight: 5 }} />;
  }

  protected isExpandable(node: TreeNode): node is ExpandableTreeNode {
    if (VesProjectRootNode.is(node)) {
      return true;
    }

    if (VesProjectChildNode.is(node) && node.member.children) {
      return node.member.children !== undefined;
    }

    return false;
  }
}
