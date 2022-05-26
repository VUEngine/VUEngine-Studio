import { injectable } from '@theia/core/shared/inversify';
import { PreferenceConfigurations } from '@theia/core/lib/browser/preferences/preference-configurations';

export const VES_PREFERENCE_DIR = '.vuengine';

@injectable()
export class VesPreferenceConfigurations extends PreferenceConfigurations {
    getPaths(): string[] {
        const paths = super.getPaths();
        paths.unshift(VES_PREFERENCE_DIR);
        return paths;
    }
}
