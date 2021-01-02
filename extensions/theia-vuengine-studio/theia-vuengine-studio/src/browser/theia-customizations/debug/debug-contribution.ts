import { injectable } from 'inversify';
import { DebugFrontendApplicationContribution } from '@theia/debug/lib/browser/debug-frontend-application-contribution';

@injectable()
export class VesTheiaCustomizationDebugContribution extends DebugFrontendApplicationContribution {
    async initializeLayout(): Promise<void> { }
    async onStart(): Promise<void> { }
    registerMenus(): void { }
    registerCommands(): void { }
    registerKeybindings(): void { }
    registerToolbarItems(): void { }
    registerColors(): void { }
}
