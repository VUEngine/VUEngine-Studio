import { injectable } from '@theia/core/shared/inversify';
import { KeybindingWidget } from '@theia/keymaps/lib/browser/keybindings-widget';

// override to allow querying through OPEN_KEYMAPS command parameter
@injectable()
export class VesKeybindingWidget extends KeybindingWidget {
    search(query: string): void {
        const searchField = this.findSearchField();
        if (searchField) {
            searchField.value = query;
            this.searchKeybindings();
        }
    }
}
