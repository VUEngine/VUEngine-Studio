import { inject, injectable } from '@theia/core/shared/inversify';
import { FrontendApplication, FrontendApplicationContribution, StatusBar, StatusBarAlignment } from '@theia/core/lib/browser';
import { VesFlashCartCommands } from './ves-flash-cart-commands';
import { VesFlashCartService } from './ves-flash-cart-service';

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
        let className = '';
        if (this.vesFlashCartService.connectedFlashCarts.length > 0) {
            const connectedFlashCartsNames = [];
            for (const connectedFlashCart of this.vesFlashCartService.connectedFlashCarts) {
                connectedFlashCartsNames.push(connectedFlashCart.config.name);
            }
            label = connectedFlashCartsNames.join(', ');
        } else {
            label = 'No Flash Carts';
            className = 'disabled';
        }
        this.statusBar.setElement('ves-flash-carts', {
            alignment: StatusBarAlignment.LEFT,
            command: VesFlashCartCommands.OPEN_WIDGET.id,
            className: className,
            priority: 1,
            text: `$(microchip) ${label}`,
            tooltip: 'Connected Flash Carts'
        });
    }
}
