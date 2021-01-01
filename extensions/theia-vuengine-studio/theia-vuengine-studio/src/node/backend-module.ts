import { ContainerModule } from 'inversify';
import { bindVesProcessService } from './process-service/process-service-module';
import { bindVesUsbService } from './usb-service/usb-service-module';

export default new ContainerModule(bind => {
    bindVesProcessService(bind);
    bindVesUsbService(bind);
});