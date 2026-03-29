import { BrowserMainMenuFactory, MenuBarWidget } from '@theia/core/lib/browser/menu/browser-menu-plugin';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class VesBrowserMainMenuFactory extends BrowserMainMenuFactory {
    protected fillMenuBar(menuBar: MenuBarWidget): void {
    }
}
