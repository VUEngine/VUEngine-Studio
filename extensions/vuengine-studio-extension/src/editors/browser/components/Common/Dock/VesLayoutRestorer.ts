import { ShellLayoutRestorer } from '@theia/core/lib/browser';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class VesEditorsLayoutRestorer extends ShellLayoutRestorer {
    protected storageKey = 'ves-layout';
}
