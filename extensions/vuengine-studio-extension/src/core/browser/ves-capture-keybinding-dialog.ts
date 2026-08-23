import { Disposable, DisposableCollection, nls } from '@theia/core';
import { KeyCode, KeySequence, SingleTextInputDialog, SingleTextInputDialogProps } from '@theia/core/lib/browser';
import { Message } from '@theia/core/shared/@lumino/messaging';
import { KeymapsService } from '@theia/keymaps/lib/browser';

/**
 * A `KeymapsService` fetched on demand rather than injected.
 *
 * Injecting it into VesCommonService is not possible: that service is a
 * dependency of most of this application, and `KeymapsService` pulls in Monaco
 * and the opener service, which close the loop back to it — a cycle inversify
 * expands until the renderer runs out of heap rather than reporting. Behind a
 * `toDynamicValue` binding the planner sees a leaf, and the service is only
 * built when someone actually asks to change a key mapping, by which time the
 * container is complete.
 */
export const VesKeymapsServiceProvider = Symbol('VesKeymapsServiceProvider');
export type VesKeymapsServiceProvider = () => KeymapsService;

/** How long a second keystroke still counts as the tail of a chord. */
const CHORD_TIMEOUT = 2000;

export interface VesCaptureKeybindingDialogProps extends SingleTextInputDialogProps {
    /** Runs when the user asks for every existing mapping to be dropped. */
    clearAll?: () => Promise<void>;
    /** Runs when the user asks for the application's own mappings back. */
    resetToDefault?: () => Promise<void>;
    /** What the command answers to right now, shown so the two buttons above have visible effect. */
    currentMappings?: () => string;
}

/**
 * "Press desired key combination and then press ENTER."
 *
 * A keystroke is captured rather than typed: the field shows what was pressed,
 * as the keybinding string a keymap file holds, and two keystrokes within
 * CHORD_TIMEOUT of each other are read as a chord. The same approach — and,
 * deliberately, the same wording — as Theia's own keybinding editor, so the
 * two feel like one thing.
 *
 * What the dialog returns is only the key sequence; whoever opened it decides
 * what to do with it, which is what lets the button assignments *add* a
 * mapping rather than replace one. Clearing and resetting are the exceptions:
 * they act immediately, since there is nothing to hand back — but they leave
 * the dialog open, so that a mapping can be cleared and a new one captured
 * without reopening it. What the command currently answers to is shown above
 * them, which is where the effect of either one shows.
 */
export class VesCaptureKeybindingDialog extends SingleTextInputDialog {

    protected readonly keystrokes = new DisposableCollection();
    protected chordPrefix: string | undefined;
    protected chordTimeout: number | undefined;
    protected clearButton: HTMLButtonElement | undefined;
    protected resetButton: HTMLButtonElement | undefined;
    protected preview: HTMLDivElement;
    protected current: HTMLDivElement;

    constructor(protected readonly captureProps: VesCaptureKeybindingDialogProps) {
        super(captureProps);

        // Below the field rather than in it: the field holds what a keymap
        // would, `ctrl+shift+p`, and this is the same thing as the keys are
        // actually labelled on this machine.
        this.preview = document.createElement('div');
        this.preview.classList.add('ves-capture-keybinding-preview');
        this.contentNode.appendChild(this.preview);

        this.current = document.createElement('div');
        this.current.classList.add('ves-capture-keybinding-current');
        this.contentNode.appendChild(this.current);

        if (this.captureProps.clearAll) {
            this.clearButton = this.createButton(
                nls.localize('vuengine/general/clearAllMappings', 'Clear All Mappings')
            );
            this.clearButton.classList.add('secondary');
            this.controlPanel.insertBefore(this.clearButton, this.acceptButton!);
        }
        if (this.captureProps.resetToDefault) {
            this.resetButton = this.createButton(
                nls.localize('vuengine/general/resetToDefault', 'Reset to Default')
            );
            this.resetButton.classList.add('secondary');
            this.controlPanel.insertBefore(this.resetButton, this.acceptButton!);
        }
    }

    protected onAfterAttach(msg: Message): void {
        super.onAfterAttach(msg);

        // Neither of these closes the dialog: the point of them is to make
        // room for the mapping the user is about to capture.
        if (this.clearButton && this.captureProps.clearAll) {
            this.addEventListener(this.clearButton, 'click', () => this.act(this.captureProps.clearAll!));
        }
        if (this.resetButton && this.captureProps.resetToDefault) {
            this.addEventListener(this.resetButton, 'click', () => this.act(this.captureProps.resetToDefault!));
        }

        // On the window, in the capture phase, because the field must never
        // see the keystroke itself: every key here is a mapping to record, not
        // text to type.
        window.addEventListener('keydown', this.captureKeyDown, { capture: true });
        this.keystrokes.push(Disposable.create(() =>
            window.removeEventListener('keydown', this.captureKeyDown, { capture: true })
        ));

        this.inputField.placeholder = nls.localizeByDefault('Press desired key combination and then press ENTER.');
        this.updatePreview();
        this.updateCurrent();
    }

    /** Run one of the two buttons' actions and show what it did. */
    protected async act(action: () => Promise<void>): Promise<void> {
        await action();
        this.updateCurrent();
        this.inputField.focus();
    }

    protected updateCurrent(): void {
        const mappings = this.captureProps.currentMappings?.() ?? '';
        this.current.textContent = mappings.length > 0
            ? nls.localize('vuengine/general/currentlyMappedTo', 'Currently mapped to: {0}', mappings)
            : nls.localize('vuengine/general/currentlyUnmapped', 'Currently not mapped to any key.');
    }

    protected onBeforeDetach(msg: Message): void {
        this.clearChordTimeout();
        this.keystrokes.dispose();
        super.onBeforeDetach(msg);
    }

    protected readonly captureKeyDown = (event: KeyboardEvent): void => {
        if (event.target !== this.inputField) {
            return;
        }
        // The two that work the dialog rather than being recorded by it.
        if (event.key === 'Enter' || event.key === 'Escape') {
            return;
        }
        event.preventDefault();
        event.stopPropagation();

        const keyCode = KeyCode.createKeyCode(event);
        // A modifier on its own is the first half of a keystroke, not one.
        if (keyCode.isModifierOnly()) {
            return;
        }

        const keystroke = keyCode.toString();
        if (this.chordPrefix) {
            this.inputField.value = `${this.chordPrefix} ${keystroke}`;
            this.chordPrefix = undefined;
            this.clearChordTimeout();
        } else {
            this.inputField.value = keystroke;
            this.chordPrefix = keystroke;
            this.clearChordTimeout();
            this.chordTimeout = window.setTimeout(() => {
                this.chordPrefix = undefined;
                this.chordTimeout = undefined;
            }, CHORD_TIMEOUT);
        }

        // What the dialog's own validation and accept button listen for.
        this.inputField.dispatchEvent(new Event('input', { bubbles: true }));
        this.updatePreview();
    };

    protected clearChordTimeout(): void {
        if (this.chordTimeout !== undefined) {
            window.clearTimeout(this.chordTimeout);
            this.chordTimeout = undefined;
        }
    }

    /** The captured sequence as the keys are labelled on this machine. */
    protected updatePreview(): void {
        this.preview.textContent = VesCaptureKeybindingDialog.previewOf(this.inputField.value);
    }

    protected static previewOf(value: string): string {
        try {
            return value.trim().length === 0
                ? ''
                : KeySequence.parse(value).map(code => code.toString()).join(' ');
        } catch {
            return '';
        }
    }
}

export function isValidKeybinding(value: string): boolean {
    try {
        const sequence = KeySequence.parse(value.trim());
        return sequence.length > 0 && sequence.every(keyCode => !keyCode.isModifierOnly());
    } catch {
        return false;
    }
}
