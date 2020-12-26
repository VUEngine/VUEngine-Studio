import { interfaces } from 'inversify';
import { VesStateModel } from "./vesStateModel";

export function bindVesStateContributions(bind: interfaces.Bind): void {
    bind(VesStateModel).toSelf().inSingletonScope();
}
