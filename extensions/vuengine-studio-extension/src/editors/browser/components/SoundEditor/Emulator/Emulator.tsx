import { URI } from '@theia/core';
import { Endpoint } from '@theia/core/lib/browser';
import React, { Dispatch, SetStateAction, useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types.js';
import { SoundData, TrackSettings } from '../SoundEditorTypes.js';
import PlayerRomBuilder from './PlayerRomBuilder.js';

const EmulatorContainer = styled.div`
    background-color: #000;
    height: 15px;
    overflow: hidden;
    width: 48px;
`;

interface EmulatorProps {
    soundData: SoundData
    playing: boolean
    setEmulatorInitialized: Dispatch<SetStateAction<boolean>>
    emulatorRomReady: boolean
    setEmulatorRomReady: Dispatch<SetStateAction<boolean>>
    currentPlayerPosition: number
    playRangeStart: number;
    playRangeEnd: number;
    trackSettings: TrackSettings[]
    playerRomBuilder: PlayerRomBuilder
}

export default function Emulator(props: EmulatorProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const {
        soundData,
        playing,
        setEmulatorInitialized,
        emulatorRomReady, setEmulatorRomReady,
        currentPlayerPosition,
        playRangeStart, playRangeEnd,
        trackSettings,
        playerRomBuilder,
    } = props;
    const [core, setCore] = useState<any>();
    const [sim, setSim] = useState<any>();
    const emulatorContainerRef = useRef<HTMLDivElement>(null);
    const [soundDataChecksum, setSoundDataChecksum] = useState<string>('');

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
        const romFileUri = await playerRomBuilder.buildSoundPlayerRom(soundData, playRangeStart, playRangeEnd, trackSettings, true);
        await loadRom(romFileUri);
        setEmulatorRomReady(true);
    };

    useEffect(() => {
        init();
    }, []);

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
                playRangeStart,
                playRangeEnd,
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
