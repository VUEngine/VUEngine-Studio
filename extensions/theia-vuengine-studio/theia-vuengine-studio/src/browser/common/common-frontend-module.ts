import { interfaces } from 'inversify';
import { VesState } from "./ves-state";
import "../../../src/browser/common/style/progress-bar.css";

export function bindVesStateContributions(bind: interfaces.Bind): void {
    bind(VesState).toSelf().inSingletonScope();
}
