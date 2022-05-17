import { TreeEditor } from '@eclipse-emfcloud/theia-tree-editor';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { MaybePromise } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { registeredTypes } from './ves-editors-tree-schema';

@injectable()
export class VesEditorsTreeModelService implements TreeEditor.ModelService {

    constructor(
    ) { }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getDataForNode(node: TreeEditor.Node): MaybePromise<any> {
        return node.jsonforms.data;
    }

    getSchemaForNode(node: TreeEditor.Node): MaybePromise<JsonSchema | undefined> {
        const definitions = {};
        Object.keys(registeredTypes).forEach(key => {
            // @ts-ignore
            if (registeredTypes[key] !== undefined) {
                // @ts-ignore
                definitions[key] = registeredTypes[key].schema;
            }

        });
        return {
            definitions,
            ...this.getSchemaForType(node.jsonforms.type),
        };
    }

    private getSchemaForType(type: string): MaybePromise<JsonSchema | undefined> {
        if (!type) {
            return undefined;
        }

        // @ts-ignore
        return registeredTypes[type]?.schema;
    }

    getUiSchemaForNode(node: TreeEditor.Node): MaybePromise<UISchemaElement | undefined> {
        const type = node.jsonforms.type;

        // @ts-ignore
        if (registeredTypes[type].uiSchema !== undefined) {
            // @ts-ignore
            return registeredTypes[type].uiSchema;
        }

        return undefined;
    }

    getChildrenMapping(): Map<string, TreeEditor.ChildrenDescriptor[]> {
        const childrenMapping: Map<string, TreeEditor.ChildrenDescriptor[]> = new Map([]);

        Object.keys(registeredTypes).forEach(key => {
            const children: string[] = [];
            // @ts-ignore
            if (registeredTypes[key].children !== undefined) {
                // @ts-ignore
                Object.keys(registeredTypes[key].children).forEach(childType => {
                    // @ts-ignore
                    if (registeredTypes[key].children[childType].addOrRemovable === true) {
                        children.push(childType);
                    }
                });
            }
            if (children.length) {
                childrenMapping.set(key, [{
                    property: 'children',
                    children
                }]);
            }
        });

        return childrenMapping;
    }

    getNameForType(typeId: string): string {
        // @ts-ignore
        return registeredTypes[typeId]?.schema?.title || typeId;
    }
}
