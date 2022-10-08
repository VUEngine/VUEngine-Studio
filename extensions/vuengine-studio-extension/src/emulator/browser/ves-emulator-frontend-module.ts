import { CommandContribution, MenuContribution } from '@theia/core';
import { bindViewContribution, FrontendApplicationContribution, KeybindingContribution, OpenHandler, PreferenceContribution, WidgetFactory } from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ContainerModule } from '@theia/core/shared/inversify';
import '../../../src/emulator/browser/style/index.css';
import { VesEmulatorContextKeyService } from './ves-emulator-context-key-service';
import { VesEmulatorContribution } from './ves-emulator-contribution';
import { VesEmulatorOpenHandler } from './ves-emulator-open-handler';
import { VesEmulatorPreferenceSchema } from './ves-emulator-preferences';
import { VesEmulatorService } from './ves-emulator-service';
import { VesEmulatorSidebarViewContribution } from './ves-emulator-sidebar-view-contribution';
import { VesEmulatorSidebarWidget } from './ves-emulator-sidebar-widget';
import { VesEmulatorViewContribution } from './ves-emulator-view';
import { VesEmulatorWidget, VesEmulatorWidgetOptions } from './ves-emulator-widget';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesEmulatorPreferenceSchema });

    // commands, keybindings and menus
    bind(VesEmulatorContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesEmulatorContribution);
    bind(KeybindingContribution).toService(VesEmulatorContribution);
    bind(MenuContribution).toService(VesEmulatorContribution);

    // status bar entry
    // bind(VesEmulatorStatusBarContribution).toSelf().inSingletonScope();
    // bind(FrontendApplicationContribution).toService(VesEmulatorStatusBarContribution);

    // emulator service
    bind(VesEmulatorService).toSelf().inSingletonScope();

    // context key service
    bind(VesEmulatorContextKeyService).toSelf().inSingletonScope();

    // emulator view
    bindViewContribution(bind, VesEmulatorViewContribution);
    bind(FrontendApplicationContribution).toService(VesEmulatorViewContribution);
    bind(TabBarToolbarContribution).toService(VesEmulatorViewContribution);
    bind(OpenHandler).to(VesEmulatorOpenHandler).inSingletonScope();
    bind(VesEmulatorWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: VesEmulatorWidget.ID,
        createWidget: (options: VesEmulatorWidgetOptions) => {
            const child = container.createChild();
            child.bind(VesEmulatorWidgetOptions).toConstantValue(options);
            child.bind(VesEmulatorWidget).toSelf();
            return child.get(VesEmulatorWidget);
        },
    }));

    // emulator sidebar view
    bindViewContribution(bind, VesEmulatorSidebarViewContribution);
    bind(FrontendApplicationContribution).toService(VesEmulatorSidebarViewContribution);
    bind(TabBarToolbarContribution).toService(VesEmulatorSidebarViewContribution);
    bind(VesEmulatorSidebarWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VesEmulatorSidebarWidget.ID,
        createWidget: () => ctx.container.get<VesEmulatorSidebarWidget>(VesEmulatorSidebarWidget)
    })).inSingletonScope();
});
