import { CommandService } from '@theia/core';
import {
  codicon,
  ContextMenuRenderer, ExpandableTreeNode,
  LabelProvider,
  NodeProps,
  open,
  OpenerService, TreeModel, TreeNode, TreeProps,
  TreeWidget
} from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { registeredProjectNodes, registeredTypes } from '../../../editors/browser/tree/ves-editors-tree-schema';
import { VesEditorUri } from '../../../editors/browser/ves-editor-uri';
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
  @inject(OpenerService)
  protected readonly openerService: OpenerService;
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

    this.vesProjectService.onDidChangeProjectData(async () => {
      await this.setModelRoot();
    });

    const projectName = await this.vesProjectService.getProjectName();
    if (projectName) {
      this.title.label = `${VesProjectTreeWidget.LABEL}: ${projectName}`;
    }

    await this.setModelRoot();
  }

  protected async setModelRoot(): Promise<void> {
    const documents: VesProjectDocumentsTree = {
      members: []
    };

    await this.vesProjectService.ready;
    Object.values(registeredProjectNodes).forEach(registeredProjectNode => {
      const childNode: VesProjectDocumentChild = {
        typeId: registeredProjectNode.typeId,
        name: registeredProjectNode.title,
        iconClass: registeredProjectNode.icon,
        children: [],
      };
      if (registeredProjectNode.typeId) {
        // find which types can be children of current project node
        const childTypes = Object.values(registeredTypes).filter(registeredType =>
          registeredType.parent?.typeId === registeredProjectNode.typeId
        );
        // get items of all types
        childTypes.forEach(childType => {
          const childTypeId = childType.schema.properties?.typeId.const;
          Object.keys(this.vesProjectService.getProjectDataType(childTypeId)).forEach(id => {
            const item = this.vesProjectService.getProjectDataItem(childTypeId, id);
            childNode.children!.push({
              typeId: childTypeId,
              uri: VesEditorUri.toUri(`${childTypeId}/${id}`),
              name: item.name
                || registeredTypes[childTypeId]?.schema?.title
                || childTypeId,
              iconClass: childType.icon,
            });
          });
        });
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
    );
  }

  protected createRemoveHandler(node: TreeNode): (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void {
    return event => {
      event.stopPropagation();
      /*
      const typeLabel = registeredTypes[node.jsonforms.type].schema.title;
      const dialog = new ConfirmDialog({
        title: 'Delete Node?',
        msg: `Are you sure you want to delete the ${typeLabel} "${node.name}"?`
      });
      dialog.open().then(remove => {
        if (remove && node.parent && node.parent && TreeNode.is(node.parent)) {
          this.onDeleteEmitter.fire(node);
        }
      });
      */
    };
  }

  protected createAddHandler(node: TreeNode): (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void {
    return event => {
      event.stopPropagation();
      /*
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const addHandler = (property: string, type: string): any =>
        this.onAddEmitter.fire({ node, property, type });

      // find which types can be children of current project node
      const childTypes = Object.values(registeredTypes).filter(registeredType =>
        registeredType.parent?.typeId === node.typeId;
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
      */
    };
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
    await this.handleDocOpen(node);
  }

  protected async handleDblClickEvent(node: VesProjectChildNode | undefined, event: React.MouseEvent<HTMLElement>): Promise<void> {
    super.handleDblClickEvent(node, event);
    await this.handleDocOpen(node);
  }

  protected async handleDocOpen(node: VesProjectChildNode | undefined): Promise<void> {
    if (node && node.member.uri) {
      await open(this.openerService, node.member.uri, { mode: 'reveal' });
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
