import {
    MasterTreeWidget, NavigatableTreeEditorOptions, ResourceTreeEditorWidget, TreeEditor
} from '@eclipse-emfcloud/theia-tree-editor';
import { Title, Widget } from '@theia/core/lib/browser';
import { DefaultResourceProvider, ILogger } from '@theia/core/lib/common';
import { inject, injectable } from '@theia/core/shared/inversify';
import { EditorPreferences } from '@theia/editor/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { VesDetailFormWidget } from '../ves-editors-detail-form-widget';
import { VesMasterTreeWidget } from './ves-editors-master-tree-widget';

@injectable()
// @ts-ignore
export class VesEditorsTreeEditorWidget extends ResourceTreeEditorWidget {
    constructor(
        @inject(VesMasterTreeWidget)
        readonly treeWidget: VesMasterTreeWidget,
        @inject(VesDetailFormWidget)
        readonly formWidget: VesDetailFormWidget,
        @inject(WorkspaceService)
        readonly workspaceService: WorkspaceService,
        @inject(ILogger)
        readonly logger: ILogger,
        @inject(NavigatableTreeEditorOptions)
        protected readonly options: NavigatableTreeEditorOptions,
        @inject(DefaultResourceProvider)
        protected provider: DefaultResourceProvider,
        @inject(TreeEditor.NodeFactory)
        protected readonly nodeFactory: TreeEditor.NodeFactory,
        @inject(EditorPreferences)
        protected readonly editorPreferences: EditorPreferences
    ) {
        super(
            treeWidget as unknown as MasterTreeWidget,
            formWidget,
            workspaceService,
            logger,
            VesEditorsTreeEditorWidget.WIDGET_ID,
            options,
            provider,
            nodeFactory,
            editorPreferences
        );
    }

    protected getTypeProperty(): string {
        return 'typeId';
    }

    protected configureTitle(title: Title<Widget>): void {
        super.configureTitle(title);
        title.iconClass = 'fa fa-cog';
    }

    public save(): void {
        const content = JSON.stringify(this.instanceData, undefined, 4);
        // @ts-ignore
        this.resource.saveContents(content).then(
            _ => this.setDirty(false),
            error => console.error(`Resource ${this.uri} could not be saved.`, error)
        );
    }
}

export namespace VesEditorsTreeEditorWidget {
    export const WIDGET_ID = 'ves-tree-editor';
}
