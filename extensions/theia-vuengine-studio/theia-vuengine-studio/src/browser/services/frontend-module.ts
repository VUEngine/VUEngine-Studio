import { interfaces } from 'inversify';
import { bindVesProcessService } from './process-service-contribution';
import { bindVesFlashCartService } from './flash-cart-service/flash-cart-service-contribution';

export function bindVesServices(bind: interfaces.Bind): void {
    bindVesProcessService(bind);
    bindVesFlashCartService(bind);
}
