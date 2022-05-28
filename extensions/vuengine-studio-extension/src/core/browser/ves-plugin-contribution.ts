import { Disposable } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';
import { ViewContainerTitleOptions } from '@theia/core/lib/browser';
import { PluginViewRegistry } from '@theia/plugin-ext/lib/main/browser/view/plugin-view-registry';

@injectable()
export class VesPluginContribution extends PluginViewRegistry {
    // remove "test" view
    protected doRegisterViewContainer(id: string, location: string, options: ViewContainerTitleOptions): Disposable {
        return (id === 'test')
            ? Disposable.create(() => { })
            : super.doRegisterViewContainer(id, location, options);
    }
}
