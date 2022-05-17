import { injectable } from '@theia/core/shared/inversify';
import { v4 as uuid } from 'uuid';
import { TreeImpl, CompositeTreeNode, TreeNode, ExpandableTreeNode, SelectableTreeNode } from '@theia/core/lib/browser';

@injectable()
export class VesProjectTree extends TreeImpl {
  protected resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> {
    if (VesProjectRootNode.is(parent)) {
      return Promise.resolve(parent.documents.members.map(m => this.makeMemberNode(m)));
    }

    if (VesProjectChildNode.is(parent) && parent.children) {
      return Promise.resolve(parent.member.children?.map(m => this.makeMemberNode(m)) || []);
    }

    return Promise.resolve(Array.from(parent.children));
  }

  makeMemberNode(m: VesProjectDocumentChild): VesProjectChildNode {
    const node: VesProjectChildNode = {
      id: uuid(),
      name: m.name,
      parent: undefined,
      expanded: false,
      selected: false,
      children: [],
      member: m
    };

    return node;
  }
}

export interface VesProjectRootNode extends CompositeTreeNode {
  documents: VesProjectDocumentsTree;
}

export namespace VesProjectRootNode {
  export function is(node: object): node is VesProjectRootNode {
    return !!node && 'documents' in node;
  }
}

export interface VesProjectChildNode
  extends CompositeTreeNode,
  ExpandableTreeNode,
  SelectableTreeNode {
  member: VesProjectDocumentChild;
}

export namespace VesProjectChildNode {
  export function is(node: object): node is VesProjectChildNode {
    return !!node && 'member' in node;
  }
}

export interface VesProjectDocumentsTree {
  members: VesProjectDocumentChild[];
}

export interface VesProjectDocumentChild {
  name: string;
  url?: string;
  iconClass: string;
  children?: VesProjectDocumentChild[];
}
