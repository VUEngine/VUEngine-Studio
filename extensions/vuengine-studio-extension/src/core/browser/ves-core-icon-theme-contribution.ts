import { injectable } from '@theia/core/shared/inversify';
import { DefaultFileIconThemeContribution } from '@theia/core/lib/browser/icon-theme-contribution';

@injectable()
export class VesDefaultFileIconThemeContribution extends DefaultFileIconThemeContribution {
    // @ts-ignore
    readonly id = 'vuengine-studio-file-icons';
    // @ts-ignore
    readonly label = 'File Icons (VUEngine Studio)';
}
