import { Command } from '@theia/core';
import { KeybindingRegistry } from '@theia/core/lib/browser';
import { Key, KeyCode } from '@theia/core/lib/common/keys';
import * as React from 'react';
import { VesKeybindingService } from '../../core/browser/ves-keybinding-service';
import {
    EMULATOR_ACTION_COMMANDS,
    EMULATOR_GAMEPAD_BUTTONS,
    EMULATOR_GAMEPAD_INPUTS,
} from 'vueport-core/lib/browser/emulator-commands';
import { VueportBindableCommand, VueportInputBindings } from 'vueport-core/lib/common/emulator-settings';

function bindableCommandIds(): string[] {
    const ids = Object.values(EMULATOR_ACTION_COMMANDS).map(command => command.id);
    for (const button of EMULATOR_GAMEPAD_BUTTONS) {
        const input = EMULATOR_GAMEPAD_INPUTS[button];
        ids.push(input.command.id, input.player2.id);
    }
    return ids;
}

export class VesEmulatorBindings implements VueportInputBindings {

    constructor(
        protected readonly vesKeybindingService: VesKeybindingService,
        protected readonly keybindingRegistry: KeybindingRegistry,
    ) { }

    protected writing: Promise<void> = Promise.resolve();

    protected enqueue(write: () => Promise<void>): Promise<void> {
        this.writing = this.writing.catch(() => undefined).then(write);
        return this.writing;
    }

    label(commandId: string, compact: boolean): string {
        return this.vesKeybindingService.getKeybindingLabel(commandId, compact);
    }

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

    async capture(command: VueportBindableCommand, when?: string, title?: React.ReactNode): Promise<boolean> {
        const named = typeof title === 'string'
            ? { ...command, category: undefined, label: title }
            : command;
        return this.vesKeybindingService.captureKeybinding(named as Command, when);
    }

    async captureAll(
        commands: VueportBindableCommand[],
        when: string | undefined,
        title: (command: VueportBindableCommand, step: number, total: number) => React.ReactNode,
        onStep?: (index: number) => void,
    ): Promise<boolean> {
        const collected: [string, string][] = [];
        for (let i = 0; i < commands.length; i++) {
            const command = commands[i];
            onStep?.(i);
            const heading = title(command, i + 1, commands.length);
            const keybinding = await this.vesKeybindingService.promptForKeybinding(
                typeof heading === 'string' ? heading : this.nameOf(command),
                () => this.label(command.id, false),
            );
            if (!keybinding) {
                return false;
            }
            collected.push([command.id, keybinding]);
        }

        await this.enqueue(async () => {
            for (const [commandId, keybinding] of collected) {
                await this.vesKeybindingService.replaceKeybindingsFor(commandId, [keybinding], when);
            }
        });
        return true;
    }

    resetToDefaults(): Promise<void> {
        return this.enqueue(async () => {
            for (const commandId of bindableCommandIds()) {
                await this.vesKeybindingService.resetKeybindingsFor(commandId);
            }
        });
    }

    async bind(commandId: string, code: string): Promise<boolean> {
        const keybinding = keybindingOf(code);
        if (!keybinding) {
            return false;
        }
        let added = false;
        await this.enqueue(async () => {
            if (this.keyCodes(commandId).includes(code)) {
                return;
            }
            await this.vesKeybindingService.addKeybindingFor(commandId, keybinding);
            added = true;
        });
        return added;
    }

    clear(commandId: string): Promise<void> {
        return this.enqueue(() => this.vesKeybindingService.clearKeybindingsFor(commandId));
    }

    resetToDefault(commandId: string): Promise<void> {
        return this.enqueue(() => this.vesKeybindingService.resetKeybindingsFor(commandId));
    }

    replaceAll(codes: Record<string, string>): Promise<void> {
        return this.enqueue(async () => {
            for (const [commandId, code] of Object.entries(codes)) {
                const keybinding = keybindingOf(code);
                if (keybinding) {
                    await this.vesKeybindingService.replaceKeybindingsFor(commandId, [keybinding]);
                }
            }
        });
    }

    protected nameOf(command: VueportBindableCommand): string {
        const label = command.label ?? command.id;
        return command.category ? `${command.category}: ${label}` : label;
    }
}

function keybindingOf(code: string): string | undefined {
    const key = Key.getKey(code);
    return key && new KeyCode({ key }).toString();
}
