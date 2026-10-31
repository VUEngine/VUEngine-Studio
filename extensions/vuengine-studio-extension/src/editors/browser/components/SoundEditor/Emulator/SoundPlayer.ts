import { Sim } from 'vueport-core/lib/browser/core/vb-core';
import { SoundData } from '../SoundEditorTypes';
import { PlayerRomInfo, serializeSoundSpec, SoundSpecOptions } from './soundSpecSerializer';

// see the player ROM's PlayerInterface.h
const PLAYER_READY = 0x59444552;
export const PLAYER_FLAG_MINI_VISUALIZER = 1 << 0;

enum PlayerCommand {
    Play = 1,
    Pause = 2,
    Resume = 3,
    Stop = 4,
    SetTimer = 5,
}

export enum PlayerState {
    Idle = 0,
    Playing = 1,
    Paused = 2,
}

// offsets in the mailbox. The player writes the first part, the editor writes commands to slots, each after its sequence modulo
// the number of slots, and then the sequence, so that the player sees whole commands only
const MAILBOX_PLAYER_PART_SIZE = 16;
const MAILBOX_SEQUENCE = 16;
const MAILBOX_COMMANDS = 20;
const COMMAND_SLOTS = 8;
const COMMAND_SIZE = 24;
const SLOT_WAIT_TIMEOUT_MS = 1000;

const VB_CART_RAM_BASE = 0x06000000;
const READY_POLL_MS = 20;
const READY_TIMEOUT_MS = 5000;

export interface PlayerStatus {
    acknowledged: number
    totalElapsedTicks: number
    state: PlayerState
}

export interface TimerConfiguration {
    // __TIMER_100US (0) or __TIMER_20US (0x10)
    resolution: number
    targetTimePerInterrupt: number
    // kUS (0) or kMS (1)
    targetTimePerInterruptUnits: number
}

// Drives a simulation that runs the sound player ROM, which never gets rebuilt. Sounds get written to the simulation's SRAM, in turns
// to one of two buffers, so that the one the playing sound reads from does not change until the player has switched to the other.
export class SoundPlayer {
    protected sequence = 0;
    // the buffer each play command's sound got written to, to know which one the player uses
    protected plays: { sequence: number, buffer: number }[] = [];
    protected soundSpecAddress = 0;
    protected flags = 0;
    // operations run one after another, as each takes several round trips to the emulator
    protected queue: Promise<unknown> = Promise.resolve();
    protected readonly buffers: number[];
    protected readonly bufferSize: number;

    constructor(
        readonly sim: Sim,
        readonly info: PlayerRomInfo,
        sramSize: number
    ) {
        const dataStart = Math.ceil(info.dataAddress / 16) * 16;
        this.bufferSize = Math.floor((VB_CART_RAM_BASE + sramSize - dataStart) / 2 / 16) * 16;
        this.buffers = [dataStart, dataStart + this.bufferSize];
    }

    // loads the player ROM into the simulation, which then needs to run until the player is ready
    static async load(sim: Sim, rom: ArrayBuffer, info: PlayerRomInfo, sramSize: number): Promise<SoundPlayer> {
        await sim.setCartRom(rom.slice(0));
        await sim.setCartRam(new ArrayBuffer(sramSize));
        await sim.reset();

        return new SoundPlayer(sim, info, sramSize);
    }

    async waitUntilReady(): Promise<boolean> {
        const started = Date.now();
        while (Date.now() - started < READY_TIMEOUT_MS) {
            const ready = new DataView(await this.sim.readMemory(this.info.mailboxAddress, 4)).getUint32(0, true);
            if (ready === PLAYER_READY) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, READY_POLL_MS));
        }

        return false;
    }

    async readStatus(): Promise<PlayerStatus> {
        const view = new DataView(await this.sim.readMemory(this.info.mailboxAddress, MAILBOX_PLAYER_PART_SIZE));
        return {
            acknowledged: view.getUint32(4, true),
            totalElapsedTicks: view.getUint32(8, true),
            state: view.getUint32(12, true),
        };
    }

    // writes the sound and plays it from the given tick, replacing the one that is playing
    play(soundData: SoundData, options: SoundSpecOptions, startTick: number, flags: number): Promise<void> {
        return this.enqueue(async () => {
            const { acknowledged } = await this.readStatus();
            // the player reads from the buffer of the last play it has carried out
            const playInUse = [...this.plays].reverse().find(p => p.sequence <= acknowledged);
            const buffer = playInUse?.buffer === 0 ? 1 : 0;

            const spec = serializeSoundSpec(soundData, this.info, this.buffers[buffer], options);
            if (spec.data.length > this.bufferSize) {
                throw new Error(`The sound needs ${spec.data.length} bytes, but the player only has room for ${this.bufferSize}.`);
            }
            await this.sim.writeMemory(this.buffers[buffer], spec.data.slice().buffer);

            this.soundSpecAddress = spec.soundSpecAddress;
            this.flags = flags;
            await this.send(PlayerCommand.Play, startTick);
            this.plays = [
                ...(playInUse ? [playInUse] : []),
                ...this.plays.filter(p => p.sequence > acknowledged),
                { sequence: this.sequence, buffer },
            ];
        });
    }

    // plays the sound that was written last from another tick
    seek(startTick: number): Promise<void> {
        return this.enqueue(() => this.send(PlayerCommand.Play, startTick));
    }

    pause(): Promise<void> {
        return this.enqueue(() => this.send(PlayerCommand.Pause));
    }

    resume(): Promise<void> {
        return this.enqueue(() => this.send(PlayerCommand.Resume));
    }

    stop(): Promise<void> {
        return this.enqueue(() => this.send(PlayerCommand.Stop));
    }

    // the sound that is playing continues at its position
    setTimer(timerConfiguration: TimerConfiguration): Promise<void> {
        return this.enqueue(() => this.send(PlayerCommand.SetTimer, 0, timerConfiguration));
    }

    protected enqueue<T>(operation: () => Promise<T>): Promise<T> {
        // one failing operation must not keep the ones after it from running
        const next = this.queue.then(operation, operation);
        this.queue = next.catch(() => undefined);
        return next;
    }

    protected async send(command: PlayerCommand, startTick: number = 0, timerConfiguration?: TimerConfiguration): Promise<void> {
        const sequence = this.sequence + 1;

        // all slots holding commands the player has yet to carry out only happens while the simulations are suspended for long,
        // after a while the oldest one gets overwritten
        const started = Date.now();
        while (sequence - (await this.readStatus()).acknowledged > COMMAND_SLOTS && Date.now() - started < SLOT_WAIT_TIMEOUT_MS) {
            await new Promise(resolve => setTimeout(resolve, READY_POLL_MS));
        }

        const slot = new ArrayBuffer(COMMAND_SIZE);
        const view = new DataView(slot);
        view.setUint32(0, command, true);
        view.setUint32(4, this.soundSpecAddress, true);
        view.setUint32(8, startTick, true);
        view.setUint32(12, this.flags, true);
        if (timerConfiguration) {
            view.setUint16(16, timerConfiguration.resolution, true);
            view.setUint16(18, timerConfiguration.targetTimePerInterrupt, true);
            view.setUint16(20, timerConfiguration.targetTimePerInterruptUnits, true);
        }
        await this.sim.writeMemory(this.info.mailboxAddress + MAILBOX_COMMANDS + (sequence % COMMAND_SLOTS) * COMMAND_SIZE, slot);

        const sequenceBytes = new ArrayBuffer(4);
        new DataView(sequenceBytes).setUint32(0, sequence, true);
        await this.sim.writeMemory(this.info.mailboxAddress + MAILBOX_SEQUENCE, sequenceBytes);
        this.sequence = sequence;
    }
}
