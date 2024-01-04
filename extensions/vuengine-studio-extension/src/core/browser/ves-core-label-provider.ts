import { LabelProviderContribution } from '@theia/core/lib/browser';
import URI from '@theia/core/lib/common/uri';
import { injectable } from '@theia/core/shared/inversify';
import { VUENGINE_WORKSPACE_EXT } from '../../project/browser/ves-project-types';

interface FileType {
    base?: string;
    ext?: string;
    icon: string;
    name?: string;
};

// TODO: move to file icon theme
const FILE_TYPES: FileType[] = [{
    ext: `.${VUENGINE_WORKSPACE_EXT}`,
    icon: 'ves-codicon-file-icon codicon codicon-library medium-purple',
}, {
    ext: '.vb',
    icon: 'ves-codicon-file-icon codicon codicon-play',
}, {
    ext: '.VB',
    icon: 'ves-codicon-file-icon codicon codicon-play',
}];

@injectable()
export class VesCoreLabelProviderContribution implements LabelProviderContribution {
    canHandle(element: object): number {
        // @ts-ignore
        return (isCustomFile(element.uri ?? element))
            ? Number.MAX_SAFE_INTEGER
            : 0;
    }

    getIcon(element: object): string {
        // @ts-ignore
        const uri = element.uri ?? element;

        return compareFileTypes(uri, fileType => fileType.icon, '') as string;
    }

    getName(element: object): string {
        // @ts-ignore
        const uri = (element.uri ?? element);
        const defaultName = uri.path.base ?? '';

        return compareFileTypes(uri, fileType => fileType.name ?? defaultName, defaultName) as string;
    }
}

function isCustomFile(uri: URI): boolean {
    return compareFileTypes(uri, () => true, false) as boolean;
}

function compareFileTypes(
    uri: URI,
    cb: (fileType: FileType) => boolean | string,
    fb: boolean | string,
): boolean | string {
    if (uri && uri.path) {
        for (const fileType of FILE_TYPES) {
            if ((uri.path.base && fileType.base === uri.path.base) ||
                (uri.path.ext && fileType.ext === uri.path.ext)) {
                return cb(fileType);
            }
        }
    }

    return fb;
}
