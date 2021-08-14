import { ContainerModule } from '@theia/core/shared/inversify';
import { CommandContribution, MenuContribution } from '@theia/core';
import { bindViewContribution, FrontendApplicationContribution, KeybindingContribution, OpenHandler, PreferenceContribution, WidgetFactory } from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { VesEmulatorContextKeyService } from './ves-emulator-context-key-service';
import { VesEmulatorContribution } from './ves-emulator-contribution';
import { VesEmulatorOpenHandler } from './ves-emulator-open-handler';
import { VesEmulatorPreferenceSchema } from './ves-emulator-preferences';
import { VesEmulatorService } from './ves-emulator-service';
import { VesEmulatorViewContribution } from './ves-emulator-view';
import { VesEmulatorWidget, VesEmulatorWidgetOptions } from './widget/ves-emulator-widget';
import '../../../src/emulator/browser/style/index.css';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesEmulatorPreferenceSchema });

    // commands, keybindings and menus
    bind(VesEmulatorContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesEmulatorContribution);
    bind(KeybindingContribution).toService(VesEmulatorContribution);
    bind(MenuContribution).toService(VesEmulatorContribution);

    // emulator service
    bind(VesEmulatorService).toSelf().inSingletonScope();

    // context key service
    bind(VesEmulatorContextKeyService)
        .toSelf()
        .inSingletonScope();

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
});
