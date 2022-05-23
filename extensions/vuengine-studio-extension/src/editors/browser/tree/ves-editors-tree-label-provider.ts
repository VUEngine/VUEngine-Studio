import { TreeEditor } from '@eclipse-emfcloud/theia-tree-editor';
import { LabelProviderContribution } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { VesProjectService } from '../../../project/browser/ves-project-service';
import { VesEditorsTreeEditorWidget } from './ves-editors-tree-editor-widget';

@injectable()
export class VesEditorsTreeLabelProvider implements LabelProviderContribution {
    @inject(VesProjectService)
    readonly vesProjectService: VesProjectService;

    public canHandle(element: object): number {
        if ((TreeEditor.Node.is(element) || TreeEditor.CommandIconInfo.is(element))
            && element.editorId === VesEditorsTreeEditorWidget.WIDGET_ID) {
            return 1000;
        }
        return 0;
    }

    public getIcon(element: object): string | undefined {
        let iconClass: string | undefined;
        const registeredTypes = this.vesProjectService.getRegisteredTypes();
        if (TreeEditor.CommandIconInfo.is(element)) {
            iconClass = registeredTypes[element.type]?.icon || 'fa fa-question-circle';
        } else if (TreeEditor.Node.is(element)) {
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
        const registeredTypes = this.vesProjectService.getRegisteredTypes();
        return registeredTypes[typeId]?.schema?.title || typeId;
    }
}
