import { injectable } from 'inversify';
import { DebugFrontendApplicationContribution } from '@theia/debug/lib/browser/debug-frontend-application-contribution';

@injectable()
export class VesDebugContribution extends DebugFrontendApplicationContribution {
    // remove all debug features
    async initializeLayout(): Promise<void> { }
    async onStart(): Promise<void> { }
    registerMenus(): void { }
    registerCommands(): void { }
    registerKeybindings(): void { }
    registerToolbarItems(): void { }
    registerColors(): void { }
}