import { TreeEditor } from '@eclipse-emfcloud/theia-tree-editor';
import { JsonSchema, UISchemaElement } from '@jsonforms/core';
import { MaybePromise } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { registeredTypes } from './ves-editors-tree-schema';

@injectable()
export class VesEditorsTreeModelService implements TreeEditor.ModelService {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getDataForNode(node: TreeEditor.Node): MaybePromise<any> {
        return node.jsonforms.data;
    }

    getSchemaForNode(node: TreeEditor.Node): MaybePromise<JsonSchema | undefined> {
        const definitions = {};
        Object.keys(registeredTypes).forEach(key => {
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

        return registeredTypes[type]?.schema;
    }

    getUiSchemaForNode(node: TreeEditor.Node): MaybePromise<UISchemaElement | undefined> {
        const type = node.jsonforms.type;

        if (registeredTypes[type].uiSchema !== undefined) {
            return registeredTypes[type].uiSchema;
        }

        return undefined;
    }

    getChildrenMapping(): Map<string, TreeEditor.ChildrenDescriptor[]> {
        const childrenMapping: Map<string, TreeEditor.ChildrenDescriptor[]> = new Map([]);

        Object.keys(registeredTypes).forEach(key => {
            const childTypes = Object.values(registeredTypes).filter(registeredType =>
                registeredType.parent?.typeId === key
            );
            const childTypeIds = childTypes.map(childType => childType.schema.properties?.typeId.const);

            childrenMapping.set(key, [{
                property: 'children',
                children: childTypeIds
            }]);
        });

        return childrenMapping;
    }

    getNameForType(typeId: string): string {
        return registeredTypes[typeId]?.schema?.title || typeId;
    }
}
