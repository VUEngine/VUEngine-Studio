import { MessageService, nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import { VueportNotifications, VueportProgress } from 'vueport-core/lib/common/emulator-host';
import { XrHeadsetUi } from 'vueport-core/lib/browser/emulator-xr-controller';

export class VesEmulatorNotifications implements VueportNotifications {
    headset: XrHeadsetUi | undefined;

    constructor(protected readonly messageService: MessageService) { }

    info(text: string): void {
        this.headset?.toast(text, false);
        this.messageService.info(text);
    }

    warn(text: string): void {
        this.headset?.toast(text, false);
        this.messageService.warn(text);
    }

    error(text: string): void {
        this.headset?.toast(text, true);
        this.messageService.error(text);
    }

    async confirm(options: {
        title: string,
        message: string | string[],
        okLabel?: string,
    }): Promise<boolean> {
        if (this.headset) {
            return this.headset.ask(
                options.title,
                Array.isArray(options.message) ? options.message : [options.message],
                options.okLabel ?? nls.localizeByDefault('OK'),
                nls.localizeByDefault('Cancel'),
            );
        }
        const dialog = new ConfirmDialog({
            title: options.title,
            msg: Array.isArray(options.message)
                ? this.paragraphs(options.message)
                : options.message,
            ok: options.okLabel,
        });
        return !!await dialog.open();
    }

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
