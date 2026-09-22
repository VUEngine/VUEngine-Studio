import { Disposable, DisposableCollection, nls } from '@theia/core';
import { KeyCode, KeySequence, SingleTextInputDialog, SingleTextInputDialogProps } from '@theia/core/lib/browser';
import { Message } from '@theia/core/shared/@lumino/messaging';

const CHORD_TIMEOUT = 2000;

export interface VesCaptureKeybindingDialogProps extends SingleTextInputDialogProps {
    clearAll?: () => Promise<void>;
    resetToDefault?: () => Promise<void>;
    currentMappings?: () => string;
}

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

        if (this.clearButton && this.captureProps.clearAll) {
            this.addEventListener(this.clearButton, 'click', () => this.act(this.captureProps.clearAll!));
        }
        if (this.resetButton && this.captureProps.resetToDefault) {
            this.addEventListener(this.resetButton, 'click', () => this.act(this.captureProps.resetToDefault!));
        }

        window.addEventListener('keydown', this.captureKeyDown, { capture: true });
        this.keystrokes.push(Disposable.create(() =>
            window.removeEventListener('keydown', this.captureKeyDown, { capture: true })
        ));

        this.inputField.placeholder = nls.localizeByDefault('Press desired key combination and then press ENTER.');
        this.updatePreview();
        this.updateCurrent();
    }

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
        if (event.key === 'Enter' || event.key === 'Escape') {
            return;
        }
        event.preventDefault();
        event.stopPropagation();

        const keyCode = KeyCode.createKeyCode(event);
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

        this.inputField.dispatchEvent(new Event('input', { bubbles: true }));
        this.updatePreview();
    };

    protected clearChordTimeout(): void {
        if (this.chordTimeout !== undefined) {
            window.clearTimeout(this.chordTimeout);
            this.chordTimeout = undefined;
        }
    }

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
