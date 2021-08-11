import { injectable } from '@theia/core/shared/inversify';
import URI from '@theia/core/lib/common/uri';
import { LabelProviderContribution } from '@theia/core/lib/browser';

interface FileType {
    base?: string;
    ext?: string;
    icon: string;
    name?: string;
};

const FILE_TYPES: FileType[] = [{
    base: 'Compiler.config',
    icon: 'ves-file-icon fa fa-cog medium-blue',
    name: 'Compiler Config',
}, {
    base: 'Engine.config',
    icon: 'ves-file-icon fa fa-cog medium-blue',
    name: 'Engine Config',
}, {
    base: 'Project.config',
    icon: 'ves-file-icon fa fa-cog medium-blue',
    name: 'Project Config',
}, {
    ext: '.vb',
    icon: 'ves-file-icon fa fa-play',
}];

@injectable()
export class VesBrandingLabelProviderContribution implements LabelProviderContribution {
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
