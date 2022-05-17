import { injectable } from '@theia/core/shared/inversify';
import { LabelProviderContribution } from '@theia/core/lib/browser';
import { VesEditorsTreeEditorWidget } from './ves-editors-tree-editor-widget';
import { TreeEditor } from '@eclipse-emfcloud/theia-tree-editor';
import { registeredTypes } from './ves-editors-tree-schema';

@injectable()
export class VesEditorsTreeLabelProvider implements LabelProviderContribution {
    public canHandle(element: object): number {
        if ((TreeEditor.Node.is(element) || TreeEditor.CommandIconInfo.is(element))
            && element.editorId === VesEditorsTreeEditorWidget.WIDGET_ID) {
            return 1000;
        }
        return 0;
    }

    public getIcon(element: object): string | undefined {
        let iconClass: string | undefined;
        if (TreeEditor.CommandIconInfo.is(element)) {
            // @ts-ignore
            iconClass = registeredTypes[element.type]?.icon || 'fa fa-question-circle';
        } else if (TreeEditor.Node.is(element)) {
            // @ts-ignore
            iconClass = registeredTypes[element.jsonforms.type]?.icon || 'fa fa-question-circle';
        }

        return iconClass ? iconClass : 'fa fa-question-circle';
    }

    public getName(element: object): string | undefined {
        const data = TreeEditor.Node.is(element) ? element.jsonforms.data : element;
        if (data.name) {
            return data.name;
        } else if (data.typeId) {
            return this.getTypeName(data.typeId);
        }

        return undefined;
    }

    private getTypeName(typeId: string): string {
        // @ts-ignore
        return registeredTypes[typeId]?.schema?.title || typeId;
    }
}
