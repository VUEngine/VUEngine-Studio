import { URI } from '@theia/core';
import { Endpoint } from '@theia/core/lib/browser';
import React, { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types.js';
import { SoundData, SUB_NOTE_RESOLUTION, TrackSettings } from '../SoundEditorTypes.js';
import PlayerRomBuilder from './PlayerRomBuilder.js';

const EmulatorContainer = styled.div`
    background-color: #000;
    height: 15px;
    overflow: hidden;
    width: 48px;

    canvas {
        top: -17px !important;
    }
`;

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
    } = props;
    const [core, setCore] = useState<any>();
    const [sim, setSim] = useState<any>();
    const emulatorContainerRef = useRef<HTMLDivElement>(null);
    const [soundDataChecksum, setSoundDataChecksum] = useState<string>('');
    const [shadowCanvasElement, setShadowCanvasElement] = useState<HTMLCanvasElement>();
    const [shadowCanvasElementContext, setShadowCanvasElementContext] = useState<CanvasRenderingContext2D>();
    const [progressTimeout, setProgressTimeout] = useState<NodeJS.Timeout>();

    const init = async (): Promise<void> => {
        await initEmulator();
        setEmulatorInitialized(true);
    };

    const initEmulator = async (): Promise<void> => {
        let VB;
        try {
            // bundled
            VB = require('../../binaries/vuengine-studio-tools/web/shrooms-vb-core/VB.js')?.default;
        } catch (e) {
            // dev
            VB = require('../../../../../../../../applications/electron/binaries/vuengine-studio-tools/web/shrooms-vb-core/VB.js')?.default;
        }

        const newCore = await VB.create({
            audioUrl: './shrooms.audio.js',
            coreUrl: './shrooms.core.js',
            wasmUrl: new Endpoint({ path: '/shrooms/core.wasm' }).getRestUrl().toString(),
        });
        const newSim = await newCore.create();
        newSim.setAnaglyph(0xFF0000, 0);
        await newSim.setVolume(2);

        setCore(newCore);
        setSim(newSim);
    };

    const loadRom = async (romFileUri: URI): Promise<void> => {
        const romFileContent = await services.fileService.readFile(romFileUri);
        await sim.setCartROM(romFileContent.value.buffer);
        await sim.reset();
        core.emulate(sim, true);
    };

    const cleanUp = async (): Promise<void> => {
        sim.delete();
        core.suspend(sim);
        return playerRomBuilder.cleanUp();
    };

    const buildAndPlay = async (): Promise<void> => {
        const romFileUri = await playerRomBuilder.buildSoundPlayerRom(soundData, currentPlayerPosition, playRangeStart, playRangeEnd, trackSettings, true);
        if (await services.fileService.exists(romFileUri)) {
            await loadRom(romFileUri);
            setEmulatorRomReady(true);
        }
    };

    // visually reads total elapsed ticks from canvas bit by bit
    // TODO: remove once it is possible to directly read memory from emulator
    const readCurrentPlayerPosition = () => {
        const canvas = emulatorContainerRef.current?.firstElementChild?.firstElementChild as HTMLCanvasElement;
        if (!canvas) {
            return;
        }
        shadowCanvasElementContext?.drawImage(canvas, 0, 0);
        const topLineImageData = shadowCanvasElementContext?.getImageData(0, 0, 256, 1).data;

        let currentElapsedTicks = 0;
        if (topLineImageData) {
            for (let i = 0; i < 1024; i += 32) {
                if (topLineImageData[i] > 200) {
                    currentElapsedTicks += (1 << (i >> 5));
                }
            }
        }

        let elapsedSteps = Math.round(currentElapsedTicks / SUB_NOTE_RESOLUTION);
        if (playRangeStart > -1 && playRangeEnd > -1 && elapsedSteps < playRangeStart) {
            elapsedSteps += playRangeStart;
        }

        setCurrentPlayerPosition(elapsedSteps);
    };

    const unsetProgressInterval = (): void => {
        clearTimeout(progressTimeout);
    };

    const setProgressInterval = (): void => {
        unsetProgressInterval();

        if (playing && !testNote) {
            readCurrentPlayerPosition();
            setProgressTimeout(setInterval(() => {
                readCurrentPlayerPosition();
            }, 50));
        }
    };

    useEffect(() => {
        init();

        const shadowCanvas = document.createElement('canvas');
        setShadowCanvasElement(shadowCanvas);
        const shadowCanvasContext = shadowCanvas.getContext('2d', { willReadFrequently: true });
        if (shadowCanvasContext) {
            setShadowCanvasElementContext(shadowCanvasContext);
        }
        return () => {
            if (shadowCanvasElement) {
                document.removeChild(shadowCanvasElement);
            }
        };
    }, []);

    useEffect(() => {
        setProgressInterval();
        return unsetProgressInterval();
    }, [
        playing,
        playRangeStart,
        playRangeEnd
    ]);

    useEffect(() => {
        if (sim) {
            emulatorContainerRef?.current?.append(sim);
            return () => {
                cleanUp();
            };
        }
    }, [
        sim,
    ]);

    useEffect(() => {
        if (!core || !sim) {
            return;
        }

        if (playing) {
            // console.log('compare checksums');
            const currentSoundDataChecksum = window.electronVesCore.sha1(JSON.stringify({
                soundData: soundData,
                trackSettings,
                currentPlayerPosition,
                playRangeStart,
                playRangeEnd,
                forcePlayerRomRebuild,
            }));
            // console.log('current:', currentSoundDataChecksum);
            // console.log('previous:', soundDataChecksum);
            if (soundDataChecksum !== currentSoundDataChecksum) {
                // console.log('checksums differ, compile song');
                setSoundDataChecksum(currentSoundDataChecksum);
                buildAndPlay();
            } else {
                // console.log('checksums are the same, play song');
                core.emulate(sim, true);
                // console.log('========================');
            }
        } else {
            core.suspend(sim);
        }
    }, [
        core,
        playing,
        sim,
        soundData,
        trackSettings,
        playRangeStart,
        playRangeEnd,
        forcePlayerRomRebuild,
    ]);

    useEffect(() => {
        if (!core || !sim) {
            return;
        }

        if (!playing && currentPlayerPosition === -1) {
            sim.reset();
        }
    }, [
        core,
        playing,
        sim,
        currentPlayerPosition,
    ]);

    return <EmulatorContainer
        ref={emulatorContainerRef}
        style={{ display: currentPlayerPosition === -1 || !emulatorRomReady ? 'none' : 'block' }}
    />;
}
