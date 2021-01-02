import { injectable } from "inversify";
import { PluginViewRegistry } from "@theia/plugin-ext/lib/main/browser/view/plugin-view-registry";
import { ViewContainerTitleOptions } from "@theia/core/lib/browser";
import { Disposable } from "@theia/core";

@injectable()
export class VesTheiaCleanPluginContribution extends PluginViewRegistry {
    // remove "Test" view
    protected doRegisterViewContainer(id: string, location: string, options: ViewContainerTitleOptions): Disposable {
        return (id === "test")
            ? Disposable.create(() => { })
            : super.doRegisterViewContainer(id, location, options);
    }
}
