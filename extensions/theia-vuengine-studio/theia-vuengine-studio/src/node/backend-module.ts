import { ContainerModule } from 'inversify';
import { bindVesProcessService } from './process-service/process-service-backend-module';
import { bindVesFlashCartService } from './flash-cart-service/flash-cart-service-backend-module';
import { bindVesEnvVariablesServer } from './variables-server/variables-server-backend-module';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bindVesProcessService(bind);
    bindVesFlashCartService(bind);
    bindVesEnvVariablesServer(rebind);
});