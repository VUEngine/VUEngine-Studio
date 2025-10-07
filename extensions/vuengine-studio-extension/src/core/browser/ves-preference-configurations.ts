import { PreferenceConfigurations } from '@theia/core';
import { injectable } from '@theia/core/shared/inversify';

export const VES_PREFERENCE_DIR = '.vuengine';

@injectable()
export class VesPreferenceConfigurations extends PreferenceConfigurations {
    getPaths(): string[] {
        const paths = super.getPaths();
        paths.unshift(VES_PREFERENCE_DIR);
        return paths;
    }
}
