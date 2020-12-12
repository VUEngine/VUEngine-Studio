import { ContainerModule } from "inversify";
import { CommandContribution, MenuContribution } from "@theia/core/lib/common";
import { KeybindingContribution } from "@theia/core/lib/browser";

// clean theia
// import {
//   CleanTheiaCommandContribution,
//   CleanTheiaMenuContribution,
// } from "./clean-theia";

// topbar
import { VesTopbarWidget } from './topbar/widget';
import { VesTopbarContribution } from './topbar/view';
import { bindViewContribution, FrontendApplicationContribution, WidgetFactory } from '@theia/core/lib/browser';
import '../../src/browser/topbar/style/index.css';

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
  bindViewContribution(bind, VesTopbarContribution);
  bind(FrontendApplicationContribution).toService(VesTopbarContribution);
  bind(VesTopbarWidget).toSelf();
  bind(WidgetFactory).toDynamicValue(ctx => ({
    id: VesTopbarWidget.ID,
    createWidget: () => ctx.container.get<VesTopbarWidget>(VesTopbarWidget)
  })).inSingletonScope();


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
