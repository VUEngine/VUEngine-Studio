import { KeybindingContribution } from '@theia/core/lib/browser';
import { CommandContribution } from '@theia/core/lib/common/command';
import { MenuContribution } from '@theia/core/lib/common/menu';
import { ContainerModule } from '@theia/core/shared/inversify';
import '../../../src/viewMode/browser/style/index.css';
import { ViewModeContribution } from './view-mode-contribution';
import { ViewModeService } from './view-mode-service';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(ViewModeService).toSelf().inSingletonScope();
    bind(ViewModeContribution).toSelf().inSingletonScope();
    bind(CommandContribution).toService(ViewModeContribution);
    bind(KeybindingContribution).toService(ViewModeContribution);
    bind(MenuContribution).toService(ViewModeContribution);
});
