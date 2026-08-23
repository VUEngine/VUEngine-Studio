import { nls } from '@theia/core';
import { BUILT_IN_RUMBLE_EFFECTS } from '../../editors/browser/components/RumbleEffectEditor/RumbleEffectTypes';

export const RUMBLE_CMD = {
  STOP: 0x00,
  MIN_EFFECT: 0x01,
  MAX_EFFECT: 0x7b,
  PLAY: 0x7c,
  CHAIN_EFFECT_0: 0x80,
  CHAIN_EFFECT_4: 0x84,
  OVERDRIVE: 0xa0,
  SUSTAIN_POS: 0xa1,
  SUSTAIN_NEG: 0xa2,
  BREAK: 0xa3,
  WRITE_EFFECT_CHAIN: 0xb0,
  WRITE_EFFECT_LOOPS_CHAIN: 0xb1,
  EFFECT_CHAIN_END: 0xff,
} as const;

export const RUMBLE_CMD_FREQUENCIES: Record<number, number> = {
  0x87: 50,
  0x88: 95,
  0x89: 130,
  0x90: 160,
  0x91: 240,
  0x92: 320,
  0x93: 400,
};

// commands that are followed by a value byte
const VALUE_COMMANDS: Record<number, string> = {
  [RUMBLE_CMD.OVERDRIVE]: nls.localize('vuengine/editors/rumbleEffect/overdrive', 'Overdrive'),
  [RUMBLE_CMD.SUSTAIN_POS]: nls.localize('vuengine/editors/rumbleEffect/sustainPos', 'Sustain (Pos.)'),
  [RUMBLE_CMD.SUSTAIN_NEG]: nls.localize('vuengine/editors/rumbleEffect/sustainNeg', 'Sustain (Neg.)'),
  [RUMBLE_CMD.BREAK]: nls.localize('vuengine/editors/rumbleEffect/break', 'Break'),
};

// The effect configuration a stream of command bytes adds up to
export interface RumbleState {
  effect?: number;
  frequency?: number;
  overdrive?: number;
  sustainPositive?: number;
  sustainNegative?: number;
  breaking?: number;
  playing?: boolean;
  chain?: number;
}

export interface EmulatedRumbleSpec {
    address: number;
    // Only set when a symbol covers the address
    name?: string;
}

// A decoded command
export interface RumbleCommand {
  bytes: number[];
  label: string;
  // true for a byte that means nothing in this protocol
  unknown?: boolean;
}

export function getRumbleEffectName(effect: number): string {
  return BUILT_IN_RUMBLE_EFFECTS[effect - 1]?.trim() ?? `${effect}`;
}

// Turns the byte stream a game sends back into the effect it describes
export class RumbleStreamDecoder {
  protected pending: number | undefined;

  state: RumbleState = {};

  reset(): void {
    this.pending = undefined;
    this.state = {};
  }

  push(byte: number): RumbleCommand | undefined {
    if (this.pending !== undefined) {
      const command = this.pending;
      this.pending = undefined;
      return this.applyValue(command, byte);
    }

    if (VALUE_COMMANDS[byte] !== undefined) {
      this.pending = byte;
      return undefined;
    }

    if (byte === RUMBLE_CMD.STOP) {
      this.state.playing = false;
      return { bytes: [byte], label: nls.localize('vuengine/editors/rumbleEffect/stop', 'Stop') };
    }

    if (byte === RUMBLE_CMD.PLAY) {
      this.state.playing = true;
      return { bytes: [byte], label: nls.localize('vuengine/editors/rumbleEffect/play', 'Play') };
    }

    if (byte >= RUMBLE_CMD.MIN_EFFECT && byte <= RUMBLE_CMD.MAX_EFFECT) {
      this.state.effect = byte;
      return {
        bytes: [byte],
        label: `${nls.localize('vuengine/editors/rumbleEffect/effect', 'Effect')}: ${getRumbleEffectName(byte)}`,
      };
    }

    const frequency = RUMBLE_CMD_FREQUENCIES[byte];
    if (frequency !== undefined) {
      this.state.frequency = frequency;
      return {
        bytes: [byte],
        label: `${nls.localize('vuengine/editors/rumbleEffect/frequency', 'Frequency')}: ${frequency} Hz`,
      };
    }

    if (byte >= RUMBLE_CMD.CHAIN_EFFECT_0 && byte <= RUMBLE_CMD.CHAIN_EFFECT_4) {
      this.state.chain = byte - RUMBLE_CMD.CHAIN_EFFECT_0;
      return {
        bytes: [byte],
        label: nls.localize('vuengine/editors/rumbleEffect/chainEffect', 'Chain Effect {0}', this.state.chain),
      };
    }

    if (byte === RUMBLE_CMD.WRITE_EFFECT_CHAIN || byte === RUMBLE_CMD.WRITE_EFFECT_LOOPS_CHAIN) {
      return {
        bytes: [byte],
        label: nls.localize('vuengine/editors/rumbleEffect/writeEffectChain', 'Write Effect Chain'),
      };
    }

    if (byte === RUMBLE_CMD.EFFECT_CHAIN_END) {
      return {
        bytes: [byte],
        label: nls.localize('vuengine/editors/rumbleEffect/effectChainEnd', 'End of Effect Chain'),
      };
    }

    return {
      bytes: [byte],
      label: nls.localize('vuengine/editors/rumbleEffect/unknownCommand', 'Unknown command'),
      unknown: true,
    };
  }

  protected applyValue(command: number, value: number): RumbleCommand {
    switch (command) {
      case RUMBLE_CMD.OVERDRIVE:
        this.state.overdrive = value;
        break;
      case RUMBLE_CMD.SUSTAIN_POS:
        this.state.sustainPositive = value;
        break;
      case RUMBLE_CMD.SUSTAIN_NEG:
        this.state.sustainNegative = value;
        break;
      case RUMBLE_CMD.BREAK:
        this.state.breaking = value;
        break;
    }
    return { bytes: [command, value], label: `${VALUE_COMMANDS[command]}: ${value}` };
  }
}
