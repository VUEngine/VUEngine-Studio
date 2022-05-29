import { CompositeTreeNode, ExpandableTreeNode, SelectableTreeNode, TreeImpl, TreeNode } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesCommonService } from '../../../core/browser/ves-common-service';

@injectable()
export class VesDocumentationTree extends TreeImpl {
  @inject(VesCommonService)
  private readonly vesCommonService: VesCommonService;

  protected resolveChildren(parent: CompositeTreeNode): Promise<TreeNode[]> {
    if (VesDocumentationRootNode.is(parent)) {
      return Promise.resolve(parent.documents.members.map(m => this.makeMemberNode(m)));
    }

    if (VesDocumentationChildNode.is(parent) && parent.children) {
      return Promise.resolve(parent.member.children?.map(m => this.makeMemberNode(m)) || []);
    }

    return Promise.resolve(Array.from(parent.children));
  }

  makeMemberNode(m: VesDocumentationChild): VesDocumentationChildNode {
    const node: VesDocumentationChildNode = {
      id: this.vesCommonService.nanoid(),
      name: m.name,
      parent: undefined,
      expanded: m.url === '<handbook>',
      selected: false,
      children: [],
      member: m
    };

    return node;
  }
}

export interface VesDocumentationRootNode extends CompositeTreeNode {
  documents: VesDocumentTree;
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

export namespace VesDocumentationChildNode {
  export function is(node: object): node is VesDocumentationChildNode {
    return !!node && 'member' in node;
  }
}

export interface VesDocumentTree {
  members: VesDocumentationChild[];
}

export interface VesDocumentationChild {
  name: string;
  url?: string;
  children?: VesDocumentationChild[];
}
