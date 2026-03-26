import { Emitter } from '@theia/core';
import { ApplicationShell, LocalStorageService, Widget, WidgetManager } from '@theia/core/lib/browser';
import { ContextKey, ContextKeyService } from '@theia/core/lib/browser/context-key-service';
import { FrontendApplicationState, FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { Deferred } from '@theia/core/lib/common/promise-util';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { DEFAULT_VIEW_MODE, LAST_VIEW_MODE_LOCAL_STORAGE_KEY, ViewMode } from './view-mode-types';

interface ViewModeChange {
    newViewMode: ViewMode
    oldViewMode: ViewMode
}

export const VIEW_MODE_CONTEXT_KEY = 'viewMode';

@injectable()
export class ViewModeService {
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;
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

    protected hideWidget(widget: Widget): void {
        widget.title.className += ' otherViewMode';
    }

    protected showWidget(widget: Widget): void {
        widget.title.className = widget.title.className.replace(/ otherViewMode/g, '');
    }
}
