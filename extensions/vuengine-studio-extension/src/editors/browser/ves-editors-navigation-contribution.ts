import { ApplicationShell, FrontendApplicationContribution } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { EditorManager } from '@theia/editor/lib/browser';
import { NavigationLocation } from '@theia/editor/lib/browser/navigation/navigation-location';
import { NavigationLocationService } from '@theia/editor/lib/browser/navigation/navigation-location-service';
import { VesEditorsWidget } from './ves-editors-widget';

@injectable()
export class VesEditorsNavigationContribution implements FrontendApplicationContribution {
    @inject(ApplicationShell)
    protected readonly shell: ApplicationShell;
    @inject(EditorManager)
    protected readonly editorManager: EditorManager;
    @inject(NavigationLocationService)
    protected readonly locationService: NavigationLocationService;

    onStart(): void {
        this.shell.onDidAddWidget(widget => {
            if (widget instanceof VesEditorsWidget) {
                this.locationService.removeClosedEditor(widget.uri);
            }
        });

        this.shell.onDidRemoveWidget(widget => {
            if (widget instanceof VesEditorsWidget) {
                this.locationService.addClosedEditor({
                    uri: widget.uri,
                    viewState: {}
                });
            }
        });

        this.shell.onDidChangeActiveWidget(widget => {
            if (widget instanceof VesEditorsWidget) {
                this.locationService.navigate(service =>
                    service.register(NavigationLocation.create(widget.uri, { line: 0, character: 0 }))
                );
            }
        });
    }
}
