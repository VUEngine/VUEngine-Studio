import { ContainerModule } from 'inversify';
import { bindVesProcessService } from './process-service/backend-module';
import { bindVesUsbService } from './usb-service/backend-module';

export default new ContainerModule(bind => {
    bindVesProcessService(bind);
    bindVesUsbService(bind);
});