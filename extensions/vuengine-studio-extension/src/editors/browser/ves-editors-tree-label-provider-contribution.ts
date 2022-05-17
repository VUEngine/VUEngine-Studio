import { LabelProviderContribution } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { FileStat } from '@theia/filesystem/lib/common';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class VesEditorsTreeLabelProviderContribution implements LabelProviderContribution {
    canHandle(uri: object): number {
        let toCheck = uri;
        // eslint-disable-next-line deprecation/deprecation
        if (FileStat.is(toCheck)) {
            toCheck = new URI(toCheck.uri);
        }
        if (toCheck instanceof URI) {
            if (toCheck.path.ext === '.entity' ||
                toCheck.path.ext === '.image' ||
                toCheck.path.ext === '.project' ||
                toCheck.path.ext === '.romHeader') {
                return 1000;
            }
        }
        return 0;
    }

    getIcon(): string {
        return 'fa fa-cog';
    }
}
