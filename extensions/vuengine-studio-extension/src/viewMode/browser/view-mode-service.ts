import { CommandService, Emitter } from '@theia/core';
import { LocalStorageService, Widget, WidgetManager } from '@theia/core/lib/browser';
import { ContextKey, ContextKeyService } from '@theia/core/lib/browser/context-key-service';
import { FrontendApplicationState, FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { ViewMode } from './view-mode-types';
import { COMMAND_ID_TO_VIEW_MODE, DEFAULT_VIEW_MODE, LAST_VIEW_MODE_LOCAL_STORAGE_KEY, VIEW_MODE_WIDGETS, ViewModeWidgets } from './view-mode-widgets';

interface ViewModeChange {
    newViewMode: ViewMode
    oldViewMode: ViewMode
}

export const VIEW_MODE_CONTEXT_KEY = 'viewMode';

@injectable()
export class ViewModeService {
    @inject(CommandService)
    protected readonly commandService: CommandService;
    @inject(ContextKeyService)
    protected readonly contextKeyService: ContextKeyService;
    @inject(FrontendApplicationStateService)
    protected readonly frontendApplicationStateService: FrontendApplicationStateService;
    @inject(LocalStorageService)
    protected readonly localStorageService: LocalStorageService;
    @inject(WidgetManager)
    protected readonly widgetManager: WidgetManager;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    protected viewModeContextKey: ContextKey<ViewMode>;
    protected layoutChangeComplete: boolean = false;

    protected _ready = new Deferred<void>();
    get ready(): Promise<void> {
        return this._ready.promise;
    }

    protected readonly onDidChangeViewModeEmitter = new Emitter<ViewModeChange>();
    readonly onDidChangeViewMode = this.onDidChangeViewModeEmitter.event;

    @postConstruct()
    protected init(): void {
        this.bindEvents();
        this.viewModeContextKey = this.contextKeyService.createKey(
            VIEW_MODE_CONTEXT_KEY,
            ViewMode.sourceCode
        );
    }

    protected bindEvents(): void {
        this.frontendApplicationStateService.onStateChanged(
            async (state: FrontendApplicationState) => {
                if (state === 'initialized_layout') {
                    let lastViewMode = ViewMode.welcome;
                    if (this.workspaceService.opened) {
                        const lastViewModeLocalStorage = await this.localStorageService.getData(LAST_VIEW_MODE_LOCAL_STORAGE_KEY) as ViewMode;
                        lastViewMode = DEFAULT_VIEW_MODE;
                        if (Object.keys(ViewMode).includes(lastViewModeLocalStorage)) {
                            lastViewMode = lastViewModeLocalStorage;
                        }
                    }
                    this.setViewMode(lastViewMode, true);
                    this._ready.resolve();
                }
            }
        );
        this.commandService.onWillExecuteCommand(async e => {
            if (!this.workspaceService.opened) {
                return;
            }

            const targetView = COMMAND_ID_TO_VIEW_MODE[e.commandId];
            if (targetView) {
                await this.setViewMode(targetView);
            }
        });
    }

    setLayoutChangeComplete(layoutChangeComplete: boolean): void {
        this.layoutChangeComplete = layoutChangeComplete;
    }

    async resetViewMode(): Promise<void> {
        return this.localStorageService.setData(LAST_VIEW_MODE_LOCAL_STORAGE_KEY, undefined);
    }

    async setViewMode(newViewMode: ViewMode, omitEvent?: boolean): Promise<void> {
        const oldViewMode = this.getViewMode();
        if (newViewMode !== oldViewMode && Object.keys(ViewMode).includes(newViewMode)) {
            this.viewModeContextKey.set(newViewMode);
            await this.localStorageService.setData(LAST_VIEW_MODE_LOCAL_STORAGE_KEY, newViewMode);
            this.setLayoutChangeComplete(false);
            if (!omitEvent) {
                this.onDidChangeViewModeEmitter.fire({ newViewMode, oldViewMode });
            }

            return new Promise<void>((resolve, reject) => {
                const waitForLayoutChange = setInterval(() => {
                    if (this.layoutChangeComplete) {
                        clearInterval(waitForLayoutChange);
                        resolve();
                    }
                }, 100);
            });
        }
    }

    getViewMode(): ViewMode {
        return this.workspaceService.opened
            ? this.viewModeContextKey.get() ?? DEFAULT_VIEW_MODE
            : ViewMode.welcome;
    }

    hideWidget(widget: Widget): void {
        widget.title.className += ' otherViewMode';
    }

    showWidget(widget: Widget): void {
        widget.title.className = widget.title.className.replace(/ otherViewMode/g, '');
    }

    /*
     * Get list of allowed widgets and whether it's an allow or a disallow list.
     * The source code view mode functions as a fallback that follows an inverted logic than other view modes.
     * Instead of filtering through an allow list, this mode _disallows_ the widgets of all others view modes
     * and thus holds all "other" widgets, including unknown ones, e.g. from extensions.
     */
    getWidgets(viewMode: ViewMode): { allowList: boolean, widgets: ViewModeWidgets } {
        let allowList = true;
        let widgets: ViewModeWidgets = {};

        if (viewMode === ViewMode.sourceCode) {
            allowList = false;
            Object.values(ViewMode)
                .filter(v => v !== ViewMode.sourceCode)
                .forEach(v => {
                    widgets = {
                        ...widgets,
                        ...(VIEW_MODE_WIDGETS[v].allow ?? {}),
                        ...(VIEW_MODE_WIDGETS[v].force ?? {}),
                    };
                });
        } else {
            widgets = VIEW_MODE_WIDGETS[viewMode].allow ?? {};
        }

        return { allowList, widgets };
    }
}
