import {
  ContextMenuRenderer,
  TreeModel,
  TreeProps,
  TreeWidget,
  TreeNode,
  ExpandableTreeNode
} from '@theia/core/lib/browser';
import { inject, injectable } from 'inversify';
import { MemberNode, VesDocumentationRootNode } from './ves-documentation-tree';

@injectable()
export class VesDocumentationTreeWidget extends TreeWidget {
  static readonly ID = 'ves-documentation-tree-widget';
  static readonly LABEL = 'Documentation';

  constructor(
    @inject(TreeProps) readonly props: TreeProps,
    @inject(TreeModel) readonly model: TreeModel,
    @inject(ContextMenuRenderer) contextMenuRenderer: ContextMenuRenderer
  ) {
    super(props, model, contextMenuRenderer);

    this.title.label = VesDocumentationTreeWidget.LABEL;
    this.id = VesDocumentationTreeWidget.ID;
    this.title.iconClass = 'fa fa-book';
    this.title.closable = true;

    const documents: VesDocuments = {
      name: 'Vestrit',
      members: [
        {
          name: 'Handbook',
          file: 'Ephy',
          children: [
            {
              name: 'Installation',
              file: 'Keff'
            },
            {
              name: 'Building',
              file: 'Alth',
              children: [
                {
                  name: 'Build',
                  file: 'Keff'
                },
                {
                  name: 'Run',
                  file: 'Alth'
                }
              ]
            }
          ]
        },
        {
          name: 'Engine Code Docs',
          file: 'Palle',
          children: [
            {
              name: 'Digns',
              file: 'Bums'
            },
            {
              name: 'Brät',
              file: 'AltBrot'
            }
          ]
        },
        {
          name: 'Hardware Documentation',
          file: 'Palle'
        }
      ]
    };

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

  protected isExpandable(node: TreeNode): node is ExpandableTreeNode {
    if (VesDocumentationRootNode.is(node)) { return true; }

    if (MemberNode.is(node) && node.member.children) { return node.member.children.length > 0; }

    return false;
  }
}
