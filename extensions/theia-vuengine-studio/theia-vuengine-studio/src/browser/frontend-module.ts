import { ContainerModule } from "inversify";
import { bindVesStateContributions } from "./common/frontend-module";
import { bindVesBuildContributions } from "./build/frontend-module";
import { bindVesFlashCartsContributions } from "./flash-carts/frontend-module";
import { bindVesRunContributions } from "./run/frontend-module";
import { bindVesBrandingContributions } from "./branding/frontend-module";
import { bindVesTopBarContributions } from "./topbar/frontend-module";
import { rebindtheiaContributions } from "./theia-customizations/frontend-module";
import { bindVesServices } from "./services/frontend-module";
import { bindVesDocumentationContributions } from "./documentation/frontend-module";
import { bindVesWelcomeContributions } from "./welcome/welcome-frontend-module";
import { bindTheiaCustomizationAboutDialogModule } from "./about/about-dialog-frontend-module";
import { bindVesZoomContributions } from "./zoom/frontend-module";
import "./themes/index";

export default new ContainerModule((bind, unbind, isBound, rebind) => {
  rebindtheiaContributions(bind, rebind);
  bindVesTopBarContributions(bind);
  bindVesServices(bind);
  bindVesBrandingContributions(bind);
  bindVesStateContributions(bind);
  bindVesBuildContributions(bind);
  bindVesFlashCartsContributions(bind);
  bindVesRunContributions(bind);
  bindVesDocumentationContributions(bind);
  bindVesWelcomeContributions(bind);
  bindTheiaCustomizationAboutDialogModule(bind, rebind);
  bindVesZoomContributions(bind);
});
