import { interfaces } from 'inversify';
import { VesStateModel } from "./vesStateModel";
import "../../../src/browser/common/style/progress-bar.css";

export function bindVesStateContributions(bind: interfaces.Bind): void {
    bind(VesStateModel).toSelf().inSingletonScope();
}
