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
import { deepmergeCustom } from 'deepmerge-ts';
import jsf, { Schema } from 'json-schema-faker';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { ProjectFileItem, ProjectFileType } from '../../project/browser/ves-project-types';
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

    protected data: ProjectFileItem | undefined;
    protected savedData: string;
    protected schema: JsonSchema | undefined;
    protected uiSchema: UISchemaElement | undefined;
    private jsonformsOnChange: (state: Pick<JsonFormsCore, 'data' | 'errors'>) => void;

    public dirty = false;
    public autoSave: 'off' | 'afterDelay' | 'onFocusChange' | 'onWindowChange' = 'off';
    protected autoSaveDelay: number;

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

        this.renderEmptyForm();

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
            this.setSavedData();
            this.mergeOntoDefaults(type);
            this.setTitle();
            this.update();
        } else {
            // TODO
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

        this.onChange(d => {
            this.handleChanged(d);
        });
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

    protected mergeOntoDefaults(type: ProjectFileType): void {
        // eslint-disable-next-line deprecation/deprecation
        jsf.option({
            alwaysFakeOptionals: true,
            useDefaultValue: true
        });
        const template = {
            // eslint-disable-next-line deprecation/deprecation
            ...(jsf.generate(type?.schema as Schema) ?? {}) as ProjectFileItem,
            name: nls.localize('vuengine/editors/new', 'New')
        };
        const customDeepmerge = deepmergeCustom({ mergeArrays: false });
        this.data = customDeepmerge(template, this.data);
        this.data = this.sortObject(this.data ?? {});
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected sortObject(object: { [key: string]: any }): ProjectFileItem {
        if (!object) {
            return object;
        }

        const isArray = object instanceof Array;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let sortedObj: { [key: string]: any } = {};
        if (isArray) {
            sortedObj = object.map(item => this.sortObject(item));
        } else {
            const keys = Object.keys(object);
            keys.sort((key1, key2) => {
                key1 = key1.toLowerCase();
                key2 = key2.toLowerCase();
                if (key1 < key2) { return -1; };
                if (key1 > key2) { return 1; };
                return 0;
            });

            keys.forEach(key => {
                if (typeof object[key] == 'object') {
                    sortedObj[key] = this.sortObject(object[key]);
                } else {
                    sortedObj[key] = object[key];
                }
            });
        }

        return sortedObj;
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
                        hideRequiredAsterisk: false,
                        // TODO: refactor once there's a non-hacky way to inject services
                        services: {
                            fileService: this.fileService,
                            fileDialogService: this.fileDialogService
                        }
                    }}
                />
            </JsonFormsStyleContext.Provider>
        </div>;
    }

    protected renderEmptyForm(): React.ReactNode {
        return <div className="jsonforms-container">
            ¯\_(ツ)_/¯
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
