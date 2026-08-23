import { URI } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { VesEmulatorSession } from '../../../../../emulator/browser/ves-emulator-core-service.js';
import { VB_CART_RAM_BASE } from '../../../../../emulator/common/ves-vb-constants.js';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types.js';
import { SoundData, SUB_NOTE_RESOLUTION, TrackSettings } from '../SoundEditorTypes.js';
import PlayerRomBuilder from './PlayerRomBuilder.js';

const EmulatorContainer = styled.div`
    height: 15px;
    overflow: hidden;
    width: 48px;

    canvas {
        height: 224px;
        image-rendering: pixelated;
        position: relative;
        top: -17px;
        width: 384px;
    }
`;

const PLAYER_POSITION_ADDRESS = VB_CART_RAM_BASE;
const PLAYER_POSITION_BYTES = 4;
const PLAYER_SAVE_RAM_SIZE = 8192;
const POSITION_POLL_MS = 50;

interface EmulatorProps {
    soundData: SoundData
    playing: boolean
    testNote: string
    setEmulatorInitialized: Dispatch<SetStateAction<boolean>>
    emulatorRomReady: boolean
    setEmulatorRomReady: Dispatch<SetStateAction<boolean>>
    currentPlayerPosition: number
    setCurrentPlayerPosition: Dispatch<SetStateAction<number>>
    playRangeStart: number;
    playRangeEnd: number;
    trackSettings: TrackSettings[]
    playerRomBuilder: PlayerRomBuilder
    forcePlayerRomRebuild: number
    playerSeekRequest: number
    setPlaying: Dispatch<SetStateAction<boolean>>
}

export default function Emulator(props: EmulatorProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const {
        soundData,
        playing,
        testNote,
        setEmulatorInitialized,
        emulatorRomReady, setEmulatorRomReady,
        currentPlayerPosition, setCurrentPlayerPosition,
        playRangeStart, playRangeEnd,
        trackSettings,
        playerRomBuilder,
        forcePlayerRomRebuild,
        playerSeekRequest,
        setPlaying,
    } = props;
    const [session, setSession] = useState<VesEmulatorSession>();
    const [soundDataChecksum, setSoundDataChecksum] = useState<string>('');
    const progressTimeout = useRef<NodeJS.Timeout>();
    const reading = useRef(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasAttached = useRef(false);

    const initEmulator = async (): Promise<void> => {
        const newSession = await services.vesEmulatorCoreService.createSession();
        await newSession.sim.setVolume(2);
        setSession(newSession);
        setEmulatorInitialized(true);
    };

    const startTickFor = (position: number): number => {
        const step = playRangeStart > -1 ? playRangeStart : Math.max(0, position);
        return step * SUB_NOTE_RESOLUTION;
    };

    const loadRom = async (romFileUri: URI): Promise<void> => {
        if (!session) {
            return;
        }
        const romFileContent = await services.fileService.readFile(romFileUri);
        await session.sim.setCartRom(romFileContent.value.buffer.slice().buffer);
        const saveRam = new ArrayBuffer(PLAYER_SAVE_RAM_SIZE);
        new DataView(saveRam).setUint32(0, startTickFor(currentPlayerPosition), true);
        await session.sim.setCartRam(saveRam);
        await session.sim.reset();
        await session.core.run();
    };

    // seek to a position in the player ROM by stopping the sim,
    // writing the start position to SRAM, and then restarting
    const seekPlayer = async (position: number): Promise<void> => {
        if (!session || !emulatorRomReady) {
            return;
        }
        const tick = new ArrayBuffer(PLAYER_POSITION_BYTES);
        new DataView(tick).setUint32(0, startTickFor(position), true);

        await session.core.suspend();
        await session.sim.writeMemory(PLAYER_POSITION_ADDRESS, tick);
        await session.sim.reset();
        if (playing) {
            await session.core.run();
        }
    };

    const buildAndPlay = async (): Promise<void> => {
        const romFileUri = await playerRomBuilder.buildSoundPlayerRom(
            soundData, currentPlayerPosition, playRangeStart, playRangeEnd, trackSettings, true
        );
        if (await services.fileService.exists(romFileUri)) {
            await loadRom(romFileUri);
            setEmulatorRomReady(true);
        }
    };

    // Read the elapsed tick count the player has stored in SRAM
    const readCurrentPlayerPosition = async (): Promise<void> => {
        if (!session || reading.current) {
            return;
        }
        reading.current = true;

        let currentElapsedTicks: number;
        try {
            const stored = await session.sim.readMemory(PLAYER_POSITION_ADDRESS, PLAYER_POSITION_BYTES);
            currentElapsedTicks = new DataView(stored).getUint32(0, true);
        } catch {
            // The session can go away between a poll being scheduled and run
            return;
        } finally {
            reading.current = false;
        }

        let elapsedSteps = Math.round(currentElapsedTicks / SUB_NOTE_RESOLUTION);
        if (playRangeStart > -1 && playRangeEnd > -1 && elapsedSteps < playRangeStart) {
            elapsedSteps += playRangeStart;
        }

        if (elapsedSteps >= soundData.size && !soundData.loop && playRangeStart === -1) {
            elapsedSteps = -1;
            setPlaying(false);
        }

        setCurrentPlayerPosition(elapsedSteps);
    };

    const unsetProgressInterval = (): void => {
        clearInterval(progressTimeout.current);
        progressTimeout.current = undefined;
    };

    const setProgressInterval = (): void => {
        unsetProgressInterval();

        if (playing && !testNote) {
            readCurrentPlayerPosition();
            progressTimeout.current = setInterval(() => {
                readCurrentPlayerPosition();
            }, POSITION_POLL_MS);
        }
    };

    useEffect(() => {
        initEmulator();
    }, []);

    useEffect(() => {
        setProgressInterval();
        return () => unsetProgressInterval();
    }, [
        session,
        playing,
        testNote,
        playRangeStart,
        playRangeEnd,
    ]);

    useEffect(() => {
        if (!session) {
            return;
        }

        if (canvasRef.current && !canvasAttached.current) {
            canvasAttached.current = true;
            session.sim.attachCanvas(canvasRef.current);
        }

        return () => {
            session.dispose();
            playerRomBuilder.cleanUp();
        };
    }, [
        session,
    ]);

    useEffect(() => {
        if (!session) {
            return;
        }

        if (playing) {
            const currentSoundDataChecksum = window.electronVesCore.sha1(JSON.stringify({
                soundData: soundData,
                trackSettings,
                playRangeStart,
                playRangeEnd,
                forcePlayerRomRebuild,
            }));
            if (soundDataChecksum !== currentSoundDataChecksum) {
                setSoundDataChecksum(currentSoundDataChecksum);
                buildAndPlay();
            } else {
                session.core.run();
            }
        } else {
            session.core.suspend();
        }
    }, [
        playing,
        session,
        soundData,
        trackSettings,
        playRangeStart,
        playRangeEnd,
        forcePlayerRomRebuild,
    ]);

    useEffect(() => {
        if (playerSeekRequest > 0) {
            seekPlayer(currentPlayerPosition);
        }
    }, [
        playerSeekRequest,
    ]);

    useEffect(() => {
        if (session && !playing && currentPlayerPosition === -1) {
            seekPlayer(-1);
        }
    }, [
        playing,
        session,
        currentPlayerPosition,
    ]);

    return <EmulatorContainer
        style={{
            display: currentPlayerPosition === -1 || !emulatorRomReady
                ? 'none'
                : 'block'
        }}
    >
        <canvas ref={canvasRef} />
    </EmulatorContainer>;
}
