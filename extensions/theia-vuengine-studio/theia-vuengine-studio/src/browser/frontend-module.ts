import { bindSampleMenu } from "./sample-menu-contribution"

// branding
import "./branding/branding";
import "../../src/browser/branding/style/index.css";

// themes
import "./themes/index";

// flash carts
// import { bindVesFlashCartsPreferences } from "./flash-carts/preferences";
// import { VesFlashCartsCommandContribution } from "./flash-carts/commands";

import {
  CleanTheiaCommandContribution,
  CleanTheiaMenuContribution,
} from "./clean-theia";
import { CommandContribution, MenuContribution } from "@theia/core/lib/common";
import { ContainerModule } from "inversify";

export default new ContainerModule((bind) => {
  // clean unneeded theia functions
  bind(CommandContribution).to(CleanTheiaCommandContribution);
  bind(MenuContribution).to(CleanTheiaMenuContribution);

  // flash carts
  // bindVesFlashCartsPreferences(bind);
  // bind(CommandContribution).to(VesFlashCartsCommandContribution);
  // bind(MenuContribution).to(TheiaHelloWorldExtensionMenuContribution);

  bindSampleMenu(bind);
});
