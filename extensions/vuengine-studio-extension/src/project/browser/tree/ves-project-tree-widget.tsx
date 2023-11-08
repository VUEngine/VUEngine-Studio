import { CommandService, nls } from '@theia/core';
import {
  codicon,
  ConfirmDialog,
  ContextMenuRenderer, ExpandableTreeNode,
  LabelProvider,
  NodeProps,
  open,
  OpenerService, TreeModel, TreeNode, TreeProps,
  TreeWidget
} from '@theia/core/lib/browser';
import { AlertMessage } from '@theia/core/lib/browser/widgets/alert-message';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { VesCommonService } from '../../../core/browser/ves-common-service';
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
  @inject(VesCommonService)
  protected readonly vesCommonService: VesCommonService;
  @inject(VesProjectService)
  protected readonly vesProjectService: VesProjectService;

  static readonly ID = 'ves-project-tree-widget';
  static readonly LABEL = nls.localize('vuengine/projects/project', 'Project');

  constructor(
    @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer,
    @inject(TreeModel) readonly model: TreeModel,
    @inject(TreeProps) readonly props: TreeProps,
  ) {
    super(props, model, contextMenuRenderer);

    this.id = VesProjectTreeWidget.ID;
    this.title.label = VesProjectTreeWidget.LABEL;
    this.title.caption = VesProjectTreeWidget.LABEL;
    this.title.iconClass = 'codicon codicon-library';
    this.title.closable = true;
  }

  init(): void {
    super.init();

    this.vesProjectService.onDidChangeProjectData(async () => {
      await this.setTreeData();
      await this.setTitle();
    });

    this.setTitle();
    this.setTreeData();
  }

  protected async setTreeData(): Promise<void> {
    const documents: VesProjectDocumentsTree = {
      members: []
    };

    await this.vesProjectService.ready;
    const registeredTypes = this.vesProjectService.getProjectDataTypes();
    if (registeredTypes) {
      [
        'Configuration',
        'Assets',
        'Logic',
        'Effects',
        'Other'
      ].forEach(category => {
        const categoryNode: VesProjectDocumentChild = {
          name: category,
          iconClass: '',
          children: []
        };

        Object.keys(registeredTypes).forEach(typeId => {
          const registeredType = registeredTypes[typeId];
          if (registeredType.category === category) {
            const name = registeredType.schema.title;
            const iconClass = registeredType.icon;
            const multiple = registeredType.multiple;
            if (typeId && name && iconClass) {
              const childNode: VesProjectDocumentChild = {
                typeId,
                name,
                iconClass,
                multiple,
                children: multiple ? [] : undefined
              };

              const registeredTypeChildren = this.vesProjectService.getProjectDataItemsForType(typeId);
              if (registeredTypeChildren) {
                if (registeredType.multiple) {
                  Object.keys(registeredTypeChildren).forEach(id => {
                    const item = this.vesProjectService.getProjectDataItem(typeId, id);
                    childNode.children!.push({
                      typeId: typeId,
                      uri: VesEditorUri.toUri(`${typeId}/${id}`),
                      name: item?.name as string
                        || registeredTypes[typeId]?.schema?.title
                        || typeId,
                      multiple,
                      iconClass: registeredType.icon ?? '',
                    });
                  });

                  // sort children by name
                  childNode.children?.sort((a, b) => a.name > b.name && 1 || -1);
                } else {
                  const id = Object.keys(registeredTypeChildren)[0];
                  childNode.uri = VesEditorUri.toUri(`${typeId}/${id}`);
                }
              }

              categoryNode.children!.push(childNode);
            }
          }
        });

        // sort entries by name
        categoryNode.children!.sort((a, b) => a.name > b.name && 1 || -1);

        if (categoryNode.children?.length) {
          documents.members.push(categoryNode);
        }
      });
    }

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

  protected async setTitle(): Promise<void> {
    const projectName = await this.vesProjectService.getProjectName();
    if (projectName) {
      this.title.label = `${VesProjectTreeWidget.LABEL}: ${projectName}`;
    }
  }
  protected override renderTree(model: TreeModel): React.ReactNode {
    return super.renderTree(model)
      || <AlertMessage
        type='WARNING'
        header={nls.localize('vuengine/projects/noTypesRegistered', 'No types registered.')}
      />;
  }

  protected renderTailDecorations(
    node: TreeNode,
    props: NodeProps
  ): React.ReactNode {
    const addPlus = this.isAddable(node);
    const addRemoveButton = node.parent && !VesProjectRootNode.is(node.parent)
      ? this.isAddable(node.parent)
      : false;

    return (
      <div className='node-buttons'>
        {addPlus
          ? (
            <div
              className={`node-button ${codicon('plus')}`}
              onClick={this.createAddHandler(node as VesProjectChildNode)}
            />
          )
          : ('')}
        {addRemoveButton
          ? (
            <div
              className={`node-button ${codicon('trash')}`}
              onClickCapture={this.createRemoveHandler(node as VesProjectChildNode)}
            />
          )
          : ('')}
      </div>
    );
  }

  protected createRemoveHandler(node: VesProjectChildNode): (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void {
    return event => {
      event.stopPropagation();
      const providedName = this.labelProvider.getName(node);
      const name = providedName
        ? `"${providedName}"`
        : nls.localize('vuengine/projects/thisNode', 'this node');
      const dialog = new ConfirmDialog({
        title: nls.localize('vuengine/projects/deleteNodeQuestion', 'Delete Node?'),
        msg: nls.localize('vuengine/projects/areYouSureYouWantToDelete', 'Are you sure you want to delete {0}?', name),
      });
      dialog.open().then(remove => {
        if (remove && node.parent && node.parent && TreeNode.is(node.parent)) {
          this.deleteNode(node as VesProjectChildNode);
        }
      });
    };
  }

  protected createAddHandler(node: VesProjectChildNode): (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void {
    return event => {
      if (node.member?.typeId) {
        event.stopPropagation();
        this.addNode(node.member?.typeId, false);
      }
    };
  }

  protected async deleteNode(node: Readonly<VesProjectChildNode>): Promise<void> {
    const nodeId = node.member?.uri?.path.toString();
    const nodeIdParts = nodeId?.split('/');
    const typeId = nodeIdParts && nodeIdParts[0];
    const itemId = nodeIdParts && nodeIdParts[1];

    if (typeId && itemId) {
      this.vesProjectService.deleteProjectDataItem(typeId, itemId);
      await this.setTreeData();
    } else {
      console.error('Could not delete', typeId, itemId);
    }
  }

  protected async addNode(typeId: string, isLeaf: boolean): Promise<void> {
    const newItemId = this.vesCommonService.nanoid();
    this.vesProjectService.setProjectDataItem(typeId, newItemId, {
      name: nls.localize('vuengine/editors/new', 'New'),
    }, false);
    await this.setTreeData();
    const uri = VesEditorUri.toUri(`${typeId}/${newItemId}`);
    await open(this.openerService, uri, { mode: 'reveal' });
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
    if (node) {
      if (node.member.uri) {
        // Open item (menu entries that have an URI)
        await open(this.openerService, node.member.uri, { mode: 'reveal' });
      } else if (node.member.typeId) {
        // Create a new item for menu entries which are a leaf, but do not have an item yet
        const type = this.vesProjectService.getProjectDataType(node.member.typeId);
        if (!type?.multiple) {
          await this.addNode(node.member.typeId, true);
        }
      }
    }
  }

  protected renderIcon(node: VesProjectChildNode, props: NodeProps): React.ReactNode {
    /* const iconClass = node.member?.iconClass
      ? node.member?.iconClass
      : node.member.children && node.member.children.length > 0
        ? 'codicon codicon-folder'
        : 'codicon codicon-file'; */
    const iconClass = (!node.member?.children && node.member?.multiple && node.member?.iconClass)
      ? node.member?.iconClass : '';
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

  protected isAddable(node: TreeNode): node is ExpandableTreeNode {
    return (VesProjectChildNode.is(node) && node.member.multiple && node.member.children !== undefined) ?? false;
  }
}
