import { inject, injectable } from '@theia/core/shared/inversify';
import { FrontendApplication, FrontendApplicationContribution, StatusBar, StatusBarAlignment } from '@theia/core/lib/browser';
import { VesFlashCartCommands } from './ves-flash-cart-commands';
import { VesFlashCartService } from './ves-flash-cart-service';
import { nls } from '@theia/core';

@injectable()
export class VesFlashCartStatusBarContribution implements FrontendApplicationContribution {
    @inject(StatusBar)
    protected readonly statusBar: StatusBar;
    @inject(VesFlashCartService)
    protected readonly vesFlashCartService: VesFlashCartService;

    onStart(app: FrontendApplication): void {
        this.updateStatusBar();
    };

    updateStatusBar(): void {
        this.setConnectedFlashCartStatusBar();

        this.vesFlashCartService.onDidChangeIsFlashing(() => this.setConnectedFlashCartStatusBar());
        this.vesFlashCartService.onDidChangeConnectedFlashCarts(() => {
            this.setConnectedFlashCartStatusBar();
        });
    }

    setConnectedFlashCartStatusBar(): void {
        let label = '';
        const labelMaxLength = 16;
        if (this.vesFlashCartService.connectedFlashCarts.length > 0) {
            const connectedFlashCartsNames = [];
            for (const connectedFlashCart of this.vesFlashCartService.connectedFlashCarts) {
                connectedFlashCartsNames.push(connectedFlashCart.config.name);
            }
            label = connectedFlashCartsNames.join(', ');
            if (label.length > labelMaxLength) {
                label = `${label.substring(0, labelMaxLength)}...`;
                if (connectedFlashCartsNames.length > 1) {
                    label += ` (${connectedFlashCartsNames.length})`;
                }
            }
            this.statusBar.setElement('ves-flash-carts', {
                alignment: StatusBarAlignment.LEFT,
                command: VesFlashCartCommands.WIDGET_TOGGLE.id,
                priority: 1,
                text: `$(codicon-empty-window codicon-rotate-180) ${label}`,
                tooltip: nls.localize('vuengine/flashCarts/connectedFlashCarts', 'Connected Flash Carts')
            });
        } else {
            this.statusBar.removeElement('ves-flash-carts');
        }
    }
}
