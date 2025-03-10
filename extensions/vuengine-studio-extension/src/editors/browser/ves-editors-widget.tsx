import { JsonFormsCore, JsonSchema, UISchemaElement } from '@jsonforms/core';
import { JsonForms } from '@jsonforms/react';
import { JsonFormsStyleContext, StyleContext, vanillaCells, vanillaRenderers, vanillaStyles } from '@jsonforms/vanilla-renderers';
import { CommandService, Emitter, Event, MessageService, nls, QuickPickService, Reference, UNTITLED_SCHEME, URI } from '@theia/core';
import {
    CommonCommands,
    ExtractableWidget,
    FrontendApplication,
    HoverService,
    LabelProvider,
    LocalStorageService,
    lock,
    NavigatableWidget,
    OpenerService,
    PreferenceService,
    Saveable,
    SaveableSource,
    StatusBar,
    StatusBarEntry
} from '@theia/core/lib/browser';
import { ColorRegistry } from '@theia/core/lib/browser/color-registry';
import { ThemeService } from '@theia/core/lib/browser/theming';
import { ReactWidget } from '@theia/core/lib/browser/widgets/react-widget';
import { WindowService } from '@theia/core/lib/browser/window/window-service';
import { Message } from '@theia/core/shared/@phosphor/messaging';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import { EditorPreferences } from '@theia/editor/lib/browser';
import { UndoRedoService } from '@theia/editor/lib/browser/undo-redo-service';
import { FileDialogService } from '@theia/filesystem/lib/browser';
import { FileService } from '@theia/filesystem/lib/browser/file-service';
import { MonacoEditorModel } from '@theia/monaco/lib/browser/monaco-editor-model';
import { MonacoTextModelService } from '@theia/monaco/lib/browser/monaco-text-model-service';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VesBuildService } from '../../build/browser/ves-build-service';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VesImagesService } from '../../images/browser/ves-images-service';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { ProjectDataType, WithContributor } from '../../project/browser/ves-project-types';
import { VesRumblePackService } from '../../rumble-pack/browser/ves-rumble-pack-service';
import { nanoid } from './components/Common/Utils';
import { VES_RENDERERS } from './renderers/ves-renderers';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext } from './ves-editors-types';

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
    @inject(FrontendApplication)
    protected readonly app: FrontendApplication;
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
    @inject(StatusBar)
    protected readonly statusBar: StatusBar;
    @inject(ThemeService)
    protected readonly themeService: ThemeService;
    @inject(UndoRedoService)
    protected readonly undoRedoService: UndoRedoService;
    @inject(VesBuildService)
    protected readonly vesBuildService: VesBuildService;
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

    static readonly ID = 'vesEditorsWidget';
    static readonly LABEL = 'Editor';

    typeId: string;
    uri: URI;
    commands: { [commandId: string]: boolean } = {};

    protected schema: JsonSchema | undefined;
    protected uiSchema: UISchemaElement | undefined;

    protected data: ItemData | undefined;

    protected saveCallback: () => void | undefined;

    private onEditorContentHasChanged: (state: Pick<JsonFormsCore, 'data' | 'errors'>) => void;

    protected readonly onContentChangedEmitter = new Emitter<void>();
    readonly onContentChanged = this.onContentChangedEmitter.event;

    protected reference: Reference<MonacoEditorModel>;

    protected justRequestedUpdate: boolean;
    protected justUpdatedModel: boolean;
    protected isReadOnly = false;
    protected isLoading: boolean;
    protected isGenerating: boolean;
    protected generatingProgress: number;

    protected statusBarItems: { [id: string]: StatusBarEntry } = {};

    isExtractable: boolean = true;
    secondaryWindow: Window | undefined;

    protected readonly onDirtyChangedEmitter = new Emitter<void>();
    get onDirtyChanged(): Event<void> {
        return this.onDirtyChangedEmitter.event;
    }

    get dirty(): boolean {
        return this.isReadOnly
            ? false
            : this.reference?.object.dirty;
    }

    get saveable(): Saveable {
        return this;
    }

    @postConstruct()
    protected init(): void {
        this.doInit();
        this.bindEvents();

        this.initMembers();

        const path = (this.uri.scheme === UNTITLED_SCHEME)
            ? `untitled-${this.options.typeId}-${nanoid()}`
            : this.uri.path;
        this.id = `vesEditorsWidget:${path}`;

        this.title.iconClass = 'fa fa-cog';
        this.title.closable = true;

        this.setTitle();

        // render initial loading spinner
        this.update();
    }

    protected async doInit(): Promise<void> {
        this.uri = new URI(this.options.uri);
        this.typeId = this.options.typeId;

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
        this.reference?.object.onContentChanged(() => this.handleModelChange(type));
        this.reference?.object.onDirtyChanged(() => this.onDirtyChangedEmitter.fire());

        this.schema = type?.schema;
        this.uiSchema = type?.uiSchema;
        if (type?.icon) {
            this.title.iconClass = type.icon;
        }

        if (this.uri.scheme !== UNTITLED_SCHEME) {
            if (await this.fileService.exists(this.uri)) {
                const fileStats = await this.fileService.resolve(this.uri);
                this.isReadOnly = fileStats.isReadonly;
                if (this.isReadOnly) {
                    lock(this.title);
                }
            } else {
                console.error('File does not exists', this.uri.path.fsPath());
                this.isLoading = false;
                this.update();
                return;
            }
        }

        await this.loadData(type);

        this.update();
        this.isLoading = false;
    }

    protected initMembers(): void {
        this.justRequestedUpdate = false;
        this.justUpdatedModel = false;
        this.isLoading = true;
        this.isGenerating = false;
        this.generatingProgress = -1;
    }

    protected setSaveCallback(callback: () => void): void {
        this.saveCallback = callback;
    }

    protected setTitle(): void {
        // const name = this.labelProvider.getLongName(this.uri);
        const name = this.uri.path.name;
        this.title.label = name;
        this.title.caption = this.uri.path.fsPath();
    }

    protected onActivateRequest(msg: Message): void {
        this.node.tabIndex = 0;
        this.node.focus();
    }

    protected setStatusBarItem(id: string, entry: StatusBarEntry): void {
        this.statusBarItems[id] = entry;
        this.statusBar.setElement(id, entry);
    }

    protected removeStatusBarItem(id: string): void {
        delete (this.statusBarItems[id]);
        this.statusBar.removeElement(id);
    }

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

    dispatchCommandEvent(commandId: string): void {
        const resetInputsEvent = new CustomEvent(EDITORS_COMMAND_EXECUTED_EVENT_NAME, { detail: commandId });
        // console.info(`Emitting event: EDITORS_COMMAND_EXECUTED_EVENT_NAME ${commandId}`);
        document.dispatchEvent(resetInputsEvent);
    }

    protected bindEvents(): void {
        this.onEditorContentHasChanged = (state: Pick<JsonFormsCore, 'data' | 'errors'>) => this.handleEditorChange(state.data);

        this.toDispose.pushAll([
            this.vesProjectService.onDidAddProjectItem(() => this.update()),
            this.vesProjectService.onDidDeleteProjectItem(() => this.update()),
            this.vesProjectService.onDidUpdateProjectItem(() => this.update()),
        ]);
    }

    getResourceUri(): URI | undefined {
        return this.uri;
    }

    createMoveToUri(resourceUri: URI): URI | undefined {
        return this.uri;
    }

    close(): void {
        super.close();
    }

    update(): void {
        this.justRequestedUpdate = true;
        setTimeout(() => {
            this.justRequestedUpdate = false;
        }, 50);
        super.update();
    };

    protected onAfterAttach(msg: Message): void {
        this.setStatusBar();
    }

    protected onAfterDetach(msg: Message): void {
        this.resetStatusBar();
    }

    protected onAfterShow(msg: Message): void {
        this.setStatusBar();
    }

    protected onAfterHide(msg: Message): void {
        this.resetStatusBar();
    }

    protected setStatusBar(): void {
        this.app.shell.addClass('hide-text-editor-status-bar-items');
        Object.keys(this.statusBarItems).forEach(id => this.statusBar.setElement(id, this.statusBarItems[id]));
    }

    protected resetStatusBar(): void {
        this.app.shell.removeClass('hide-text-editor-status-bar-items');
        Object.keys(this.statusBarItems).forEach(id => this.statusBar.removeElement(id));
    }

    protected async loadData(type: ProjectDataType): Promise<void> {
        let json = {};
        try {
            json = JSON.parse(this.reference?.object.getText() || '{}');
        } catch (error) {
            console.error('Malformed JSON, could not update editor.');
        }
        this.data = json as ItemData;
        this.data = await this.vesProjectService.getSchemaDefaults(type, this.data);
    }

    async revert(options?: Saveable.RevertOptions): Promise<void> {
        this.reference?.object.revert();
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

        this.undoRedoService.undo(this.uri);
        this.update();
        this.updateModel();
    }

    redo(): void {
        if (this.isGenerating) {
            return;
        }

        this.undoRedoService.redo(this.uri);
        this.update();
        this.updateModel();
    }

    async save(): Promise<void> {
        if (this.isGenerating) {
            return;
        }

        if (this.uri.scheme === UNTITLED_SCHEME) {
            await this.commandService.executeCommand(CommonCommands.SAVE_AS.id);
        } else {
            try {
                this.reference?.object.save();
            } catch (error) {
                console.error('Could not save');
            }
        }

        if (this.saveCallback) {
            this.saveCallback();
        }
    }

    protected async load(): Promise<void> {
    }

    protected handleEditorChange(newData: ItemData): void {
        if (this.justRequestedUpdate) {
            this.justRequestedUpdate = false;
            return;
        }

        const oldData = this.data;

        if (JSON.stringify(oldData) === JSON.stringify(newData)) {
            return;
        }

        this.data = newData;
        this.pushUndoRedo({ ...oldData }, { ...newData });

        this.updateModel();
    }

    protected pushUndoRedo(oldData: ItemData, newData: ItemData): void {
        this.undoRedoService.pushElement(this.uri,
            // undo
            async () => {
                this.data = { ...oldData };
            },
            // redo
            async () => {
                this.data = { ...newData };
            },
        );
    }

    protected async handleModelChange(type: ProjectDataType & WithContributor): Promise<void> {
        if (this.justUpdatedModel) {
            this.justUpdatedModel = false;
            return;
        }

        await this.loadData(type);
        this.update();

    }

    protected updateModel(): void {
        this.justUpdatedModel = true;
        this.reference?.object.textEditorModel.pushStackElement();
        this.reference?.object.textEditorModel.setValue(JSON.stringify(this.data, undefined, 4));
    }

    protected enableCommands(commandIds: string[]): void {
        commandIds.map(commandId => this.commands[commandId] = true);
    }

    protected disableCommands(commandIds: string[]): void {
        commandIds.map(commandId => this.commands[commandId] = false);
    }

    protected render(): React.ReactNode {
        return <div className="jsonforms-container">
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
                        isReadonly: this.isReadOnly,
                        setSaveCallback: this.setSaveCallback.bind(this),
                        setIsGenerating: this.setIsGenerating.bind(this),
                        setGeneratingProgress: this.setGeneratingProgress.bind(this),
                        enableCommands: this.enableCommands.bind(this),
                        disableCommands: this.disableCommands.bind(this),
                        setStatusBarItem: this.setStatusBarItem.bind(this),
                        removeStatusBarItem: this.removeStatusBarItem.bind(this),
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
                            themeService: this.themeService,
                            vesBuildService: this.vesBuildService,
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
                            onChange={this.onEditorContentHasChanged}
                            cells={vanillaCells}
                            readonly={this.isReadOnly}
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
                    {nls.localize('vuengine/editors/general/errorCouldNotLoadItem', 'Error: could not load item.')}
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
