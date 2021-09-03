import { injectable } from '@theia/core/shared/inversify';
import { DebugPrefixConfiguration } from '@theia/debug/lib/browser/debug-prefix-configuration';

@injectable()
export class VesDebugPrefixConfiguration extends DebugPrefixConfiguration {
    isEnabled(): boolean {
        return false;
    }
}
