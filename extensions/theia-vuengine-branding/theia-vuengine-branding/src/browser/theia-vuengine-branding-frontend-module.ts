/**
 * Generated using theia-extension-generator
 */

import './branding';
import '../../src/browser/style/index.css';

import { TheiaHelloWorldExtensionCommandContribution, TheiaHelloWorldExtensionMenuContribution } from './theia-vuengine-branding-contribution';
import {
    CommandContribution,
    MenuContribution
} from "@theia/core/lib/common";
import { ContainerModule } from "inversify";

export default new ContainerModule(bind => {
    // add your contribution bindings here
    bind(CommandContribution).to(TheiaHelloWorldExtensionCommandContribution);
    bind(MenuContribution).to(TheiaHelloWorldExtensionMenuContribution);
});
