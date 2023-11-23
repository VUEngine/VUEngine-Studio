import { JsonFormsCore, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import { JsonFormsStyleContext, StyleContext, vanillaCells, vanillaRenderers, vanillaStyles } from '@jsonforms/vanilla-renderers';
import { Message } from '@phosphor/messaging';
import { CommandService, Emitter, Event, MessageService, Reference, UNTITLED_SCHEME, URI, nls } from '@theia/core';
import { CommonCommands, LabelProvider, LocalStorageService, Saveable, SaveableSource } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { EditorPreferences } from '@theia/editor/lib/browser';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { MonacoEditorModel } from '@theia/monaco/lib/browser/monaco-editor-model';
import { MonacoTextModelService } from '@theia/monaco/lib/browser/monaco-text-model-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { deepmerge } from 'deepmerge-ts';
import cloneDeep from 'lodash/cloneDeep';
import { VesCodeGenService } from '../../codegen/browser/ves-codegen-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { ProjectFile, ProjectFileType } from '../../project/browser/ves-project-types';
import { VesRumblePackService } from '../../rumble-pack/browser/ves-rumble-pack-service';
import { VES_RENDERERS } from './renderers/ves-renderers';

export const VesEditorsWidgetOptions = Symbol('VesEditorsWidgetOptions');
export interface VesEditorsWidgetOptions {
    typeId: string
    uri: string
}

export interface ItemData {
    [id: string]: unknown
};

const MAX_HISTORY_ENTRIES = 100;

@injectable()
export class VesEditorsWidget extends ReactWidget implements Saveable, SaveableSource {
    @inject(CommandService)
    protected readonly commandService: CommandService;
    @inject(EditorPreferences)
    protected readonly editorPreferences: EditorPreferences;
    @inject(FileDialogService)
    protected readonly fileDialogService: FileDialogService;
    @inject(FileService)
    protected readonly fileService: FileService;
    @inject(LabelProvider)
    protected readonly labelProvider: LabelProvider;
    @inject(MessageService)
    protected readonly messageService: MessageService;
    @inject(LocalStorageService)
    protected readonly localStorageService: LocalStorageService;
    @inject(MonacoTextModelService)
    protected readonly modelService: MonacoTextModelService;
    @inject(VesCommonService)
    protected readonly vesCommonService: VesCommonService;
    @inject(VesEditorsWidgetOptions)
    protected readonly options: VesEditorsWidgetOptions;
    @inject(VesCodeGenService)
    protected readonly vesCodeGenService: VesCodeGenService;
    @inject(VesProjectService)
    protected readonly vesProjectService: VesProjectService;
    @inject(VesRumblePackService)
    private readonly vesRumblePackService: VesRumblePackService;
    @inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService;

    protected projectData: ProjectFile | undefined;
    protected data: ItemData | undefined;
    protected savedData: ItemData | undefined;

    protected history: ItemData[] = [];
    protected historyIndex: number = -1;

    protected schema: JsonSchema | undefined;
    protected uiSchema: UISchemaElement | undefined;
    private jsonformsOnChange: (state: Pick<JsonFormsCore, 'data' | 'errors'>) => void;

    public dirty = false;
    public autoSave: 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange' = 'off';
    protected autoSaveDelay: number;

    uri: URI;
    protected reference: Reference<MonacoEditorModel>;
    protected justSaved: boolean = false;
    protected loading: boolean = true;

    protected readonly onDirtyChangedEmitter = new Emitter<void>();
    get onDirtyChanged(): Event<void> {
        return this.onDirtyChangedEmitter.event;
    }

    get saveable(): Saveable {
        return this;
    }

    protected changeEmitter = new Emitter<Readonly<ItemData>>();
    get onChange(): Event<Readonly<ItemData>> {
        return this.changeEmitter.event;
    }

    static readonly ID = 'vesEditorsWidget';
    static readonly LABEL = 'Editor';

    @postConstruct()
    protected init(): void {
        this.uri = new URI(this.options.uri);

        this.doInit();
        const label = this.labelProvider.getLongName(this.uri);

        const path = (this.uri.scheme === UNTITLED_SCHEME)
            ? `untitled-${this.options.typeId}-${this.vesCommonService.nanoid()}`
            : this.uri.path;
        this.id = `vesEditorsWidget:${path}`;

        this.title.label = label;
        this.title.caption = label;
        this.title.iconClass = 'fa fa-cog';
        this.title.closable = true;

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

        this.onChange(d => {
            this.handleChanged(d);
        });

        this.toDispose.push(this.changeEmitter);
        this.jsonformsOnChange = (state: Pick<JsonFormsCore, 'data' | 'errors'>) =>
            this.changeEmitter.fire(state.data);
    }

    protected async doInit(): Promise<void> {
        await this.vesProjectService.projectDataReady;

        const type = this.vesProjectService.getProjectDataType(this.options.typeId);
        if (!type) {
            return;
        }

        const reference = await this.modelService.createModelReference(this.uri);
        if (this.toDispose.disposed) {
            reference.dispose();
            return;
        }
        this.toDispose.push(this.reference = reference);
        this.reference.object.onDidSaveModel(async () => {
            this.changeEmitter.fire(this.data!);
            if (!this.justSaved) {
                await this.loadData(type);
                this.update();
            } else {
                this.justSaved = false;
            }
        });

        this.schema = type?.schema;
        this.uiSchema = type?.uiSchema;
        if (type?.icon) {
            this.title.iconClass = type.icon;
        }
        this.projectData = this.vesProjectService.getProjectData();

        await this.loadData(type);

        this.initHistory();
        this.loading = false;
        this.update();
    }

    protected async loadData(type: ProjectFileType): Promise<void> {
        let json = {};
        try {
            json = JSON.parse(this.reference?.object.getText() || '{}');
        } catch (error) {
            console.error('Malformed JSON, could not update editor.');
            return;
        }
        this.data = json as ItemData;
        await this.mergeOntoDefaults(type);
        this.setSavedData();

        this.setTitle();
    }

    protected setTitle(): void {
        const name = this.uri.path.base;
        this.title.label = name;
        this.title.caption = name;
    }

    protected onActivateRequest(msg: Message): void {
        this.node.focus();
    }

    async revert(options?: Saveable.RevertOptions): Promise<void> {
        if (this.dirty) {
            this.data = this.savedData;
            this.setDirty(false);
            this.setTitle();
        }
    }

    createSnapshot(): Saveable.Snapshot {
        const state = JSON.stringify(this.data);
        return { value: state };
    }

    applySnapshot(snapshot: { value: string }): void {
        this.data = JSON.parse(snapshot.value);
    }

    undo(): void {
        if (this.undoHistory()) {
            this.setDirty(this.dataHasBeenChanged());
            this.setTitle();
            this.update();
        }
    }

    redo(): void {
        if (this.redoHistory()) {
            this.setDirty(this.dataHasBeenChanged());
            this.setTitle();
            this.update();
        }
    }

    protected initHistory(): void {
        if (!this.history.length) {
            this.pushToHistory();
        }
    }

    protected pushToHistory(): void {
        // only add to history if there have been changes compared to last history entry
        if (this.historyIndex === -1 || JSON.stringify(this.data) !== JSON.stringify(this.history[this.historyIndex])) {
            // remove any entries beyond current, aka invalidate redos
            if (this.history.length > this.historyIndex + 1) {
                this.history = this.history.slice(0, this.historyIndex + 1);
            }

            // truncate oldest entry if reached max history size
            this.history.push(cloneDeep(this.data!));
            if (this.history.length > MAX_HISTORY_ENTRIES) {
                this.history.slice(1);
            } else {
                this.historyIndex++;
            }
        }
    }

    protected undoHistory(): boolean {
        if (this.history[this.historyIndex - 1]) {
            this.historyIndex--;
            this.data = cloneDeep(this.history[this.historyIndex]);

            return true;
        }

        return false;
    }

    protected redoHistory(): boolean {
        if (this.history[this.historyIndex + 1]) {
            this.historyIndex++;
            this.data = cloneDeep(this.history[this.historyIndex]);

            return true;
        }

        return false;
    }

    async save(): Promise<void> {
        if (this.uri.scheme === UNTITLED_SCHEME) {
            this.commandService.executeCommand(CommonCommands.SAVE_AS.id);
        } else if (this.dirty) {
            try {
                this.reference.object.textEditorModel.setValue(JSON.stringify(this.data, undefined, 4));
                this.justSaved = true;
                this.setDirty(false);
                this.setSavedData();
                this.vesCodeGenService.renderTemplatesForItem(this.options.typeId, this.data, this.uri);
            } catch (error) {
                console.error('Could not save');
            }
        }
    }

    protected setSavedData(): void {
        this.savedData = this.data;
    }

    protected async mergeOntoDefaults(type: ProjectFileType): Promise<void> {
        const schema = await window.electronVesCore.dereferenceJsonSchema(type.schema);
        this.data = this.generateDataFromSchema({
            ...schema,
            type: 'object'
        }, this.data);

        if (this.data?.name === '') {
            this.data.name = this.uri.path.name;
        }

        if (this.data?._id === '') {
            this.data!._id = this.vesCommonService.nanoid();
        }

        this.data = window.electronVesCore.sortJson(this.data ?? {}, {
            depth: 8,
            ignoreCase: true,
            reverse: false,
        });
    }

    /**
     * Generates JSON from schema, using either values present in data or schema default.
     * Will only contain properties that are present in the schema.
     */
    protected generateDataFromSchema(schema: any, data: any): any {
        if (!schema) {
            return;
        }

        const getValue = (def: any) => (data !== undefined)
            ? data
            : (schema.default !== undefined)
                ? schema.default
                : def;

        switch (schema.type) {
            case 'array':
                // TODO: validate against schema
                return getValue([]);
            case 'boolean':
                return getValue(false);
            case 'integer':
            case 'number':
                return getValue(0);
            case 'object':
                let parsedData: any = {};
                if (schema.properties) {
                    Object.keys(schema.properties).forEach(item => {
                        parsedData[item] = this.generateDataFromSchema(
                            schema.properties![item],
                            data ? data[item] : undefined
                        );
                    });
                }
                if (schema.additionalProperties) {
                    parsedData = deepmerge(parsedData, data);
                }
                return parsedData;
            case 'string':
                return getValue('');
        }
    }

    protected dataHasBeenChanged(): boolean {
        return JSON.stringify(this.data) !== JSON.stringify(this.savedData);
    }

    protected setDirty(dirty: boolean): void {
        if (this.dirty !== dirty) {
            this.dirty = dirty;
            this.onDirtyChangedEmitter.fire();
        }
    }

    protected async load(): Promise<void> {
    }

    protected handleChanged(data: ItemData): void {
        this.data = data;
        this.setDirty(this.dataHasBeenChanged());
        this.setTitle();
        this.pushToHistory();
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

    protected render(): React.ReactNode {
        return <div className="jsonforms-container" tabIndex={0}>
            {this.loading
                ? <div className="loader"><div></div></div>
                : this.data
                    ? <JsonFormsStyleContext.Provider value={this.getStyles()}>
                        <JsonForms
                            data={this.data}
                            schema={this.schema}
                            uischema={this.uiSchema}
                            onChange={this.jsonformsOnChange}
                            cells={vanillaCells}
                            renderers={[
                                ...vanillaRenderers,
                                ...VES_RENDERERS
                            ]}
                            config={{
                                restrict: false,
                                trim: false,
                                showUnfocusedDescription: true,
                                hideRequiredAsterisk: false,
                                // TODO: refactor once there's a non-hacky way to inject custom data
                                fileUri: this.uri,
                                services: {
                                    commandService: this.commandService,
                                    fileService: this.fileService,
                                    fileDialogService: this.fileDialogService,
                                    localStorageService: this.localStorageService,
                                    messageService: this.messageService,
                                    vesCommonService: this.vesCommonService,
                                    vesRumblePackService: this.vesRumblePackService,
                                    workspaceService: this.workspaceService,
                                },
                                projectData: this.projectData
                            }}
                        />
                    </JsonFormsStyleContext.Provider>
                    : <div className='error'>
                        {nls.localize('vuengine/editors/errorCouldNotLoadItem', 'Error: could not load item.')}
                    </div>}
        </div>;
    }

    protected getStyles(): StyleContext {
        return {
            styles: [
                ...vanillaStyles,
                {
                    name: 'array.button',
                    classNames: ['theia-button']
                },
                {
                    name: 'array.table.button',
                    classNames: ['theia-button']
                },
                {
                    name: 'control.input',
                    classNames: ['theia-input']
                },
                {
                    name: 'control.select',
                    classNames: ['theia-select']
                },
                {
                    name: 'vertical.layout',
                    classNames: ['theia-vertical']
                }
            ]
        };
    }
}
