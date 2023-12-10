import { Disposable } from '@theia/core';
import { EncodingOverride, EncodingRegistry } from '@theia/core/lib/browser/encoding-registry';
import URI from '@theia/core/lib/common/uri';
import { injectable } from '@theia/core/shared/inversify';

export interface VesEncodingOverride extends EncodingOverride {
    filename?: string;
    endsWith?: string;
}

@injectable()
export class VesEncodingRegistry extends EncodingRegistry {
    protected readonly encodingOverrides: VesEncodingOverride[] = [];

    registerOverride(override: VesEncodingOverride): Disposable {
        return super.registerOverride(override);
    }

    protected getEncodingOverride(resource: URI): string | undefined {
        if (this.encodingOverrides && this.encodingOverrides.length) {
            for (const override of this.encodingOverrides) {
                if (override.endsWith && resource.path.toString().endsWith(override.endsWith)) {
                    return override.encoding;
                }
                if (override.filename && resource.path.base === override.filename) {
                    return override.encoding;
                }
            }
        }

        return super.getEncodingOverride(resource);
    }
}
