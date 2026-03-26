import { CommandContribution, MenuContribution, PreferenceContribution } from '@theia/core';
import { bindViewContribution, FrontendApplicationContribution, KeybindingContribution, LabelProviderContribution, OpenHandler, WidgetFactory } from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { ContainerModule } from '@theia/core/shared/inversify';
import { WorkspaceCommandContribution } from '@theia/workspace/lib/browser';
import '../../../src/editors/browser/style/index.css';
import { SoundEditorCurrentNoteViewContribution } from './sidebar/SoundEditor/sound-editor-current-note-view-contribution';
import { SoundEditorCurrentNoteWidget } from './sidebar/SoundEditor/sound-editor-current-note-widget';
import { SoundEditorCurrentPatternViewContribution } from './sidebar/SoundEditor/sound-editor-current-pattern-view-contribution';
import { SoundEditorCurrentPatternWidget } from './sidebar/SoundEditor/sound-editor-current-pattern-widget';
import { SoundEditorCurrentTrackViewContribution } from './sidebar/SoundEditor/sound-editor-current-track-view-contribution';
import { SoundEditorCurrentTrackWidget } from './sidebar/SoundEditor/sound-editor-current-track-widget';
import { SoundEditorInstrumentsViewContribution } from './sidebar/SoundEditor/sound-editor-instruments-view-contribution';
import { SoundEditorInstrumentsWidget } from './sidebar/SoundEditor/sound-editor-instruments-widget';
import { SoundEditorKeyBindingsViewContribution } from './sidebar/SoundEditor/sound-editor-key-bindings-view-contribution';
import { SoundEditorKeyBindingsWidget } from './sidebar/SoundEditor/sound-editor-key-bindings-widget';
import { SoundEditorPropertiesViewContribution } from './sidebar/SoundEditor/sound-editor-properties-view-contribution';
import { SoundEditorPropertiesWidget } from './sidebar/SoundEditor/sound-editor-properties-widget';
import { SoundEditorUtilitiesViewContribution } from './sidebar/SoundEditor/sound-editor-utilities-view-contribution';
import { SoundEditorUtilitiesWidget } from './sidebar/SoundEditor/sound-editor-utilities-widget';
import { VesEditorsContextKeyService } from './ves-editors-context-key-service';
import { VesEditorsContribution } from './ves-editors-contribution';
import { VesEditorsLabelProviderContribution } from './ves-editors-label-provider';
import { VesEditorsNavigationContribution } from './ves-editors-navigation-contribution';
import { VesEditorsOpenHandler } from './ves-editors-open-handler';
import { VesEditorsPreferenceSchema } from './ves-editors-preferences';
import { VesEditorsViewContribution } from './ves-editors-view';
import { VesEditorsWidget, VesEditorsWidgetOptions } from './ves-editors-widget';
import { VesWorkspaceCommandContribution } from './ves-workspace-commands';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesEditorsPreferenceSchema });

    // override new file dialog
    rebind(WorkspaceCommandContribution).to(VesWorkspaceCommandContribution).inSingletonScope();

    // context key service
    bind(VesEditorsContextKeyService).toSelf().inSingletonScope();

    // open with
    bind(VesEditorsContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesEditorsContribution);

    // add to navigation history, e.g. "recently opened"
    bind(VesEditorsNavigationContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesEditorsNavigationContribution);

    // open handler
    bind(VesEditorsOpenHandler).toSelf().inSingletonScope();
    bind(OpenHandler).toService(VesEditorsOpenHandler);

    // editors view
    bind(VesEditorsViewContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesEditorsViewContribution);
    bind(KeybindingContribution).toService(VesEditorsViewContribution);
    bind(MenuContribution).toService(VesEditorsViewContribution);
    bind(TabBarToolbarContribution).toService(VesEditorsViewContribution);
    bind(LabelProviderContribution).to(VesEditorsLabelProviderContribution).inSingletonScope();
    bind(VesEditorsWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(({ container }) => ({
        id: VesEditorsWidget.ID,
        createWidget: (options: VesEditorsWidgetOptions) => {
            const child = container.createChild();
            child.bind(VesEditorsWidgetOptions).toConstantValue(options);
            child.bind(VesEditorsWidget).toSelf();
            return child.get(VesEditorsWidget);
        },
    }));

    // sound editor properties sidebar view
    bindViewContribution(bind, SoundEditorPropertiesViewContribution);
    bind(FrontendApplicationContribution).toService(SoundEditorPropertiesViewContribution);
    bind(SoundEditorPropertiesWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: SoundEditorPropertiesWidget.ID,
        createWidget: () => ctx.container.get<SoundEditorPropertiesWidget>(SoundEditorPropertiesWidget)
    })).inSingletonScope();

    // sound editor instruments sidebar view
    bindViewContribution(bind, SoundEditorInstrumentsViewContribution);
    bind(FrontendApplicationContribution).toService(SoundEditorInstrumentsViewContribution);
    bind(SoundEditorInstrumentsWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: SoundEditorInstrumentsWidget.ID,
        createWidget: () => ctx.container.get<SoundEditorInstrumentsWidget>(SoundEditorInstrumentsWidget)
    })).inSingletonScope();

    // sound editor current track sidebar view
    bindViewContribution(bind, SoundEditorCurrentTrackViewContribution);
    bind(FrontendApplicationContribution).toService(SoundEditorCurrentTrackViewContribution);
    bind(SoundEditorCurrentTrackWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: SoundEditorCurrentTrackWidget.ID,
        createWidget: () => ctx.container.get<SoundEditorCurrentTrackWidget>(SoundEditorCurrentTrackWidget)
    })).inSingletonScope();

    // sound editor current pattern sidebar view
    bindViewContribution(bind, SoundEditorCurrentPatternViewContribution);
    bind(FrontendApplicationContribution).toService(SoundEditorCurrentPatternViewContribution);
    bind(SoundEditorCurrentPatternWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: SoundEditorCurrentPatternWidget.ID,
        createWidget: () => ctx.container.get<SoundEditorCurrentPatternWidget>(SoundEditorCurrentPatternWidget)
    })).inSingletonScope();

    // sound editor current note sidebar view
    bindViewContribution(bind, SoundEditorCurrentNoteViewContribution);
    bind(FrontendApplicationContribution).toService(SoundEditorCurrentNoteViewContribution);
    bind(SoundEditorCurrentNoteWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: SoundEditorCurrentNoteWidget.ID,
        createWidget: () => ctx.container.get<SoundEditorCurrentNoteWidget>(SoundEditorCurrentNoteWidget)
    })).inSingletonScope();

    // sound editor utilities sidebar view
    bindViewContribution(bind, SoundEditorUtilitiesViewContribution);
    bind(FrontendApplicationContribution).toService(SoundEditorUtilitiesViewContribution);
    bind(SoundEditorUtilitiesWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: SoundEditorUtilitiesWidget.ID,
        createWidget: () => ctx.container.get<SoundEditorUtilitiesWidget>(SoundEditorUtilitiesWidget)
    })).inSingletonScope();

    // sound editor key bindings sidebar view
    bindViewContribution(bind, SoundEditorKeyBindingsViewContribution);
    bind(FrontendApplicationContribution).toService(SoundEditorKeyBindingsViewContribution);
    bind(SoundEditorKeyBindingsWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: SoundEditorKeyBindingsWidget.ID,
        createWidget: () => ctx.container.get<SoundEditorKeyBindingsWidget>(SoundEditorKeyBindingsWidget)
    })).inSingletonScope();
});
