import { TreeEditor } from '@eclipse-emfcloud/theia-tree-editor';
import { ILogger } from '@theia/core';
import { inject, injectable } from '@theia/core/shared/inversify';
import { v4 } from 'uuid';
import { VesEditorsTreeEditorWidget } from './ves-editors-tree-editor-widget';
import { VesEditorsTreeLabelProvider } from './ves-editors-tree-label-provider';
import { registeredTypes } from './ves-editors-tree-schema';

@injectable()
export class VesEditorsTreeNodeFactory implements TreeEditor.NodeFactory {
    constructor(
        @inject(VesEditorsTreeLabelProvider)
        private readonly labelProvider: VesEditorsTreeLabelProvider,
        @inject(ILogger)
        private readonly logger: ILogger) {
    }

    mapDataToNodes(treeData: TreeEditor.TreeData): TreeEditor.Node[] {
        const node = this.mapData(treeData.data);
        if (node) {
            return [node];
        }
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mapData(data: any, parent?: TreeEditor.Node, property?: string, indexOrKey?: number | string): TreeEditor.Node {
        if (!data) {
            this.logger.warn('mapData called without data');
        }

        const node: TreeEditor.Node = {
            ...this.defaultNode(),
            editorId: VesEditorsTreeEditorWidget.WIDGET_ID,
            name: this.labelProvider.getName(data)!,
            parent: parent,
            jsonforms: {
                type: this.getTypeId(data),
                data: data,
                property: property!,
                index: typeof indexOrKey === 'number' ? indexOrKey.toFixed(0) : indexOrKey
            }
        };

        // containments
        if (parent) {
            parent.children.push(node);
            parent.expanded = true;
        }
        if (data.children) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const children = data.children as Array<any>;
            // component types
            children.forEach((element, idx) => {
                this.mapData(element, node, 'children', idx);
            });
        }

        return node;
    }

    hasCreatableChildren(node: TreeEditor.Node): boolean {
        if (!node) {
            return false;
        }

        const childTypes = Object.values(registeredTypes).filter(registeredType =>
            registeredType.parent?.typeId === node.jsonforms.type &&
            registeredType.parent?.multiple === true
        );

        return childTypes.length > 0;
    }

    canBeDeleted(node: TreeEditor.Node): boolean {
        // @ts-ignore
        return this.hasCreatableChildren(node.parent);
    }

    protected defaultNode(): Omit<TreeEditor.Node, 'editorId'> {
        return {
            id: v4(),
            expanded: false,
            selected: false,
            parent: undefined,
            children: [],
            decorationData: {},
            name: '',
            jsonforms: {
                type: '',
                property: '',
                data: undefined
            }
        };
    }

    /** Derives the type id from the given data. */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected getTypeId(data: any): string {
        return data && data.typeId || '';
    }
}
