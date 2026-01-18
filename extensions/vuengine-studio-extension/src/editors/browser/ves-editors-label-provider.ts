import { LabelProviderContribution } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { inject, injectable, postConstruct } from '@theia/core/shared/inversify';
import { FileStat } from '@theia/filesystem/lib/common/files';
import { VesProjectService } from '../../project/browser/ves-project-service';
import { PROJECT_TYPES } from '../../project/browser/ves-project-data';

@injectable()
export class VesEditorsLabelProviderContribution implements LabelProviderContribution {
    @inject(VesProjectService)
    protected vesProjectService: VesProjectService;

    protected fileIcons: { [filePattern: string]: string } = {};
    protected fileIcon: string;

    @postConstruct()
    protected init(): void {
        for (const typeId of Object.keys(PROJECT_TYPES)) {
            if (PROJECT_TYPES[typeId].icon !== undefined) {
                this.fileIcons[PROJECT_TYPES[typeId].file] = PROJECT_TYPES[typeId].icon!;
            }
        }
    }

    canHandle(element: object): number {
        let toCheck = element;
        if (FileStat.is(toCheck)) {
            toCheck = toCheck.resource;
        }
        if (toCheck instanceof URI) {
            for (const f of Object.keys(this.fileIcons)) {
                if ([toCheck.path.ext, toCheck.path.base].includes(f)) {
                    this.fileIcon = this.fileIcons[f];
                    return 1000;
                }
            }
            if (toCheck.path.ext === '.font') {
                return 1000;
            }
        }
        return 0;
    }

    getIcon(): string {
        const prefixes = this.fileIcon?.includes('codicon ')
            ? 'ves-codicon-file-icon'
            : 'file-icon theia-file-icons-js';
        return `${prefixes} ${this.fileIcon}`;
    }
}
