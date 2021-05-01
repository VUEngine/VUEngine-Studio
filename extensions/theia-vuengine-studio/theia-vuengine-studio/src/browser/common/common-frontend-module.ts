import { interfaces } from 'inversify';
import { VesCommonFunctions } from './common-functions';
import { VesState } from "./ves-state";
import "../../../src/browser/common/style/progress-bar.css";

export function bindVesStateContributions(bind: interfaces.Bind): void {
    bind(VesCommonFunctions).toSelf().inSingletonScope();
    bind(VesState).toSelf().inSingletonScope();
}
