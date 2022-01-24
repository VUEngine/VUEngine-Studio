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
        } else {
            label = 'No Flash Carts';
            className = 'disabled';
        }
        this.statusBar.setElement('ves-flash-carts', {
            alignment: StatusBarAlignment.LEFT,
            command: VesFlashCartCommands.OPEN_WIDGET.id,
            className: className,
            priority: 1,
            text: `$(codicon-browser codicon-flip-y) ${label}`,
            tooltip: 'Connected Flash Carts'
        });
    }
}
