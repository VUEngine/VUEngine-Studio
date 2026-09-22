import { CommandContribution, MenuContribution, PreferenceContribution, nls } from '@theia/core';
import { Endpoint, FrontendApplicationContribution, KeybindingContribution, OpenHandler, WidgetFactory, bindViewContribution } from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ContainerModule } from '@theia/core/shared/inversify';
import 'vueport-core/src/browser/style/emulator-widget.css';
import 'vueport-core/src/browser/style/host-theia.css';
import '../../../src/emulator/browser/style/index.css';
import { setLocalization } from 'vueport-core/lib/common/emulator-nls';
import { EmulatorConfigsViewContribution } from './ves-emulator-configs-view-contribution';
import { EmulatorConfigsWidget } from './ves-emulator-configs-widget';
import { VesEmulatorContextKeyService } from './ves-emulator-context-key-service';
import { VesEmulatorContribution } from './ves-emulator-contribution';
import { EmulatorCoreService } from 'vueport-core/lib/browser/emulator-core-service';
import { VesEmulatorOpenHandler } from './ves-emulator-open-handler';
import { VesEmulatorPreferenceSchema } from './ves-emulator-preferences';
import { VesEmulatorService } from './ves-emulator-service';
import { VesEmulatorSidebarViewContribution } from './ves-emulator-sidebar-view-contribution';
import { VesEmulatorSidebarWidget } from './ves-emulator-sidebar-widget';
import { VesEmulatorStatusBarContribution } from './ves-emulator-statusbar-contribution';
import { VesEmulatorViewContribution } from './ves-emulator-view';
import { VesEmulatorWidget, VesEmulatorWidgetOptions } from './ves-emulator-widget';

setLocalization(nls.localize);

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesEmulatorPreferenceSchema });

    // commands, keybindings and menus
    bind(VesEmulatorContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesEmulatorContribution);
    bind(KeybindingContribution).toService(VesEmulatorContribution);
    bind(MenuContribution).toService(VesEmulatorContribution);

    // status bar entry
    bind(VesEmulatorStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesEmulatorStatusBarContribution);

    // emulator service
    bind(VesEmulatorService).toSelf().inSingletonScope();

    // emulator core sessions
    bind(EmulatorCoreService).toDynamicValue(() => new EmulatorCoreService({
        workerUrl: './vb-worker.js',
        audioWorkletUrl: './vb-audio-worklet.js',
        wasmUrl: new Endpoint({ path: '/emulator/core.wasm' }).getRestUrl().toString(),
        rcheevosModuleUrl: new Endpoint({ path: '/emulator/rcheevos.js' }).getRestUrl().toString(),
    })).inSingletonScope();

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

    // emulator configs view
    bindViewContribution(bind, EmulatorConfigsViewContribution);
    bind(FrontendApplicationContribution).toService(EmulatorConfigsViewContribution);
    bind(EmulatorConfigsWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: EmulatorConfigsWidget.ID,
        createWidget: () => ctx.container.get<EmulatorConfigsWidget>(EmulatorConfigsWidget)
    })).inSingletonScope();

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
