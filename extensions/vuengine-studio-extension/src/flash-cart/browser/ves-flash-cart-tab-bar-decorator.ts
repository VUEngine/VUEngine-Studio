import { injectable, inject, postConstruct } from '@theia/core/shared/inversify';
import { Emitter } from '@theia/core/lib/common/event';
import { TabBarDecorator } from '@theia/core/lib/browser/shell/tab-bar-decorator';
import { Title, Widget } from '@theia/core/lib/browser';
import { WidgetDecoration } from '@theia/core/lib/browser/widget-decoration';
import { VesFlashCartService } from './ves-flash-cart-service';
import { VesFlashCartWidget } from './ves-flash-cart-widget';
import { DisposableCollection } from '@theia/core';

@injectable()
export class VesFlashCartTabBarDecorator implements TabBarDecorator {
    @inject(VesFlashCartService)
    protected readonly flashCartService: VesFlashCartService;

    readonly id = 'ves-flash-cart-tabbar-decorator';
    protected toDispose = new DisposableCollection();

    protected readonly onDidChangeDecorationsEmitter = new Emitter<void>();
    readonly onDidChangeDecorations = this.onDidChangeDecorationsEmitter.event;

    @postConstruct()
    protected init(): void {
        this.toDispose.pushAll([
            this.flashCartService.onDidChangeConnectedFlashCarts(() => this.onDidChangeDecorationsEmitter.fire()),
        ]);
    }

    decorate(title: Title<Widget>): WidgetDecoration.Data[] {
        return (title.owner.id === VesFlashCartWidget.ID &&
            !this.flashCartService.isQueued &&
            !this.flashCartService.isFlashing &&
            this.flashCartService.connectedFlashCarts.length)
            ? [{ badge: this.flashCartService.connectedFlashCarts.length }]
            : [];
    }
}
