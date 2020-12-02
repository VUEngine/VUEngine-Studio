import './branding/branding';
import './themes/index';
import '../../src/browser/branding/style/index.css';

import { TheiaHelloWorldExtensionCommandContribution, TheiaHelloWorldExtensionMenuContribution } from './hello-world';
import { bindHostedPluginPreferences } from './preferences';
import { CleanTheiaCommandContribution, CleanTheiaMenuContribution } from './clean-theia';
import { CommandContribution, MenuContribution } from "@theia/core/lib/common";
import { ContainerModule } from "inversify";

export default new ContainerModule(bind => {
    bind(CommandContribution).to(TheiaHelloWorldExtensionCommandContribution);
    bind(MenuContribution).to(TheiaHelloWorldExtensionMenuContribution);

    bind(CommandContribution).to(CleanTheiaCommandContribution);
    bind(MenuContribution).to(CleanTheiaMenuContribution);

    bindHostedPluginPreferences(bind);
});
