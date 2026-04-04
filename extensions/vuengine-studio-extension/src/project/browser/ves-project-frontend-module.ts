import { PreferenceContribution } from '@theia/core';
import { bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import { TabBarToolbarContribution } from '@theia/core/lib/browser/shell/tab-bar-toolbar';
import { CommandContribution } from '@theia/core/lib/common/command';
import { ContainerModule } from '@theia/core/shared/inversify';
import { WorkspaceFrontendContribution } from '@theia/workspace/lib/browser';
import { WorkspaceFileService } from '@theia/workspace/lib/common';
import '../../../src/project/browser/style/index.css';
import { VesWorkspaceFileService } from '../common/ves-workspace-file-service';
import { ActorAssetsBrowserViewContribution } from './assets-browser/actor-assets-browser-view-contribution';
import { ActorAssetsBrowserWidget } from './assets-browser/actor-assets-browser-widget';
import { AssetsBrowserViewContribution } from './assets-browser/assets-browser-view-contribution';
import { BrightnessRepeatAssetsBrowserViewContribution } from './assets-browser/brightness-repeat-assets-browser-view-contribution';
import { BrightnessRepeatAssetsBrowserWidget } from './assets-browser/brightness-repeat-assets-browser-widget';
import { ColumnTableAssetsBrowserViewContribution } from './assets-browser/column-table-assets-browser-view-contribution';
import { ColumnTableAssetsBrowserWidget } from './assets-browser/column-table-assets-browser-widget';
import { FontAssetsBrowserViewContribution } from './assets-browser/font-assets-browser-view-contribution';
import { FontAssetsBrowserWidget } from './assets-browser/font-assets-browser-widget';
import { ImageAssetsBrowserViewContribution } from './assets-browser/image-assets-browser-view-contribution';
import { ImageAssetsBrowserWidget } from './assets-browser/image-assets-browser-widget';
import { LogicAssetsBrowserViewContribution } from './assets-browser/logic-assets-browser-view-contribution';
import { LogicAssetsBrowserWidget } from './assets-browser/logic-assets-browser-widget';
import { PixelAssetsBrowserViewContribution } from './assets-browser/pixel-assets-browser-view-contribution';
import { PixelAssetsBrowserWidget } from './assets-browser/pixel-assets-browser-widget';
import { RumbleEffectAssetsBrowserViewContribution } from './assets-browser/rumble-effect-assets-browser-view-contribution';
import { RumbleEffectAssetsBrowserWidget } from './assets-browser/rumble-effect-assets-browser-widget';
import { SoundAssetsBrowserViewContribution } from './assets-browser/sound-assets-browser-view-contribution';
import { SoundAssetsBrowserWidget } from './assets-browser/sound-assets-browser-widget';
import { StageAssetsBrowserViewContribution } from './assets-browser/stage-assets-browser-view-contribution';
import { StageAssetsBrowserWidget } from './assets-browser/stage-assets-browser-widget';
import { VesNewProjectDialog, VesNewProjectDialogProps } from './new-project/ves-new-project-dialog';
import { VesProjectCommands } from './ves-project-commands';
import { VesProjectContribution } from './ves-project-contribution';
import { VesProjectDashboardViewContribution } from './ves-project-dashboard-view';
import { VesProjectDashboardWidget } from './ves-project-dashboard-widget';
import { VesProjectPathsService } from './ves-project-paths-service';
import { VesProjectPreferenceSchema } from './ves-project-preferences';
import { VesProjectService } from './ves-project-service';
import { VesProjectStatusBarContribution } from './ves-project-statusbar-contribution';
import { VesWorkspaceFrontendContribution } from './ves-project-workspace-frontend-contribution';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // commands
    bind(VesProjectContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(VesProjectContribution);

    // preferences
    bind(PreferenceContribution).toConstantValue({ schema: VesProjectPreferenceSchema });

    // status bar entry
    bind(VesProjectStatusBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(VesProjectStatusBarContribution);

    // project service
    bind(VesProjectService).toSelf().inSingletonScope();
    bind(VesProjectPathsService).toSelf().inSingletonScope();

    // new project dialog
    bind(VesNewProjectDialog).toSelf().inSingletonScope();
    bind(VesNewProjectDialogProps).toConstantValue({ title: VesProjectCommands.NEW.label! });

    bind(VesWorkspaceFrontendContribution).toSelf().inSingletonScope();
    rebind(WorkspaceFrontendContribution).to(VesWorkspaceFrontendContribution);

    // custom project file name
    bind(VesWorkspaceFileService).toSelf().inSingletonScope();
    rebind(WorkspaceFileService).to(VesWorkspaceFileService);

    // build view
    bindViewContribution(bind, VesProjectDashboardViewContribution);
    bind(CommandContribution).toService(VesProjectDashboardViewContribution);
    bind(VesProjectDashboardWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
        id: VesProjectDashboardWidget.ID,
        createWidget: () => ctx.container.get<VesProjectDashboardWidget>(VesProjectDashboardWidget)
    })).inSingletonScope();

    // assets sidebar views
    bind(AssetsBrowserViewContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(AssetsBrowserViewContribution);
    bind(TabBarToolbarContribution).toService(AssetsBrowserViewContribution);
    [
        [ActorAssetsBrowserViewContribution, ActorAssetsBrowserWidget],
        [BrightnessRepeatAssetsBrowserViewContribution, BrightnessRepeatAssetsBrowserWidget],
        [ColumnTableAssetsBrowserViewContribution, ColumnTableAssetsBrowserWidget],
        [FontAssetsBrowserViewContribution, FontAssetsBrowserWidget],
        [ImageAssetsBrowserViewContribution, ImageAssetsBrowserWidget],
        [LogicAssetsBrowserViewContribution, LogicAssetsBrowserWidget],
        [PixelAssetsBrowserViewContribution, PixelAssetsBrowserWidget],
        [RumbleEffectAssetsBrowserViewContribution, RumbleEffectAssetsBrowserWidget],
        [SoundAssetsBrowserViewContribution, SoundAssetsBrowserWidget],
        [StageAssetsBrowserViewContribution, StageAssetsBrowserWidget],
    ].forEach(v => {
        // @ts-ignore
        bindViewContribution(bind, v[0]);
        bind(FrontendApplicationContribution).toService(v[0]);
        bind(TabBarToolbarContribution).toService(v[0]);
        bind(v[1]).toSelf();
        bind(WidgetFactory).toDynamicValue(ctx => ({
            // @ts-ignore
            id: v[1].ID,
            // @ts-ignore
            createWidget: () => ctx.container.get<v[1]>(v[1])
        })).inSingletonScope();
    });
});
