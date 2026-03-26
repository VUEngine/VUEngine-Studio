import { ApplicationShell, FrontendApplication, ShellLayoutRestorer } from '@theia/core/lib/browser';
import { FrontendApplicationStateService } from '@theia/core/lib/browser/frontend-application-state';
import { FrontendApplicationState, StopReason } from '@theia/core/lib/common/frontend-application-state';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { ViewModeService } from './view-mode-service';
import { VIEW_MODE_WIDGETS, ViewMode } from './view-mode-types';

@injectable()
export class ViewModeShellLayoutRestorer extends ShellLayoutRestorer {
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;
    @inject(FrontendApplicationStateService)
    protected readonly frontendApplicationStateService: FrontendApplicationStateService;
    @inject(ViewModeService)
    protected readonly viewModeService: ViewModeService;

    protected readonly storageKeySuffix = 'view-mode';

    @postConstruct()
    protected init(): void {
        this.bindEvents();
    }

    protected bindEvents(): void {
        this.frontendApplicationStateService.onStateChanged(
            async (state: FrontendApplicationState) => {
                if (state === 'initialized_layout') {
                    await this.restoreViewModeLayout(this.viewModeService.getViewMode());
                }
            }
        );
        this.viewModeService.onDidChangeViewMode(async viewModeChange => {
            this.storeViewModeLayout(viewModeChange.oldViewMode);
            await this.restoreViewModeLayout(viewModeChange.newViewMode);
            this.viewModeService.setLayoutChangeComplete(true);
        });
    }

    protected getViewModeStorageKey(viewMode: ViewMode): string {
        return `${this.storageKey}-${this.storageKeySuffix}-${viewMode}`;
    }

    storeLayout(app: FrontendApplication): void {
        if (this.shouldStoreLayout) {
            const viewMode = this.viewModeService.getViewMode();
            this.storeViewModeLayout(viewMode);
        }

        super.storeLayout(app);
    }

    protected async resetLayout(): Promise<void> {
        if (await this.windowService.isSafeToShutDown(StopReason.Reload)) {
            await Promise.all(
                Object.keys(ViewMode).map(async viewMode =>
                    this.storageService.setData(this.getViewModeStorageKey(viewMode as ViewMode), undefined)
                )
            );

            await this.viewModeService.resetViewMode();
        }

        return super.resetLayout();
    }

    storeViewModeLayout(viewMode: ViewMode): void {
        const storageKey = this.getViewModeStorageKey(viewMode);

        if (this.shouldStoreLayout) {
            try {
                const layoutData = this.shell.getLayoutData();
                const serializedLayoutData = this.deflate(layoutData);
                this.storageService.setData(storageKey, serializedLayoutData);
            } catch (error) {
                this.storageService.setData(storageKey, undefined);
                this.logger.error('Error during serialization of view mode layout data', error);
            }
        }
    }

    async restoreViewModeLayout(viewMode: ViewMode): Promise<void> {
        let layoutData = this.shell.getLayoutData();

        const storageKey = this.getViewModeStorageKey(viewMode);
        const serializedLayoutData = await this.storageService.getData<string>(storageKey);
        if (serializedLayoutData !== undefined) {
            layoutData = await this.inflate(serializedLayoutData);
        }

        this.transformations.getContributions().forEach(transformation => transformation.transformLayoutOnRestore(layoutData));
        await this.shell.setLayoutData(layoutData);

        await this.collapseSidePanelsIfEmpty(viewMode, layoutData);
        await this.forceMainWidgets(viewMode);

        if (serializedLayoutData === undefined) {
            await this.setInitialRevealed(viewMode);
        }
    }

    async setInitialRevealed(viewMode: ViewMode): Promise<void> {
        const allowedWidgets = VIEW_MODE_WIDGETS[viewMode].allow ?? {};
        Object.entries(allowedWidgets).forEach(async ([widgetId, revealInitially]) => {
            if (revealInitially) {
                await this.shell.revealWidget(widgetId);
            }
        });
    }

    async collapseSidePanelsIfEmpty(viewMode: ViewMode, layoutData: ApplicationShell.LayoutData): Promise<void> {
        const allowedWidgets = VIEW_MODE_WIDGETS[viewMode].allow ?? {};
        const allowedWidgetsIds = Object.keys(allowedWidgets);

        if (!layoutData.leftPanel?.items?.filter(widget =>
            allowedWidgetsIds.includes(widget.widget?.id ?? '') && widget.expanded
        ).length) {
            await this.shell.leftPanelHandler.collapse();
        }
        if (!layoutData.rightPanel?.items?.filter(widget =>
            allowedWidgetsIds.includes(widget.widget?.id ?? '') && widget.expanded
        ).length) {
            await this.shell.rightPanelHandler.collapse();
        }
    }

    async forceMainWidgets(viewMode: ViewMode): Promise<void> {
        const forcedWidgets = VIEW_MODE_WIDGETS[viewMode].force ?? {};
        const forcedWidgetsIds = Object.keys(forcedWidgets);

        await Promise.all(
            forcedWidgetsIds.map(async f => {
                const widget = await this.widgetManager.getOrCreateWidget(f);
                await this.shell.addWidget(widget, { area: 'main' });
            })
        );
    }
}
