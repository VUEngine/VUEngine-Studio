import { CompositeTreeNode, ExpandableTreeNode, SelectableTreeNode, TreeImpl, TreeNode } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesCommonService } from '../../../core/browser/ves-common-service';

@injectable()
export class VesProjectTree extends TreeImpl {
  @inject(VesCommonService)
  private readonly vesCommonService: VesCommonService;

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
      id: this.vesCommonService.nanoid(),
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
  typeId: string;
  name: string;
  uri?: URI;
  url?: string; // TODO: remove
  iconClass: string;
  children?: VesProjectDocumentChild[];
}
