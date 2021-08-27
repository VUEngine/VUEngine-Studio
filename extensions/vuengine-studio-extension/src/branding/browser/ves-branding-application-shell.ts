import { isOSX, isWindows } from '@theia/core';
import { ApplicationShell, Panel } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class VesApplicationShell extends ApplicationShell {
    protected createTopPanel(): Panel {
        const topPanel = super.createTopPanel();
        // show the top panel
        topPanel.show();
        topPanel.addClass(`os-${this.getOs()}`);
        return topPanel;
    }

    protected setTopPanelVisibily(preference: string): void {
        // always show the top panel
        this.topPanel.show();
    }

    protected getOs(): string {
        return isWindows ? 'win' : isOSX ? 'osx' : 'linux';
    }
}
