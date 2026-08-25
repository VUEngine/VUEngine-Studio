import { CommandContribution, MenuContribution, PreferenceContribution, nls } from '@theia/core';
import { Endpoint, FrontendApplicationContribution, KeybindingContribution, OpenHandler, WidgetFactory, bindViewContribution } from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ContainerModule } from '@theia/core/shared/inversify';
// The emulator's own stylesheet travels with it; these are the studio's.
import 'vueport-core/src/browser/style/emulator-widget.css';
import '../../../src/emulator/browser/style/index.css';
import { setLocalization } from 'vueport-core/lib/common/emulator-nls';
import { EmulatorConfigsViewContribution } from './ves-emulator-configs-view-contribution';
import { EmulatorConfigsWidget } from './ves-emulator-configs-widget';
import { VesEmulatorContextKeyService } from './ves-emulator-context-key-service';
import { VesEmulatorContribution } from './ves-emulator-contribution';
import { VesEmulatorCoreService } from 'vueport-core/lib/browser/emulator-core-service';
import { VesEmulatorOpenHandler } from './ves-emulator-open-handler';
import { VesEmulatorPreferenceSchema } from './ves-emulator-preferences';
import { VesEmulatorService } from './ves-emulator-service';
import { VesEmulatorSidebarViewContribution } from './ves-emulator-sidebar-view-contribution';
import { VesEmulatorSidebarWidget } from './ves-emulator-sidebar-widget';
import { VesEmulatorStatusBarContribution } from './ves-emulator-statusbar-contribution';
import { VesEmulatorViewContribution } from './ves-emulator-view';
import { VesEmulatorWidget, VesEmulatorWidgetOptions } from './ves-emulator-widget';

// The emulator localizes through its own indirection rather than through Theia
// directly, so that the parts destined for vueport carry no framework with
// them. Installed here, at module scope, because this runs before anything the
// container binds can render — but after the panels' modules have loaded,
// which is why their label tables are lazy.
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
    // Where the core's pieces are served from is the application's business,
    // not the emulator's: the worker and the worklet are emitted next to the
    // frontend bundle by esbuild (see applications/electron/esbuild.mjs), and
    // the wasm comes from the backend's static route.
    bind(VesEmulatorCoreService).toDynamicValue(() => new VesEmulatorCoreService({
        workerUrl: './vb-worker.js',
        audioWorkletUrl: './vb-audio-worklet.js',
        wasmUrl: new Endpoint({ path: '/emulator/core.wasm' }).getRestUrl().toString(),
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
