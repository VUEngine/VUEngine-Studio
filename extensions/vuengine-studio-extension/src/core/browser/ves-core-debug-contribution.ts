import { injectable } from '@theia/core/shared/inversify';
import { DebugFrontendApplicationContribution } from '@theia/debug/lib/browser/debug-frontend-application-contribution';

@injectable()
export class VesDebugFrontendApplicationContribution extends DebugFrontendApplicationContribution {
    // remove all debug features
    async initializeLayout(): Promise<void> { }
    async onStart(): Promise<void> { }
    registerMenus(): void { }
    registerCommands(): void { }
    registerKeybindings(): void { }
    registerToolbarItems(): void { }
    registerColors(): void { }
}
