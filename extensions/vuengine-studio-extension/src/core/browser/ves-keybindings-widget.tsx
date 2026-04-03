import { codicon } from '@theia/core/lib/browser';
import { inject, injectable } from '@theia/core/shared/inversify';
import { KeybindingWidget } from '@theia/keymaps/lib/browser/keybindings-widget';
import { WorkspaceService } from '@theia/workspace/lib/browser';

// override to allow querying through OPEN_KEYMAPS command parameter
@injectable()
export class VesKeybindingWidget extends KeybindingWidget {
    @inject(WorkspaceService)
    protected readonly workspaceService: WorkspaceService;

    protected init(): void {
        super.init();

        this.title.iconClass = codicon('record-keys');
        this.title.closable = false;

        this.doInit();
    }

    protected async doInit(): Promise<void> {
        await this.workspaceService.ready;
        this.title.closable = !this.workspaceService.opened;
    }

    search(query: string): void {
        const searchField = this.findSearchField();
        if (searchField) {
            searchField.value = query;
            this.searchKeybindings();
        }
    }
}
