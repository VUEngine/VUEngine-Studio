import React, { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { EmulatorSession } from 'vueport-core/lib/browser/emulator-core-service';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types.js';
import { getStepAtTicks, getTempoSegments, getTicksAtStep, getTimerResolution } from '../Other/tempo.js';
import { SoundData, SUB_NOTE_RESOLUTION, TrackSettings } from '../SoundEditorTypes.js';
import { readPlayerRomInfo } from './soundSpecSerializer.js';
import { PLAYER_FLAG_MINI_VISUALIZER, SoundPlayer } from './SoundPlayer.js';

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

export const PLAYER_ROM_PATH = 'binaries/vuengine-studio-tools/vb/sound/player.vb';
const SONG_SRAM_SIZE = 1024 * 1024;
const PREVIEW_SRAM_SIZE = 64 * 1024;
const POSITION_POLL_MS = 50;
// see TimerConfiguration in the engine's Platform.h
const TIMER_100US = 0x00;
const TIMER_UNITS_MS = 1;

interface EmulatorProps {
    soundData: SoundData
    playing: boolean
    setPlaying: Dispatch<SetStateAction<boolean>>
    // the test sound plays in a simulation of its own, alongside the sound
    testSoundData: SoundData | undefined
    // called once the test sound has been handed to the player, which starts it with its next frame
    onTestSoundStarted?: () => void
    setEmulatorInitialized: Dispatch<SetStateAction<boolean>>
    emulatorRomReady: boolean
    setEmulatorRomReady: Dispatch<SetStateAction<boolean>>
    currentPlayerPosition: number
    setCurrentPlayerPosition: Dispatch<SetStateAction<number>>
    playRangeStart: number;
    playRangeEnd: number;
    trackSettings: TrackSettings[]
    forceReplay: number
    playerSeekRequest: number
    // the timer interval of the stage the sounds play in, in milliseconds
    stageTimer: number
}

export default function Emulator(props: EmulatorProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const {
        soundData,
        playing, setPlaying,
        testSoundData,
        onTestSoundStarted,
        setEmulatorInitialized,
        emulatorRomReady, setEmulatorRomReady,
        currentPlayerPosition, setCurrentPlayerPosition,
        playRangeStart, playRangeEnd,
        trackSettings,
        forceReplay,
        playerSeekRequest,
        stageTimer,
    } = props;
    const [session, setSession] = useState<EmulatorSession>();
    const [songPlayer, setSongPlayer] = useState<SoundPlayer>();
    const [previewPlayer, setPreviewPlayer] = useState<SoundPlayer>();
    // what the song player has been sent last, to send it again only when it changed
    const songChecksum = useRef<string>('');
    const songSoundData = useRef<SoundData>();
    const previewChecksum = useRef<string>('');
    // pausing and stopping get sent when playing ends, rather than whenever something changes while not playing
    const songPlaying = useRef<boolean>(false);
    const progressTimeout = useRef<NodeJS.Timeout>();
    const reading = useRef(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const initEmulator = async (): Promise<EmulatorSession | undefined> => {
        const resourcesUri = await services.vesCommonService.getResourcesUri();
        const romContent = await services.fileService.readFile(resourcesUri.resolve(PLAYER_ROM_PATH));
        const rom = romContent.value.buffer.slice().buffer;
        const info = readPlayerRomInfo(rom);
        if (!info) {
            console.error('The sound player ROM could not be found.');
            return;
        }

        const newSession = await services.vesEmulatorCoreService.createSession();
        const song = await SoundPlayer.load(newSession.sim, rom, info, SONG_SRAM_SIZE);
        const preview = await SoundPlayer.load(await newSession.core.createSim(), rom, info, PREVIEW_SRAM_SIZE);
        await song.sim.setVolume(2);
        await preview.sim.setVolume(2);
        if (canvasRef.current) {
            await song.sim.attachCanvas(canvasRef.current);
        }

        // the players need to run until they listen to their mailboxes
        await newSession.core.run();
        const ready = await song.waitUntilReady() && await preview.waitUntilReady();
        await newSession.core.suspend();
        if (!ready) {
            console.error('The sound player ROM did not start.');
            newSession.dispose();
            return;
        }

        setSession(newSession);
        setSongPlayer(song);
        setPreviewPlayer(preview);
        setEmulatorInitialized(true);
        setEmulatorRomReady(true);

        return newSession;
    };

    // the player counts ticks, which last as long as the timer resolution, and the tempo defines how many a step takes
    const getTicksAtColumn = (column: number, data: SoundData = soundData): number =>
        getTicksAtStep(getTempoSegments(data), getTimerResolution(data), column * SUB_NOTE_RESOLUTION);
    const getColumnAtTicks = (ticks: number, data: SoundData = soundData): number =>
        getStepAtTicks(getTempoSegments(data), getTimerResolution(data), ticks) / SUB_NOTE_RESOLUTION;

    const startTickFor = (position: number): number => getTicksAtColumn(playRangeStart > -1 ? playRangeStart : Math.max(0, position));

    const songOptions = () => ({ trackSettings, playRangeStart, playRangeEnd });

    // the song's position in ticks, carried over to the changed sound, whose tempo might differ
    const getContinuationTick = async (player: SoundPlayer): Promise<number> => {
        const previousSoundData = songSoundData.current;
        if (!previousSoundData) {
            return startTickFor(currentPlayerPosition);
        }
        const { totalElapsedTicks } = await player.readStatus();
        const step = getStepAtTicks(getTempoSegments(previousSoundData), getTimerResolution(previousSoundData), totalElapsedTicks);
        return getTicksAtStep(getTempoSegments(soundData), getTimerResolution(soundData), step);
    };

    const readCurrentPlayerPosition = async (): Promise<void> => {
        if (!songPlayer || reading.current) {
            return;
        }
        reading.current = true;

        let currentElapsedTicks: number;
        try {
            currentElapsedTicks = (await songPlayer.readStatus()).totalElapsedTicks;
        } catch {
            // the session can go away between a poll being scheduled and run
            return;
        } finally {
            reading.current = false;
        }

        let elapsedSteps = Math.round(getColumnAtTicks(currentElapsedTicks));
        if (playRangeStart > -1 && playRangeEnd > -1 && elapsedSteps < playRangeStart) {
            elapsedSteps = Math.round(getColumnAtTicks(currentElapsedTicks + getTicksAtColumn(playRangeStart)));
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

    useEffect(() => {
        let created: EmulatorSession | undefined;
        initEmulator().then(s => created = s);
        return () => created?.dispose();
    }, []);

    // both simulations run while either plays, as running and suspending applies to all simulations of a core
    useEffect(() => {
        if (!session) {
            return;
        }
        if (playing || testSoundData) {
            session.core.run();
        } else {
            session.core.suspend();
        }
    }, [
        session,
        playing,
        !!testSoundData,
    ]);

    useEffect(() => {
        unsetProgressInterval();
        if (playing && songPlayer) {
            readCurrentPlayerPosition();
            progressTimeout.current = setInterval(readCurrentPlayerPosition, POSITION_POLL_MS);
        }
        return () => unsetProgressInterval();
    }, [
        songPlayer,
        playing,
        playRangeStart,
        playRangeEnd,
    ]);

    useEffect(() => {
        const timerConfiguration = {
            resolution: TIMER_100US,
            targetTimePerInterrupt: stageTimer,
            targetTimePerInterruptUnits: TIMER_UNITS_MS,
        };
        songPlayer?.setTimer(timerConfiguration);
        previewPlayer?.setTimer(timerConfiguration);
    }, [
        songPlayer,
        previewPlayer,
        stageTimer,
    ]);

    // the sound gets sent again when it changes, and continues where it was
    useEffect(() => {
        if (!songPlayer) {
            return;
        }

        if (!playing) {
            if (songPlaying.current) {
                songPlaying.current = false;
                songPlayer.pause();
            }
            return;
        }
        songPlaying.current = true;

        const checksum = window.electronVesCore.sha1(JSON.stringify({
            soundData,
            trackSettings,
            playRangeStart,
            playRangeEnd,
            forceReplay,
        }));
        if (checksum === songChecksum.current) {
            songPlayer.resume();
            return;
        }

        const sendSound = async () => {
            const startTick = songChecksum.current === '' || playRangeStart > -1
                ? startTickFor(currentPlayerPosition)
                : await getContinuationTick(songPlayer);
            songChecksum.current = checksum;
            songSoundData.current = soundData;
            await songPlayer.play(soundData, songOptions(), startTick, PLAYER_FLAG_MINI_VISUALIZER);
        };
        sendSound().catch(e => console.error(e));
    }, [
        songPlayer,
        playing,
        soundData,
        trackSettings,
        playRangeStart,
        playRangeEnd,
        forceReplay,
    ]);

    useEffect(() => {
        if (!previewPlayer) {
            return;
        }

        if (!testSoundData) {
            if (previewChecksum.current !== '') {
                previewChecksum.current = '';
                previewPlayer.stop();
            }
            return;
        }

        const checksum = window.electronVesCore.sha1(JSON.stringify({ testSoundData, forceReplay }));
        if (checksum !== previewChecksum.current) {
            previewChecksum.current = checksum;
            previewPlayer.play(testSoundData, {}, 0, PLAYER_FLAG_MINI_VISUALIZER)
                .then(sent => sent && onTestSoundStarted?.())
                .catch(e => console.error(e));
        }
    }, [
        previewPlayer,
        testSoundData,
        forceReplay,
    ]);

    // seeking starts the sound at another position, while paused it gets there and waits
    useEffect(() => {
        if (playerSeekRequest > 0 && songPlayer && songChecksum.current !== '') {
            songPlayer.seek(startTickFor(currentPlayerPosition));
            if (!playing) {
                songPlayer.pause();
            }
        }
    }, [
        playerSeekRequest,
    ]);

    useEffect(() => {
        if (songPlayer && !playing && currentPlayerPosition === -1 && songChecksum.current !== '') {
            songChecksum.current = '';
            songSoundData.current = undefined;
            songPlayer.stop();
        }
    }, [
        songPlayer,
        playing,
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
