import { KeybindingContribution, ShellLayoutRestorer, ShellLayoutTransformer } from '@theia/core/lib/browser';
import { CommandContribution } from '@theia/core/lib/common/command';
import { MenuContribution } from '@theia/core/lib/common/menu';
import { ContainerModule } from '@theia/core/shared/inversify';
import { PreferencesWidget } from '@theia/preferences/lib/browser/views/preference-widget';
import { createPreferencesWidgetContainer } from '@theia/preferences/lib/browser/views/preference-widget-bindings';
import '../../../src/viewMode/browser/style/index.css';
import { ViewModeContribution } from './view-mode-contribution';
import { ViewModePreferencesWidget } from './view-mode-preferences-widget';
import { ViewModeService } from './view-mode-service';
import { ViewModeShellLayoutRestorer } from './view-mode-shell-layout-restorer';
import { ViewModeShellLayoutTransformer } from './view-mode-shell-layout-transformer';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    bind(ViewModeService).toSelf().inSingletonScope();
    bind(ViewModeContribution).toSelf().inSingletonScope();

    bind(CommandContribution).toService(ViewModeContribution);
    bind(KeybindingContribution).toService(ViewModeContribution);
    bind(MenuContribution).toService(ViewModeContribution);

    rebind(ShellLayoutRestorer).to(ViewModeShellLayoutRestorer).inSingletonScope();
    bind(ShellLayoutTransformer).to(ViewModeShellLayoutTransformer);

    bind(ViewModePreferencesWidget).toSelf().inSingletonScope();
    rebind(PreferencesWidget)
        .toDynamicValue(({ container }) => createPreferencesWidgetContainer(container).get(ViewModePreferencesWidget))
        .inSingletonScope();
});
