import { JsonFormsCore, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import { JsonFormsStyleContext, StyleContext, vanillaCells, vanillaRenderers, vanillaStyles } from '@jsonforms/vanilla-renderers';
import { CommandService, Emitter, Event, MessageService, QuickPickService, Reference, UNTITLED_SCHEME, URI, nls } from '@theia/core';
import {
    CommonCommands,
    ExtractableWidget,
    HoverService,
    LabelProvider,
    LocalStorageService,
    NavigatableWidget,
    OpenerService,
    PreferenceService,
    Saveable,
    SaveableSource
} from '@theia/core/lib/browser';
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { EditorPreferences } from '@theia/editor/lib/browser';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { MonacoEditorModel } from '@theia/monaco/lib/browser/monaco-editor-model';
import { MonacoTextModelService } from '@theia/monaco/lib/browser/monaco-text-model-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { deepmerge } from 'deepmerge-ts';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesImagesService } from '../../images/browser/ves-images-service';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { ProjectDataType } from '../../project/browser/ves-project-types';
import { VesRumblePackService } from '../../rumble-pack/browser/ves-rumble-pack-service';
import { VES_RENDERERS } from './renderers/ves-renderers';
import { EditorsContext } from './ves-editors-types';

export const VesEditorsWidgetOptions = Symbol('VesEditorsWidgetOptions');
export interface VesEditorsWidgetOptions {
    typeId: string
    uri: string
}

export interface ItemData {
    [id: string]: unknown
};

@injectable()
export class VesEditorsWidget extends ReactWidget implements NavigatableWidget, Saveable, SaveableSource, ExtractableWidget {
    @inject(ColorRegistry)
    private readonly colorRegistry: ColorRegistry;
    @inject(CommandService)
    protected readonly commandService: CommandService;
    @inject(EditorPreferences)
    protected readonly editorPreferences: EditorPreferences;
    @inject(FileDialogService)
    protected readonly fileDialogService: FileDialogService;
    @inject(FileService)
    protected readonly fileService: FileService;
    @inject(HoverService)
    protected readonly hoverService: HoverService;
    @inject(LabelProvider)
    protected readonly labelProvider: LabelProvider;
    @inject(MessageService)
    protected readonly messageService: MessageService;
    @inject(LocalStorageService)
    protected readonly localStorageService: LocalStorageService;
    @inject(MonacoTextModelService)
    protected readonly modelService: MonacoTextModelService;
    @inject(OpenerService)
    protected readonly openerService: OpenerService;
    @inject(QuickPickService)
    protected readonly quickPickService: QuickPickService;
    @inject(PreferenceService)
    protected readonly preferenceService: PreferenceService;
    @inject(VesCommonService)
    protected readonly vesCommonService: VesCommonService;
    @inject(VesEditorsWidgetOptions)
    protected readonly options: VesEditorsWidgetOptions;
    @inject(VesImagesService)
    protected readonly vesImagesService: VesImagesService;
    @inject(VesProjectService)
    protected readonly vesProjectService: VesProjectService;
    @inject(VesRumblePackService)
    private readonly vesRumblePackService: VesRumblePackService;
    @inject(WindowService)
    private readonly windowService: WindowService;
    @inject(WorkspaceService)
    private readonly workspaceService: WorkspaceService;

    protected data: ItemData | undefined;
    protected savedData: ItemData | undefined;

    protected schema: JsonSchema | undefined;
    protected uiSchema: UISchemaElement | undefined;
    private jsonformsOnChange: (state: Pick<JsonFormsCore, 'data' | 'errors'>) => void;

    public dirty = false;

    protected readonly onContentChangedEmitter = new Emitter<void>();
    readonly onContentChanged = this.onContentChangedEmitter.event;

    typeId: string;
    uri: URI;
    protected reference: Reference<MonacoEditorModel>;
    protected justSaved: boolean = false;
    protected isLoading: boolean = true;
    protected isGenerating: boolean = false;
    protected generatingProgress: number = -1;

    isExtractable: boolean = true;
    secondaryWindow: Window | undefined;

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

    protected setIsGenerating(isGenerating: boolean, progress: number = -1): void {
        this.isGenerating = isGenerating;
        this.generatingProgress = isGenerating && progress > -1 ? progress : -1;
        this.update();
    }

    protected setGeneratingProgress(current: number, total: number): void {
        const decimalPrecision = 10;
        const progress = Math.round(current * 100 / total * decimalPrecision) / decimalPrecision;
        this.generatingProgress = progress;
        this.update();
    }

    @postConstruct()
    protected init(): void {
        this.uri = new URI(this.options.uri);
        this.typeId = this.options.typeId;

        this.isLoading = true;
        this.doInit();

        this.bindEvents();

        const label = this.labelProvider.getLongName(this.uri);

        const path = (this.uri.scheme === UNTITLED_SCHEME)
            ? `untitled-${this.options.typeId}-${this.vesCommonService.nanoid()}`
            : this.uri.path;
        this.id = `vesEditorsWidget:${path}`;

        this.title.label = label;
        this.title.caption = label;
        this.title.iconClass = 'fa fa-cog';
        this.title.closable = true;

        this.setTitle();
    }

    protected bindEvents(): void {
        this.onChange(d => {
            this.handleChanged(d);
        });

        this.toDispose.push(this.changeEmitter);
        this.jsonformsOnChange = (state: Pick<JsonFormsCore, 'data' | 'errors'>) =>
            this.changeEmitter.fire(state.data);

        this.toDispose.pushAll([
            this.vesProjectService.onDidAddProjectItem(() => this.rerenderOnProjectDataUpdate()),
            this.vesProjectService.onDidDeleteProjectItem(() => this.rerenderOnProjectDataUpdate()),
            this.vesProjectService.onDidUpdateProjectItem(() => this.rerenderOnProjectDataUpdate()),
        ]);
    }

    getResourceUri(): URI | undefined {
        return this.uri;
    }

    createMoveToUri(resourceUri: URI): URI | undefined {
        return resourceUri;
    }

    protected rerenderOnProjectDataUpdate(): void {
        if (!this.justSaved) {
            this.update();
        }
    };

    protected async doInit(): Promise<void> {
        await this.vesProjectService.projectItemsReady;

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
                // delay to only set back after project file update events have been processed
                setTimeout(() => {
                    this.justSaved = false;
                }, 50);
            }
        });

        this.schema = type?.schema;
        this.uiSchema = type?.uiSchema;
        if (type?.icon) {
            this.title.iconClass = type.icon;
        }

        await this.loadData(type);

        this.isLoading = false;
        this.update();
    }

    protected async loadData(type: ProjectDataType): Promise<void> {
        let json = {};
        try {
            json = JSON.parse(this.reference?.object.getText() || '{}');
        } catch (error) {
            console.error('Malformed JSON, could not update editor.');
        }
        this.data = json as ItemData;
        await this.mergeOntoDefaults(type);
        this.setSavedData();
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
        if (this.isGenerating) {
            return;
        }

        // ...
    }

    redo(): void {
        if (this.isGenerating) {
            return;
        }

        // ...
    }

    async save(): Promise<void> {
        if (this.isGenerating) {
            return;
        }

        if (this.uri.scheme === UNTITLED_SCHEME) {
            await this.commandService.executeCommand(CommonCommands.SAVE_AS.id);
        } else if (this.dirty) {
            try {
                this.reference.object.textEditorModel.setValue(JSON.stringify(this.data, undefined, 4));
                this.reference.object.save();
                this.justSaved = true;
                this.setDirty(false);
                this.setSavedData();
            } catch (error) {
                console.error('Could not save');
            }
        }
    }

    protected setSavedData(): void {
        this.savedData = this.data;
    }

    protected async mergeOntoDefaults(type: ProjectDataType): Promise<void> {
        const needsId = type.file.startsWith('.');
        if (type.schema.properties && needsId) {
            type.schema.properties['_id'] = {
                type: 'string',
                default: ''
            };
        }
        const schema = await window.electronVesCore.dereferenceJsonSchema(type.schema);
        this.data = this.generateDataFromSchema({
            ...schema,
            type: 'object'
        }, this.data);

        if (this.data?.name === '') {
            this.data.name = this.uri.path.name;
        }

        if (!this.data?._id && needsId) {
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
    protected generateDataFromSchema(schema: any, data?: any): any {
        if (!schema) {
            return;
        }

        const getValue = (defaultValue: any) => (data !== undefined)
            ? data
            : (schema.default !== undefined)
                ? schema.default
                : defaultValue;

        switch (schema.type) {
            case 'array':
                const resultArray: any[] = [];
                if (data?.length > 0) {
                    data.map((dataValue: any) => {
                        resultArray.push(this.generateDataFromSchema(
                            schema.items,
                            dataValue
                        ));
                    });
                }
                if ((schema.minItems !== undefined) && resultArray.length < schema.minItems) {
                    [...Array(schema.minItems - resultArray.length)].map(x => {
                        resultArray.push(this.generateDataFromSchema(
                            schema.items,
                        ));
                    });
                }
                if ((schema.maxItems !== undefined) && resultArray.length > schema.maxItems) {
                    resultArray.splice(schema.maxItems - 1);
                }
                return resultArray;

            case 'boolean':
                return getValue(false);

            case 'integer':
            case 'number':
                let resultNumber = getValue(0);
                if (schema.minimum && resultNumber < schema.minimum) {
                    resultNumber = schema.minimum;
                }
                if (schema.maximum && resultNumber > schema.maximum) {
                    resultNumber = schema.maximum;
                }
                return getValue(0);

            case 'object':
                let resultObject: any = {};
                if (schema.properties) {
                    Object.keys(schema.properties).forEach(key => {
                        resultObject[key] = this.generateDataFromSchema(
                            schema.properties![key],
                            data ? data[key] : undefined
                        );
                    });
                }
                if (schema.additionalProperties) {
                    resultObject = deepmerge(resultObject, data);
                }
                return resultObject;

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
    }

    protected render(): React.ReactNode {
        return <div className="jsonforms-container" tabIndex={0}>
            <div className={`${this.isLoading || this.isGenerating ? 'generatingOverlay isGenerating' : 'generatingOverlay'}`}>
                <i className='codicon codicon-loading codicon-modifier-spin' />
                {this.generatingProgress > -1 &&
                    `${this.generatingProgress}%`
                }
            </div>
            {!this.isLoading && this.data &&
                <EditorsContext.Provider
                    value={{
                        fileUri: this.uri,
                        isGenerating: this.isGenerating,
                        setIsGenerating: this.setIsGenerating.bind(this),
                        setGeneratingProgress: this.setGeneratingProgress.bind(this),
                        services: {
                            colorRegistry: this.colorRegistry,
                            commandService: this.commandService,
                            fileService: this.fileService,
                            fileDialogService: this.fileDialogService,
                            hoverService: this.hoverService,
                            messageService: this.messageService,
                            localStorageService: this.localStorageService,
                            openerService: this.openerService,
                            quickPickService: this.quickPickService,
                            preferenceService: this.preferenceService,
                            vesCommonService: this.vesCommonService,
                            vesImagesService: this.vesImagesService,
                            vesProjectService: this.vesProjectService,
                            vesRumblePackService: this.vesRumblePackService,
                            windowService: this.windowService,
                            workspaceService: this.workspaceService,
                        },
                    }}
                >
                    <JsonFormsStyleContext.Provider value={this.getStyles()}>
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
                                hideRequiredAsterisk: true,
                            }}
                        />
                    </JsonFormsStyleContext.Provider>
                </EditorsContext.Provider>
            }
            {!this.isLoading && !this.data &&
                <div className='error'>
                    {nls.localize('vuengine/editors/errorCouldNotLoadItem', 'Error: could not load item.')}
                </div>
            }
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
