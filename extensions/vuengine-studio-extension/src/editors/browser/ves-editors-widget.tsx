import $RefParser, { JSONSchema } from '@apidevtools/json-schema-ref-parser';
import { JsonFormsCore, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import { JsonFormsStyleContext, StyleContext, vanillaCells, vanillaRenderers, vanillaStyles } from '@jsonforms/vanilla-renderers';
import { Message } from '@phosphor/messaging';
import { Emitter, Event, nls } from '@theia/core';
import { Saveable, SaveableSource } from '@theia/core/lib/browser';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { EditorPreferences } from '@theia/editor/lib/browser';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import sortJson from 'sort-json';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { ProjectFileItem, ProjectFileType } from '../../project/browser/ves-project-types';
import { VesRumblePackService } from '../../rumble-pack/browser/ves-rumble-pack-service';
import { VES_RENDERERS } from './renderers/ves-renderers';

export const VesEditorsWidgetOptions = Symbol('VesEditorsWidgetOptions');
export interface VesEditorsWidgetOptions {
    typeId: string;
    itemId?: string;
}

@injectable()
export class VesEditorsWidget extends ReactWidget implements Saveable, SaveableSource {
    @inject(EditorPreferences)
    protected readonly editorPreferences: EditorPreferences;
    @inject(FileDialogService)
    protected readonly fileDialogService: FileDialogService;
    @inject(FileService)
    protected readonly fileService: FileService;
    @inject(VesEditorsWidgetOptions)
    protected readonly options: VesEditorsWidgetOptions;
    @inject(VesProjectService)
    protected readonly vesProjectService: VesProjectService;
    @inject(VesRumblePackService)
    private readonly vesRumblePackService: VesRumblePackService;

    protected data: ProjectFileItem | undefined;
    protected savedData: string;
    protected schema: JsonSchema | undefined;
    protected uiSchema: UISchemaElement | undefined;
    private jsonformsOnChange: (state: Pick<JsonFormsCore, 'data' | 'errors'>) => void;

    public dirty = false;
    public autoSave: 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange' = 'off';
    protected autoSaveDelay: number;

    protected loading: boolean = true;

    protected readonly onDirtyChangedEmitter = new Emitter<void>();
    get onDirtyChanged(): Event<void> {
        return this.onDirtyChangedEmitter.event;
    }

    get saveable(): Saveable {
        return this;
    }

    protected changeEmitter = new Emitter<Readonly<ProjectFileItem>>();
    get onChange(): Event<Readonly<ProjectFileItem>> {
        return this.changeEmitter.event;
    }

    static readonly ID = 'vesEditorsWidget';
    static readonly LABEL = 'Editor';

    @postConstruct()
    protected async init(): Promise<void> {
        this.id = `vesEditorsWidget:${this.options.typeId}:${this.options.itemId}`;
        this.title.label = this.options.typeId;
        this.title.caption = this.options.typeId;
        this.title.iconClass = 'fa fa-cog';
        this.title.closable = true;

        this.update();

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

        await this.vesProjectService.ready;
        const type = this.vesProjectService.getProjectDataType(this.options.typeId);
        if (type) {
            this.schema = type?.schema;
            this.uiSchema = type?.uiSchema;
            if (type?.icon) {
                this.title.iconClass = type.icon;
            }
            this.data = (this.options.itemId)
                ? this.vesProjectService.getProjectDataItem(this.options.typeId, this.options.itemId)
                : {};
            if (this.data) {
                this.setSavedData();
                this.mergeOntoDefaults(type);
                this.setTitle();
            }
        }

        this.loading = false;
        this.update();
    }

    protected setTitle(): void {
        if (this.data?.name) {
            const name = this.data.name as string;
            this.title.label = `${this.options.typeId}: ${name}`;
            this.title.caption = `${this.options.typeId}: ${name}`;
        }
    }

    protected onActivateRequest(msg: Message): void {
        super.onActivateRequest(msg);
        this.node.focus();
    }

    async revert(options?: Saveable.RevertOptions): Promise<void> {
        console.log('REVERT');
    }

    createSnapshot(): Saveable.Snapshot {
        const state = JSON.stringify(this.data);
        return { value: state };
    }

    applySnapshot(snapshot: { value: string }): void {
        this.data = JSON.parse(snapshot.value);
    }

    undo(): void {
        console.log('UNDO');
    }

    redo(): void {
        console.log('REDO');
    }

    async save(): Promise<void> {
        if (this.dirty) {
            const success = await this.vesProjectService.setProjectDataItem(
                this.options.typeId,
                this.options.itemId ?? '',
                this.data ?? {}
            );
            if (success) {
                this.setDirty(false);
                this.setSavedData();
            } else {
                console.error('Could not save');
            }
        }
    }

    protected setSavedData(): void {
        this.savedData = JSON.stringify(this.data);
    }

    protected async mergeOntoDefaults(type: ProjectFileType): Promise<void> {
        const schema = await $RefParser.dereference(type.schema as JSONSchema);
        this.data = this.generateDataFromSchema({
            ...schema,
            type: 'object'
        }, this.data);

        this.data = sortJson(this.data ?? {}, {
            depth: 8,
            ignoreCase: true,
            reverse: false,
        });
    }

    /**
     * Generates JSON from schema, using either values present in data or schema default.
     * Will only contain properties that are present in the schema.
     * TODO: validate arrays in data against schema
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
                return getValue([]);
            case 'boolean':
                return getValue(false);
            case 'integer':
                return getValue(0);
            case 'object':
                const parsedData: any = {};
                if (schema.properties) {
                    Object.keys(schema.properties).forEach(item => {
                        parsedData[item] = this.generateDataFromSchema(
                            schema.properties![item],
                            data ? data[item] : undefined
                        );
                    });
                }
                return parsedData;
            case 'string':
                return getValue('');
        }
    }

    protected dataHasBeenChanged(): boolean {
        return JSON.stringify(this.data) !== this.savedData;
    }

    protected setDirty(dirty: boolean): void {
        if (this.dirty !== dirty) {
            this.dirty = dirty;
            this.onDirtyChangedEmitter.fire();
        }
    }

    protected async load(): Promise<void> {
    }

    protected handleChanged(data: ProjectFileItem): void {
        this.data = data;
        this.setDirty(this.dataHasBeenChanged());
        this.setTitle();
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
                                // TODO: refactor once there's a non-hacky way to inject services
                                services: {
                                    fileService: this.fileService,
                                    fileDialogService: this.fileDialogService,
                                    vesRumblePackService: this.vesRumblePackService,
                                }
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
