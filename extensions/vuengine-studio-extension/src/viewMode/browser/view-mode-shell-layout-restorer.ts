import { ApplicationShell, ShellLayoutRestorer } from '@theia/core/lib/browser';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { ViewModeService } from './view-mode-service';
import { ViewMode } from './view-mode-types';
import { StopReason } from '@theia/core/lib/common/frontend-application-state';

@injectable()
export class ViewModeShellLayoutRestorer extends ShellLayoutRestorer {
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;
    @inject(ViewModeService)
    protected readonly viewModeService: ViewModeService;

    protected readonly storageKeySuffix = 'view-mode';

    @postConstruct()
    protected init(): void {
        this.bindEvents();
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

    protected async resetLayout(): Promise<void> {
        if (await this.windowService.isSafeToShutDown(StopReason.Reload)) {
            await Promise.all(
                Object.keys(ViewMode).map(async viewMode =>
                    this.storageService.setData(this.getViewModeStorageKey(viewMode as ViewMode), undefined)
                )
            );
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

    async restoreViewModeLayout(viewMode: ViewMode): Promise<boolean> {
        const storageKey = this.getViewModeStorageKey(viewMode);

        const serializedLayoutData = await this.storageService.getData<string>(storageKey);
        if (serializedLayoutData === undefined) {
            return false;
        }
        const layoutData = await this.inflate(serializedLayoutData);

        this.transformations.getContributions().forEach(transformation => transformation.transformLayoutOnRestore(layoutData));
        await this.shell.setLayoutData(layoutData);
        return true;
    }
}
