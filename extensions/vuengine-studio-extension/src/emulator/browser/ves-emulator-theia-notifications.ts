import { MessageService } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import { VueportNotifications, VueportProgress } from 'vueport-core/lib/common/emulator-host';

/** The studio's side of {@link VueportNotifications}. */
export class VesEmulatorTheiaNotifications implements VueportNotifications {

    constructor(protected readonly messageService: MessageService) { }

    info(text: string): void {
        this.messageService.info(text);
    }

    warn(text: string): void {
        this.messageService.warn(text);
    }

    error(text: string): void {
        this.messageService.error(text);
    }

    async confirm(options: {
        title: string,
        message: string | string[],
        okLabel?: string,
    }): Promise<boolean> {
        const dialog = new ConfirmDialog({
            title: options.title,
            msg: Array.isArray(options.message)
                ? this.paragraphs(options.message)
                : options.message,
            ok: options.okLabel,
        });
        return !!await dialog.open();
    }

    /** Several paragraphs, as the one element ConfirmDialog takes. */
    protected paragraphs(lines: string[]): HTMLElement {
        const wrapper = document.createElement('div');
        for (const line of lines) {
            const node = document.createElement('p');
            node.textContent = line;
            wrapper.appendChild(node);
        }
        return wrapper;
    }

    async progress(text: string): Promise<VueportProgress> {
        return this.messageService.showProgress({ text });
    }
}
