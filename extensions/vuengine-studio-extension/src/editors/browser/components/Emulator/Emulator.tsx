import { DisposableCollection, URI } from '@theia/core';
import { Endpoint } from '@theia/core/lib/browser';
import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import { VesBuildPreferenceIds } from '../../../../build/browser/ves-build-preferences.js';
import { VesProcessType } from '../../../../process/common/ves-process-service-protocol.js';
import { ProjectDataTemplateEncoding } from '../../../../project/browser/ves-project-types.js';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types.js';
import { nanoid } from '../Common/Utils.js';
import { SongData } from '../MusicEditor/MusicEditorTypes.js';

interface EmulatorProps {
    songData: SongData
    playing: boolean
    setPlaying: React.Dispatch<React.SetStateAction<boolean>>
    testing: boolean
    setTesting: React.Dispatch<React.SetStateAction<boolean>>
    setEmulatorInitialized: Dispatch<SetStateAction<boolean>>
    currentStep: number
    setCurrentStep: Dispatch<SetStateAction<number>>
    testingDuration: number;
    testingNote: number;
    testingInstrument: number;
    testingChannel: number;
    playRangeStart: number;
    playRangeEnd: number;
}

export default function Emulator(props: EmulatorProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const { songData, playing, setEmulatorInitialized, currentStep, setCurrentStep } = props;
    const [soundSpecTemplateString, setSoundSpecTemplateString] = useState<string>('');
    const [waveFormsTemplateString, setWaveFormsTemplateString] = useState<string>('');
    const [core, setCore] = useState<any>();
    const [sim, setSim] = useState<any>();
    const [tempBaseDir, setTempBaseDir] = useState<URI>();
    const [eventHandler, setEventHandler] = useState<DisposableCollection>();
    const [songDataChecksum, setProjectDataChecksum] = useState<string>('');

    const disposeEventHandlers = () => {
        if (eventHandler) {
            eventHandler.dispose();
        }
    };

    const init = async (): Promise<void> => {
        await initTemplating();
        await initEmulator();
        setEmulatorInitialized(true);
    };

    const generateSpecFile = async (): Promise<void> => {
        const specFileUri = tempBaseDir?.resolve('SoundSpec.c');
        await services.vesCodeGenService.renderTemplateToFile(
            'SoundSpec',
            specFileUri!,
            soundSpecTemplateString,
            {
                item: songData,
                project: services.vesProjectService.getProjectData(),
                itemUri: new URI('Dummy.audio'),
            },
            ProjectDataTemplateEncoding.utf8,
            true
        );

        const waveFormsFileUri = tempBaseDir?.resolve('WaveForms.h');
        await services.vesCodeGenService.renderTemplateToFile(
            'WaveForms',
            waveFormsFileUri!,
            waveFormsTemplateString,
            {
                project: services.vesProjectService.getProjectData(),
            },
            ProjectDataTemplateEncoding.utf8,
            true
        );
    };

    const compileSpecFile = async (): Promise<void> => {
        const SpecFileUri = tempBaseDir?.resolve('SoundSpec.c');

        const useWsl = services.preferenceService.get(VesBuildPreferenceIds.USE_WSL) as boolean;
        const isWslInstalled = useWsl && services.vesCommonService.isWslInstalled;
        const compilerUri = await services.vesBuildPathsService.getCompilerUri(isWslInstalled);
        const resourcesUri = await services.vesCommonService.getResourcesUri();
        const audioBaseUri = resourcesUri.resolve('binaries/vuengine-studio-tools/vb/audio');

        const { processId, processManagerId } = await services.vesProcessService.launchProcess(VesProcessType.Raw, {
            // TODO: Windows support
            command: compilerUri.resolve('bin/v810-gcc').path.fsPath(),
            args: [
                '-o', tempBaseDir!.resolve('audio.elf').path.fsPath(),
                '-nostartfiles',
                '-Tvb_release.ld',
                '-lm',
                SpecFileUri!.path.fsPath(),
                '-lcore', '-lmusic', '-lcore',
            ],
            options: {
                cwd: audioBaseUri.path.fsPath(),
                env: {
                    C_INCLUDE_PATH: [
                        tempBaseDir!.path.fsPath(),
                        audioBaseUri.path.fsPath(),
                    ].join(':'),
                },
            },
        });

        setEventHandler(new DisposableCollection(
            services.vesProcessWatcher.onDidExitProcess(async ({ pId }) => {
                if (processId === pId || processManagerId === pId) {
                    disposeEventHandlers();
                    objcopy();
                }
            })
        ));
    };

    const objcopy = async (): Promise<void> => {
        const useWsl = services.preferenceService.get(VesBuildPreferenceIds.USE_WSL) as boolean;
        const isWslInstalled = useWsl && services.vesCommonService.isWslInstalled;
        const compilerUri = await services.vesBuildPathsService.getCompilerUri(isWslInstalled);

        const { processId, processManagerId } = await services.vesProcessService.launchProcess(VesProcessType.Raw, {
            // TODO: Windows support
            command: compilerUri.resolve('bin/v810-objcopy').path.fsPath(),
            args: [
                '-O',
                'binary',
                tempBaseDir!.resolve('audio.elf').path.fsPath(),
                tempBaseDir!.resolve('audio.vb').path.fsPath(),
            ],
        });

        setEventHandler(new DisposableCollection(
            services.vesProcessWatcher.onDidExitProcess(async ({ pId }) => {
                if (processId === pId || processManagerId === pId) {
                    disposeEventHandlers();
                    loadRom();
                }
            })
        ));
    };

    const loadRom = async (): Promise<void> => {
        const romFileUri = tempBaseDir!.resolve('audio.vb');
        const romFileContent = await services.fileService.readFile(romFileUri);
        await sim.setCartROM(romFileContent.value.buffer);
        await sim.reset();
        core.emulate(sim, true);
    };

    const createAudioRom = async (): Promise<void> => {
        await generateSpecFile();
        await compileSpecFile();
    };

    const initTemplating = async (): Promise<void> => {
        await services.vesProjectService.projectDataReady;
        const soundSpecTemplate = services.vesProjectService.getProjectDataTemplate('SoundSpec');
        if (!soundSpecTemplate) {
            console.error('could not find SoundSpec template');
            return;
        }
        setSoundSpecTemplateString(await services.vesCodeGenService.getTemplateString(soundSpecTemplate));

        const resourcesUri = await services.vesCommonService.getResourcesUri();
        const waveFormsFileUri = resourcesUri.resolve('binaries/vuengine-studio-tools/vb/audio/WaveForms.h.njk');
        const waveFormsFileContent = await services.fileService.readFile(waveFormsFileUri);
        const waveFormsTemplate = services.vesProjectService.getProjectDataTemplate('SoundSpec');
        if (!waveFormsTemplate) {
            console.error('could not find WaveForms template');
            return;
        }
        setWaveFormsTemplateString(waveFormsFileContent.value.toString());

        const tempDirBaseUri = new URI(window.electronVesCore.getTempDir());
        const randomDirName = nanoid();
        const tempDir = tempDirBaseUri.resolve('musicEditor').resolve(randomDirName);
        setTempBaseDir(tempDir);
    };

    const initEmulator = async (): Promise<void> => {
        let VB;
        try {
            // bundled
            VB = require('../../binaries/vuengine-studio-tools/web/shrooms-vb-core/VB.js')?.default;
        } catch (e) {
            // dev
            VB = require('../../../../../../../applications/electron/binaries/vuengine-studio-tools/web/shrooms-vb-core/VB.js')?.default;
        }

        const newCore = await VB.create({
            audioUrl: new Endpoint({ path: '/shrooms/Audio.js' }).getRestUrl().toString(),
            coreUrl: new Endpoint({ path: '/shrooms/Core.js' }).getRestUrl().toString(),
            wasmUrl: new Endpoint({ path: '/shrooms/core.wasm' }).getRestUrl().toString(),
        });
        const newSim = await newCore.create();
        await newSim.setVolume(2);

        setCore(newCore);
        setSim(newSim);
    };

    const cleanUp = async (): Promise<void> => {
        sim.delete();
        core.suspend(sim);
        if (tempBaseDir && await services.fileService.exists(tempBaseDir)) {
            services.fileService.delete(tempBaseDir!, { recursive: true });
        }
        disposeEventHandlers();
    };

    useEffect(() => {
        init();
    }, []);

    useEffect(() => {
        if (sim && tempBaseDir) {
            return () => {
                cleanUp();
            };
        }
    }, [
        sim,
        tempBaseDir,
    ]);

    useEffect(() => {
        if (!core || !sim) {
            return;
        }

        if (playing) {
            const currentSongDataChecksum = window.electronVesCore.sha1(JSON.stringify(songData));
            if (songDataChecksum !== currentSongDataChecksum) {
                setProjectDataChecksum(currentSongDataChecksum);
                setCurrentStep(0);
                createAudioRom();
            } else {
                core.emulate(sim, true);
            }
        } else {
            core.suspend(sim);
            if (currentStep === -1) {
                sim.reset();
            }
        }
    }, [
        core,
        currentStep,
        playing,
        sim,
        songData,
    ]);

    return <></>;
}
