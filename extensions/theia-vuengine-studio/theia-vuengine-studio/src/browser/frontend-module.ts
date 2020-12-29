import { ContainerModule } from "inversify";
import { bindVesStateContributions } from "./common/frontend-module";
import { bindVesBuildContributions } from "./build/frontend-module";
import { bindVesFlashCartsContributions } from "./flash-carts/frontend-module";
import { bindVesRunContributions } from "./run/frontend-module";
import { bindVesBrandingContributions } from "./branding/frontend-module";
import { bindVesTopBarContributions } from "./topbar/frontend-module";
import { rebindtheiaContributions } from "./theia-customizations/frontend-module";

import "./themes/index";

export default new ContainerModule((bind, unbind, isBound, rebind) => {
  rebindtheiaContributions(bind, rebind);
  bindVesTopBarContributions(bind);
  bindVesBrandingContributions(bind);
  bindVesStateContributions(bind);
  bindVesBuildContributions(bind);
  bindVesFlashCartsContributions(bind);
  bindVesRunContributions(bind);
});
