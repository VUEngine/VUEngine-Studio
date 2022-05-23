import { AddCommandProperty, NavigatableTreeEditorWidget, TreeEditor } from '@eclipse-emfcloud/theia-tree-editor';
import { Message, Saveable, Title, Widget } from '@theia/core/lib/browser';
import { DefaultResourceProvider, ILogger } from '@theia/core/lib/common';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { EditorPreferences } from '@theia/editor/lib/browser';
import { WorkspaceService } from '@theia/workspace/lib/browser/workspace-service';
import { VesProjectService } from '../../../project/browser/ves-project-service';
import { VesDetailFormWidget } from '../ves-editors-detail-form-widget';
import { VesMasterTreeWidget } from './ves-editors-master-tree-widget';

export const VesEditorsTreeEditorOptions = Symbol(
    'VesEditorsTreeEditorOptions'
);
export interface VesEditorsTreeEditorOptions {
    id: string;
    uri: URI;
}

@injectable()
export class VesEditorsTreeEditorWidget extends NavigatableTreeEditorWidget {
    @inject(VesProjectService)
    readonly vesProjectService: VesProjectService;

    constructor(
        @inject(VesMasterTreeWidget)
        readonly treeWidget: VesMasterTreeWidget,
        @inject(VesDetailFormWidget)
        readonly formWidget: VesDetailFormWidget,
        @inject(WorkspaceService)
        protected readonly workspaceService: WorkspaceService,
        @inject(ILogger)
        protected readonly logger: ILogger,
        @inject(VesEditorsTreeEditorOptions)
        protected readonly options: VesEditorsTreeEditorOptions,
        @inject(DefaultResourceProvider)
        protected readonly provider: DefaultResourceProvider,
        @inject(TreeEditor.NodeFactory)
        protected readonly nodeFactory: TreeEditor.NodeFactory,
        @inject(EditorPreferences)
        protected readonly editorPreferences: EditorPreferences
    ) {
        super(
            treeWidget,
            formWidget,
            workspaceService,
            logger,
            VesEditorsTreeEditorWidget.WIDGET_ID,
            options
        );
    }

    @postConstruct()
    protected async init(): Promise<void> {
        await this.load();
        super.init();

        if (this.instanceData.children === undefined && !this.hasClass('form-only')) {
            this.addClass('form-only');
        }

        this.autoSave = this.editorPreferences['files.autoSave'];
        this.autoSaveDelay = this.editorPreferences['files.autoSaveDelay'];
        this.editorPreferences.onPreferenceChanged(ev => {
            if (ev.preferenceName === 'files.autoSave') {
                this.autoSave = ev.newValue;
            }
            if (ev.preferenceName === 'files.autoSaveDelay') {
                this.autoSaveDelay = ev.newValue;
            }
        });
        this.onDirtyChanged(ev => {
            if (this.autoSave === 'afterDelay' && this.dirty) {
                this.saveDelayed();
            }
        });
    }

    async revert(options?: Saveable.RevertOptions): Promise<void> {
        return this.load();
    }

    applySnapshot(snapshot: { value: string }): void {
        super.applySnapshot(snapshot);
        this.setTreeData(false);
    }

    protected getTypeProperty(): string {
        return 'typeId';
    }

    protected configureTitle(title: Title<Widget>): void {
        super.configureTitle(title);

        const typeData = this.vesProjectService.getRegisteredTypes()[this.instanceData.typeId];
        title.label = this.instanceData.name
            ? `${typeData.schema.title}: ${this.instanceData.name}`
            : typeData.schema.title!;
        title.caption = '';
        title.iconClass = typeData?.icon ?? 'fa fa-file';
    }

    public async save(): Promise<void> {
        const idParts = this.options.id.substring(1).split('/');
        const typeId = idParts[0];
        const itemId = idParts[1];
        const success = await this.vesProjectService.setProjectDataItem(typeId, itemId, this.instanceData);
        if (success) {
            this.setDirty(false);

            // potentially update name in title
            this.configureTitle(this.title);
        } else {
            // TODO
        }
    }

    protected async load(): Promise<void> {
        const idParts = this.options.id.substring(1).split('/');
        const typeId = idParts[0];
        const itemId = idParts[1];
        this.instanceData = this.vesProjectService.getProjectDataItem(typeId, itemId);
        await this.setTreeData(false);
    }

    protected setTreeData(error: boolean): Promise<void> {
        const treeData: TreeEditor.TreeData = {
            error,
            data: this.instanceData
        };
        return this.treeWidget.setData(treeData);
    }

    protected async deleteNode(node: Readonly<TreeEditor.Node>): Promise<void> {
        if (node.parent && TreeEditor.Node.is(node.parent)) {
            const propertyData = node.parent.jsonforms.data[node.jsonforms.property];
            if (Array.isArray(propertyData)) {
                propertyData.splice(Number(node.jsonforms.index), 1);
                // eslint-disable-next-line no-null/no-null
            } else if (propertyData !== null && typeof propertyData === 'object') {
                // @ts-ignore
                propertyData[node.jsonforms.index] = undefined;
            } else {
                this.logger.error(`Could not delete node's data from its parent's property ${node.jsonforms.property}. Property data:`, propertyData);
                return;
            }

            // Data was changed in place but need to trigger tree updates.
            await this.treeWidget.updateDataForSubtree(node.parent, node.parent.jsonforms.data);
            this.handleChanged();
        }
    }

    protected async addNode({ node, type, property }: AddCommandProperty): Promise<void> {
        // Create an empty object that only contains its type identifier
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newData: { [k: string]: any } = {};
        newData[this.getTypeProperty()] = type;

        // TODO handle children not being stored in an array

        if (!node.jsonforms.data[property]) {
            node.jsonforms.data[property] = [];
        }
        node.jsonforms.data[property].push(newData);
        await this.treeWidget.updateDataForSubtree(node, node.jsonforms.data);
        this.handleChanged();
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected async handleFormUpdate(data: any, node: TreeEditor.Node): Promise<void> {
        await this.treeWidget.updateDataForSubtree(node, data);
        this.handleChanged();
    }

    protected handleChanged(): void {
        this.setDirty(true);
    }

    protected onAfterHide(msg: Message): void {
        if (this.autoSave === 'onFocusChange' || this.autoSave === 'onWindowChange') {
            this.save();
        }
    }

    protected saveDelayed(): void {
        const handle = window.setTimeout(() => {
            this.save();
            window.clearTimeout(handle);
        }, this.autoSaveDelay);
    }
}

export namespace VesEditorsTreeEditorWidget {
    export const WIDGET_ID = 'ves-tree-editor';
}
