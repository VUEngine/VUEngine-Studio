// branding
import "./branding/branding";
import "../../src/browser/branding/style/index.css";

// themes
import "./themes/index";

// flash carts
import { bindVesFlashCartsPreferences } from "./flash-carts/preferences";
import { VesFlashCartsCommandContribution } from "./flash-carts/commands";
import { VesBuildCommandContribution } from "./build/commands";

import {
  CleanTheiaCommandContribution,
  CleanTheiaMenuContribution,
} from "./clean-theia";
import { CommandContribution, MenuContribution } from "@theia/core/lib/common";
import { ContainerModule } from "inversify";
import { bindVesBuildPreferences } from "./build/preferences";

export default new ContainerModule((bind) => {
  // clean unneeded theia functions
  bind(CommandContribution).to(CleanTheiaCommandContribution);
  bind(MenuContribution).to(CleanTheiaMenuContribution);

  // build
  bindVesBuildPreferences(bind);
  bind(CommandContribution).to(VesBuildCommandContribution);

  // flash carts
  bindVesFlashCartsPreferences(bind);
  bind(CommandContribution).to(VesFlashCartsCommandContribution);
  // bind(MenuContribution).to(TheiaHelloWorldExtensionMenuContribution);
});
