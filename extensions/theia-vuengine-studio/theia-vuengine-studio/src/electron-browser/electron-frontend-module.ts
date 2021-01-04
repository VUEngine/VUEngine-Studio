import { ContainerModule } from "inversify";
import { bindVesElectronMenuContributions } from "./menu/electron-frontend-module";

export default new ContainerModule((bind, unbind, isBound, rebind) => {
  bindVesElectronMenuContributions(bind, rebind);
});
