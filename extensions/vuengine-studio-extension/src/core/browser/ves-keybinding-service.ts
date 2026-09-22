import { Command, nls } from '@theia/core';
import { KeybindingRegistry } from '@theia/core/lib/browser';
import { KeybindingScope, ScopedKeybinding } from '@theia/core/lib/browser/keybinding';
import { Keybinding } from '@theia/core/lib/common/keybinding';
import { inject, injectable } from '@theia/core/shared/inversify';
import { KeymapsService } from '@theia/keymaps/lib/browser';
import { isValidKeybinding, VesCaptureKeybindingDialog } from './ves-capture-keybinding-dialog';

export const VesKeymapsServiceProvider = Symbol('VesKeymapsServiceProvider');
export type VesKeymapsServiceProvider = () => KeymapsService;

@injectable()
export class VesKeybindingService {
  @inject(KeybindingRegistry)
  protected readonly keybindingRegistry!: KeybindingRegistry;
  @inject(VesKeymapsServiceProvider)
  protected readonly keymapsServiceProvider!: VesKeymapsServiceProvider;

  getKeybindingLabel(
    commandId: string,
    wrapInBrackets: boolean = false
  ): string {
    const keybindings = this.keybindingRegistry.getKeybindingsForCommand(commandId);
    const keybindingAccelerators: string[] = [];
    keybindings.forEach(k => {
      if (k) {
        keybindingAccelerators.push(
          this.keybindingRegistry.acceleratorFor(k, '').join(', ')
            .replace(/\s/, nls.localize('vuengine/general/space', 'Space'))
            .replace(/\+/, nls.localize('vuengine/general/plus', 'Plus'))
        );
      }
    });

    let keybindingAccelerator = keybindingAccelerators.join(` ${nls.localize('vuengine/general/or', 'or')} `);
    if (wrapInBrackets && keybindingAccelerator !== '') {
      keybindingAccelerator = ` (${keybindingAccelerator})`;
    }

    return keybindingAccelerator;
  }

  async captureKeybinding(command: Command, when?: string): Promise<boolean> {
    const existing = this.keybindingRegistry.getKeybindingsForCommand(command.id);
    // Either button changes the mappings without closing the dialog, so a
    // caller showing them has to redraw even when no key was captured.
    let changed = false;

    const dialog = new VesCaptureKeybindingDialog({
      title: command.category ? `${command.category}: ${command.label}` : `${command.label}`,
      maxWidth: 400,
      initialValue: '',
      validate: value => isValidKeybinding(value)
        ? ''
        : nls.localizeByDefault('Enter a valid keybinding.'),
      currentMappings: () => this.getKeybindingLabel(command.id),
      clearAll: async () => {
        await this.clearKeybindings(command.id);
        changed = true;
      },
      resetToDefault: async () => {
        await this.keymapsServiceProvider().removeKeybinding(command.id);
        changed = true;
      },
    });

    const keybinding = await dialog.open();
    if (keybinding && isValidKeybinding(keybinding)) {
      await this.addKeybinding(command, keybinding, when ?? this.contextOf(existing));
      return true;
    }
    return changed;
  }

  protected async addKeybinding(command: Command, keybinding: string, when?: string): Promise<void> {
    const keymaps = this.keymapsServiceProvider();
    const sameKey = (candidate: Keybinding): boolean =>
      candidate.keybinding === keybinding && (candidate.when || undefined) === (when || undefined);

    const disabling = this.keybindingRegistry.getKeybindingsByScope(KeybindingScope.USER)
      .filter(candidate => candidate.command === `-${command.id}` && sameKey(candidate));
    for (const entry of disabling) {
      await keymaps.unsetKeybinding(entry);
    }

    const covered = this.keybindingRegistry.getKeybindingsForCommand(command.id).some(sameKey);
    if (!covered) {
      await keymaps.setKeybinding({ command: command.id, keybinding, when }, undefined);
    }
  }

  protected contextOf(keybindings: ScopedKeybinding[]): string | undefined {
    const defaults = keybindings.filter(keybinding => keybinding.scope === KeybindingScope.DEFAULT);
    return (defaults[0] ?? keybindings[0])?.when;
  }

  async promptForKeybinding(title: string, currentMappings?: () => string): Promise<string | undefined> {
    const dialog = new VesCaptureKeybindingDialog({
      title,
      maxWidth: 400,
      initialValue: '',
      validate: value => isValidKeybinding(value)
        ? ''
        : nls.localizeByDefault('Enter a valid keybinding.'),
      currentMappings,
    });

    const keybinding = await dialog.open();
    return keybinding && isValidKeybinding(keybinding) ? keybinding : undefined;
  }

  async addKeybindingFor(commandId: string, keybinding: string, when?: string): Promise<void> {
    await this.addKeybinding(
      { id: commandId },
      keybinding,
      when ?? this.contextOf(this.keybindingRegistry.getKeybindingsForCommand(commandId))
    );
  }

  async replaceKeybindingsFor(commandId: string, keybindings: string[], when?: string): Promise<void> {
    const context = when ?? this.contextOf(this.keybindingRegistry.getKeybindingsForCommand(commandId));
    await this.clearKeybindings(commandId);
    for (const keybinding of keybindings) {
      await this.addKeybinding({ id: commandId }, keybinding, context);
    }
  }

  async clearKeybindingsFor(commandId: string): Promise<void> {
    await this.clearKeybindings(commandId);
  }

  async resetKeybindingsFor(commandId: string): Promise<void> {
    await this.keymapsServiceProvider().removeKeybinding(commandId);
  }

  protected async clearKeybindings(commandId: string): Promise<void> {
    await this.keymapsServiceProvider().removeKeybinding(commandId);
    const defaults = this.keybindingRegistry.getKeybindingsForCommand(commandId)
      .filter(keybinding => keybinding.scope === KeybindingScope.DEFAULT);
    for (const keybinding of defaults) {
      await this.keymapsServiceProvider().unsetKeybinding(keybinding);
    }
  }
}
