import { ApplicationShell, FrontendApplication, ShellLayoutRestorer } from '@theia/core/lib/browser';
import { StopReason } from '@theia/core/lib/common/frontend-application-state';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { WorkspaceService } from '@theia/workspace/lib/browser';
import { VES_VERSION } from '../../core/browser/ves-common-types';
import { VesEditorsWidget } from '../../editors/browser/ves-editors-widget';
import { ViewModeService } from './view-mode-service';
import { ViewMode } from './view-mode-types';
import { VIEW_MODE_WIDGETS } from './view-mode-widgets';

@injectable()
export class ViewModeShellLayoutRestorer extends ShellLayoutRestorer {
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;
    @inject(ViewModeService)
    protected readonly viewModeService: ViewModeService;
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    protected storageKey = `layout-${VES_VERSION}`;
    protected readonly storageKeySuffix = 'view-mode';

    @postConstruct()
    protected init(): void {
        this.bindEvents();
        this.initializeViewModeLayout();
    }

    protected async initializeViewModeLayout(): Promise<void> {
        await this.viewModeService.ready;
        await this.restoreViewModeLayout(this.viewModeService.getViewMode());
        this.viewModeService.setLayoutChangeComplete(true);
    }

    protected bindEvents(): void {
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

        const numberAllowedLeft = layoutData.leftPanel?.items?.filter(
            widget => allowedWidgetsIds.includes(widget.widget?.id ?? '')
        ).length;
        const numberAllowedAndVisibleLeft = layoutData.leftPanel?.items?.filter(
            widget => allowedWidgetsIds.includes(widget.widget?.id ?? '') && widget.expanded
        ).length;
        const numberAllowedRight = layoutData.rightPanel?.items?.filter(
            widget => allowedWidgetsIds.includes(widget.widget?.id ?? '')
        ).length;
        const numberAllowedAndVisibleRight = layoutData.rightPanel?.items?.filter(
            widget => allowedWidgetsIds.includes(widget.widget?.id ?? '') && widget.expanded
        ).length;

        if (numberAllowedLeft === 0) {
            this.shell.leftPanelHandler.container.hide();
        } else {
            this.shell.leftPanelHandler.container.show();
            if (numberAllowedAndVisibleLeft === 0) {
                await this.shell.leftPanelHandler.collapse();
            }
        }

        if (numberAllowedRight === 0) {
            this.shell.rightPanelHandler.container.hide();
        } else {
            this.shell.rightPanelHandler.container.show();
            if (numberAllowedAndVisibleRight === 0) {
                await this.shell.rightPanelHandler.collapse();
            }
        }
    }

    async forceMainWidgets(viewMode: ViewMode): Promise<void> {
        const forcedWidgets = VIEW_MODE_WIDGETS[viewMode].force ?? {};
        const forcedWidgetsIds = Object.keys(forcedWidgets);

        forcedWidgetsIds.forEach(async f => {
            let options = {};
            if (f.startsWith(VesEditorsWidget.ID)) {
                await this.workspaceService.ready;
                const roots = this.workspaceService.tryGetRoots();
                const workspaceRootUri = roots[0].resource;
                const typeId = f.split(':')[1];
                const uri = workspaceRootUri.resolve('config').resolve(typeId);
                f = VesEditorsWidget.ID;
                options = {
                    typeId,
                    uri: uri.withoutFragment().toString(),
                    kind: 'navigatable',
                };
            }

            const widget = await this.widgetManager.getOrCreateWidget(f, options);
            await this.shell.addWidget(widget, { area: 'main' });
        });
    }
}
