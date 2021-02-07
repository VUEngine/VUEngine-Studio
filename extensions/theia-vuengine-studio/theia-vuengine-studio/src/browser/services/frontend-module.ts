import { interfaces } from 'inversify';
import { bindVesProcessService } from './process-service-contribution';
import { bindVesUsbService } from './usb-service/usb-service-contribution';

export function bindVesServices(bind: interfaces.Bind): void {
    bindVesProcessService(bind);
    bindVesUsbService(bind);
}
