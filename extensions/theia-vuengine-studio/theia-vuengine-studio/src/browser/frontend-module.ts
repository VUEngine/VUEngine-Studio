import { ContainerModule } from "inversify";
import { CommandContribution, isOSX, MenuContribution } from "@theia/core/lib/common";
import { KeybindingContribution } from "@theia/core/lib/browser";
import { BrowserMenuBarContribution, BrowserMainMenuFactory } from '@theia/core/lib/browser/menu/browser-menu-plugin';

// clean theia
// import {
//   CleanTheiaCommandContribution,
//   CleanTheiaMenuContribution,
// } from "./clean-theia";

// topbar
import { VesTopbarActionButtonsWidget } from './topbar/actionButtons/action-buttons-widget';
import { VesTopbarActionButtonsContribution } from './topbar/actionButtons/action-buttons-view';
import '../../src/browser/topbar/actionButtons/style/index.css';
import { VesTopbarApplicationTitleWidget } from './topbar/applicationTitle/application-title-widget';
import { VesTopbarApplicationTitleContribution } from './topbar/applicationTitle/application-title-view';
import '../../src/browser/topbar/applicationTitle/style/index.css';
import { VesTopbarWindowControlsWidget } from './topbar/windowControls/window-controls-widget';
import { VesTopbarWindowControlsContribution } from './topbar/windowControls/window-controls-view';
import { VesWindowCommandContribution } from "./topbar/windowControls/commands";
import '../../src/browser/topbar/windowControls/style/index.css';
import '../../src/browser/topbar/theiaTopbar/style/index.css';
import { bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';

// branding
import "./branding/branding";
import "../../src/browser/branding/style/index.css";
import { VesBrandingMenuContribution } from "./branding/menu";
import { VesBrandingCommandContribution } from "./branding/commands";

// touchbar
// import "./touchbarTest";

// common
import { VesStateModel } from './common/vesStateModel';

// themes
import "./themes/index";

// build
import { VesBuildCommandContribution } from "./build/commands";
import { VesBuildKeybindingContribution } from "./build/keybindings";
import { VesBuildMenuContribution } from "./build/menu";
import { bindVesBuildPreferences } from "./build/preferences";

// flash carts
import { VesFlashCartsCommandContribution } from "./flash-carts/commands";
import { VesFlashCartsKeybindingContribution } from "./flash-carts/keybindings";
import { VesFlashCartsMenuContribution } from "./flash-carts/menu";
import { bindVesFlashCartsPreferences } from "./flash-carts/preferences";

// run
import { bindVesRunPreferences } from "./run/preferences";
import { VesRunCommandContribution } from "./run/commands";
import { VesRunMenuContribution } from "./run/menu";
import { VesRunKeybindingContribution } from "./run/keybindings";

export default new ContainerModule((bind) => {
  // clean unneeded theia functions
  // bind(CommandContribution).to(CleanTheiaCommandContribution);
  // bind(MenuContribution).to(CleanTheiaMenuContribution);

  // topbar
  // show theia main menu in topbar
  if (!isOSX) {
    bind(BrowserMainMenuFactory).toSelf().inSingletonScope();
    bind(BrowserMenuBarContribution).toSelf().inSingletonScope();
    bind(FrontendApplicationContribution).toService(BrowserMenuBarContribution);
  }
  // application title
  bindViewContribution(bind, VesTopbarApplicationTitleContribution);
  bind(FrontendApplicationContribution).toService(VesTopbarApplicationTitleContribution);
  bind(VesTopbarApplicationTitleWidget).toSelf();
  bind(WidgetFactory).toDynamicValue(ctx => ({
    id: VesTopbarApplicationTitleWidget.ID,
    createWidget: () => ctx.container.get<VesTopbarApplicationTitleWidget>(VesTopbarApplicationTitleWidget)
  })).inSingletonScope();
  // action buttons
  bindViewContribution(bind, VesTopbarActionButtonsContribution);
  bind(FrontendApplicationContribution).toService(VesTopbarActionButtonsContribution);
  bind(VesTopbarActionButtonsWidget).toSelf();
  bind(WidgetFactory).toDynamicValue(ctx => ({
    id: VesTopbarActionButtonsWidget.ID,
    createWidget: () => ctx.container.get<VesTopbarActionButtonsWidget>(VesTopbarActionButtonsWidget)
  })).inSingletonScope();
  // window controls
  bind(CommandContribution).to(VesWindowCommandContribution);
  if (!isOSX) {
    bindViewContribution(bind, VesTopbarWindowControlsContribution);
    bind(FrontendApplicationContribution).toService(VesTopbarWindowControlsContribution);
    bind(VesTopbarWindowControlsWidget).toSelf();
    bind(WidgetFactory).toDynamicValue(ctx => ({
      id: VesTopbarWindowControlsWidget.ID,
      createWidget: () => ctx.container.get<VesTopbarWindowControlsWidget>(VesTopbarWindowControlsWidget)
    })).inSingletonScope();
  }

  // branding
  bind(CommandContribution).to(VesBrandingCommandContribution);
  bind(MenuContribution).to(VesBrandingMenuContribution);

  // common
  bind(VesStateModel).toSelf().inSingletonScope();

  // build
  bindVesBuildPreferences(bind);
  bind(CommandContribution).to(VesBuildCommandContribution);
  bind(MenuContribution).to(VesBuildMenuContribution);
  bind(KeybindingContribution).to(VesBuildKeybindingContribution);

  // flash carts
  bindVesFlashCartsPreferences(bind);
  bind(CommandContribution).to(VesFlashCartsCommandContribution);
  bind(MenuContribution).to(VesFlashCartsMenuContribution);
  bind(KeybindingContribution).to(VesFlashCartsKeybindingContribution);

  // run
  bindVesRunPreferences(bind);
  bind(CommandContribution).to(VesRunCommandContribution);
  bind(MenuContribution).to(VesRunMenuContribution);
  bind(KeybindingContribution).to(VesRunKeybindingContribution);
});
