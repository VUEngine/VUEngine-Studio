import { v4 as uuid } from 'uuid';
import {
  TreeImpl,
  CompositeTreeNode,
  TreeNode,
  ExpandableTreeNode,
  SelectableTreeNode
} from '@theia/core/lib/browser';
import { injectable } from 'inversify';

@injectable()
export class VesDocumentationTree extends TreeImpl {
  protected resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> {
    if (VesDocumentationRootNode.is(parent)) {
      return Promise.resolve(
        parent.documents.members.map(m => this.makeMemberNode(m))
      );
    }

    if (MemberNode.is(parent) && parent.children) {
      return Promise.resolve(
        parent.member.children?.map(m => this.makeMemberNode(m)) || []
      );
    }

    return Promise.resolve(Array.from(parent.children));
  }

  makeMemberNode(m: VesDocumentationChild) {
    const node: VesDocumentationChildNode = {
      id: uuid(),
      name: m.name,
      parent: undefined,
      expanded: true,
      selected: false,
      children: [],
      member: m
    };
    return node;
  }
}

export interface VesDocumentationRootNode extends CompositeTreeNode {
  documents: VesDocuments;
}

export namespace VesDocumentationRootNode {
  export function is(node: object): node is VesDocumentationRootNode {
    return !!node && 'documents' in node;
  }
}

export interface VesDocumentationChildNode
  extends CompositeTreeNode,
  ExpandableTreeNode,
  SelectableTreeNode {
  member: VesDocumentationChild;
}

export namespace MemberNode {
  export function is(node: object): node is VesDocumentationChildNode {
    return !!node && 'member' in node;
  }
}
