import { ContainerModule } from 'inversify';
import { bindVesProcessService } from './process-service/process-service-backend-module';
import { bindVesFlashCartService } from './flash-cart-service/flash-cart-service-backend-module';

export default new ContainerModule(bind => {
    bindVesProcessService(bind);
    bindVesFlashCartService(bind);
});