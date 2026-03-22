import { Emitter } from '@theia/core';
import { ApplicationShell, LocalStorageService, Widget, WidgetManager } from '@theia/core/lib/browser';
import { ContextKey, ContextKeyService } from '@theia/core/lib/browser/context-key-service';
import { FrontendApplicationState, FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { DEFAULT_VIEW_MODE, LAST_VIEW_MODE_LOCAL_STORAGE_KEY, VIEW_MODE_WIDGET_MAP, ViewMode } from './view-mode-types';

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

    protected viewModeContextKey: ContextKey<ViewMode>;

    protected readonly onDidChangeViewModeEmitter = new Emitter<ViewMode>();
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
                    const lastViewModeLocalStorage = await this.localStorageService.getData(LAST_VIEW_MODE_LOCAL_STORAGE_KEY) as ViewMode;
                    let lastViewMode = DEFAULT_VIEW_MODE;
                    if (Object.keys(ViewMode).includes(lastViewModeLocalStorage)) {
                        lastViewMode = lastViewModeLocalStorage;
                    }
                    this.setViewMode(lastViewMode);
                }
            }
        );
    }

    async setViewMode(viewMode: ViewMode): Promise<void> {
        if (viewMode !== this.getViewMode() && Object.keys(ViewMode).includes(viewMode)) {
            this.viewModeContextKey.set(viewMode);
            this.onDidChangeViewModeEmitter.fire(viewMode);
            await this.localStorageService.setData(LAST_VIEW_MODE_LOCAL_STORAGE_KEY, viewMode);
            this.updateVisibleWidgets(viewMode);
        }
    }

    getViewMode(): ViewMode {
        return this.viewModeContextKey.get() ?? DEFAULT_VIEW_MODE;
    }

    protected updateVisibleWidgets(viewMode: ViewMode): void {
        this.openForced(viewMode);
        this.updateMain(viewMode);
    }

    protected async openForced(viewMode: ViewMode): Promise<void> {
        // const leftWidgets = this.shell.getWidgets('left');
        // const rightWidgets = this.shell.getWidgets('right');

        // TODO: show unknown views/widgets (e.g. from extensions) on source code view mode

        const allowedWidgets = VIEW_MODE_WIDGET_MAP[viewMode].force.map(f => f.widgetId);
        await Promise.all(
            this.shell.widgets.map(async w => {
                if (!allowedWidgets.includes(w.id)) {
                    await this.shell.closeWidget(w.id);
                }
            })
        );

        await Promise.all(
            VIEW_MODE_WIDGET_MAP[viewMode].force.map(async f => {
                const widget = await this.widgetManager.getOrCreateWidget(f.widgetId);
                console.log('widget', widget);
                await this.shell.addWidget(widget, f.widgetOptions);
                if (f.reveal) {
                    await this.shell.revealWidget(widget.id);
                }
            })
        );
    }

    protected updateMain(viewMode: ViewMode): void {
        /*
        const mainWidgets = this.shell.getWidgets('main');

        mainWidgets.forEach(w => {
            VIEW_MODE_WIDGET_MAP[viewMode].forEach(allowedWidgetId => {
                let show = false;
                console.log('w.id', w.id);
                if (w.id.startsWith(allowedWidgetId)) {
                    show = true;
                }

                if (show) {
                    this.showWidget(w);
                } else {
                    this.hideWidget(w);
                }
            });
        });
        */
    }

    protected hideWidget(widget: Widget): void {
        widget.title.className += ' otherViewMode';
    }

    protected showWidget(widget: Widget): void {
        widget.title.className = widget.title.className.replace(/ otherViewMode/g, '');
    }
}
