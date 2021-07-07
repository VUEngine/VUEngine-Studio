import { injectable } from 'inversify';
import { PreferenceConfigurations } from '@theia/core/lib/browser/preferences/preference-configurations';

@injectable()
export class VesPreferenceConfigurations extends PreferenceConfigurations {
    getPaths(): string[] {
        const paths = super.getPaths();
        paths.unshift('.vuengine-studio')
        return paths;
    }
}
