import { injectable, ContainerModule } from 'inversify';
import { Menu as MenuWidget } from '@phosphor/widgets';
import { Disposable } from '@theia/core/lib/common/disposable';
import { MenuNode, CompositeMenuNode } from '@theia/core/lib/common/menu';
import { BrowserMainMenuFactory, MenuCommandRegistry, DynamicMenuWidget } from '@theia/core/lib/browser/menu/browser-menu-plugin';
import { PlaceholderMenuNode } from './sample-menu-contribution';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    rebind(BrowserMainMenuFactory).to(SampleBrowserMainMenuFactory).inSingletonScope();
});

@injectable()
class SampleBrowserMainMenuFactory extends BrowserMainMenuFactory {

    protected handleDefault(menuCommandRegistry: MenuCommandRegistry, menuNode: MenuNode): void {
        if (menuNode instanceof PlaceholderMenuNode && menuCommandRegistry instanceof SampleMenuCommandRegistry) {
            menuCommandRegistry.registerPlaceholderMenu(menuNode);
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected createMenuCommandRegistry(menu: CompositeMenuNode, args: any[] = []): MenuCommandRegistry {
        const menuCommandRegistry = new SampleMenuCommandRegistry(this.services);
        this.registerMenu(menuCommandRegistry, menu, args);
        return menuCommandRegistry;
    }

    createMenuWidget(menu: CompositeMenuNode, options: MenuWidget.IOptions & { commands: MenuCommandRegistry }): DynamicMenuWidget {
        return new SampleDynamicMenuWidget(menu, options, this.services);
    }

}

class SampleMenuCommandRegistry extends MenuCommandRegistry {

    protected placeholders = new Map<string, PlaceholderMenuNode>();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    registerPlaceholderMenu(menu: PlaceholderMenuNode): void {
        const { id } = menu;
        if (this.placeholders.has(id)) {
            return;
        }
        this.placeholders.set(id, menu);
    }

    snapshot(): this {
        super.snapshot();
        for (const menu of this.placeholders.values()) {
            this.toDispose.push(this.registerPlaceholder(menu));
        }
        return this;
    }

    protected registerPlaceholder(menuNode: PlaceholderMenuNode): Disposable {
        const { id } = menuNode;
        const unregisterCommand = this.addCommand(id, {
            execute: () => { /* NOOP */ },
            label: menuNode.label,
            icon: menuNode.icon,
            isEnabled: () => false,
            isVisible: () => true
        });
        return Disposable.create(() => unregisterCommand.dispose());
    }

}

class SampleDynamicMenuWidget extends DynamicMenuWidget {

    protected handleDefault(menuNode: MenuNode): MenuWidget.IItemOptions[] {
        if (menuNode instanceof PlaceholderMenuNode) {
            return [{
                command: menuNode.id,
                type: 'command'
            }];
        }
        return [];
    }

}
