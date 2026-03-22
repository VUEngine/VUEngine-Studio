import { InitialWindowTitleParts, WindowTitleService } from '@theia/core/lib/browser/window/window-title-service';
import { injectable } from '@theia/core/shared/inversify';

@injectable()
export class VesWindowTitleService extends WindowTitleService {
    protected titleParts = new Map<string, string | undefined>(Object.entries({
        ...InitialWindowTitleParts,
        projectName: undefined
    }));
}
