import { Command } from '@theia/core';
import { KeybindingRegistry } from '@theia/core/lib/browser';
import { VesCommonService } from '../../core/browser/ves-common-service';
import { VueportBindableCommand, VueportInputBindings } from 'vueport-core/lib/common/emulator-settings';

/**
 * The studio's side of {@link VueportInputBindings}.
 *
 * The studio already has a keymap and a capture dialog, so this is a view onto
 * them rather than a keymap of its own. A standalone host writes the other
 * implementation: its own store, and its own way of asking for a key.
 */
export class VesEmulatorTheiaBindings implements VueportInputBindings {

    constructor(
        protected readonly vesCommonService: VesCommonService,
        protected readonly keybindingRegistry: KeybindingRegistry,
    ) { }

    label(commandId: string, compact: boolean): string {
        return this.vesCommonService.getKeybindingLabel(commandId, compact);
    }

    /**
     * Every code that triggers a command, flattened out of Theia's bindings.
     *
     * `resolved` is filled in lazily by the registry and is missing on a
     * binding it has not got to yet, which is why it is guarded rather than
     * trusted.
     */
    keyCodes(commandId: string): string[] {
        const codes: string[] = [];
        for (const binding of this.keybindingRegistry.getKeybindingsForCommand(commandId)) {
            // @ts-ignore — `resolved` is filled in by the registry but is not
            // on the public type.
            for (const resolved of binding.resolved ?? []) {
                const code = resolved.key?.code;
                if (code) {
                    codes.push(code);
                }
            }
        }
        return codes;
    }

    /**
     * Passed through whole: the dialog titles itself from the command's
     * category and label, so an id alone would leave it unnamed.
     */
    async capture(command: VueportBindableCommand, when?: string): Promise<boolean> {
        return this.vesCommonService.captureKeybinding(command as Command, when);
    }
}
