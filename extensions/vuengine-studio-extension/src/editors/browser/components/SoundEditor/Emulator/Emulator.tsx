import { DisposableCollection, isWindows, URI } from '@theia/core';
import { Endpoint } from '@theia/core/lib/browser';
import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import { VesProcessType } from '../../../../../process/common/ves-process-service-protocol.js';
import { ProjectDataTemplateEncoding } from '../../../../../project/browser/ves-project-types.js';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types.js';
import { nanoid } from '../../Common/Utils.js';
import { SoundData } from '../SoundEditorTypes.js';

interface EmulatorProps {
    songData: SoundData
    playing: boolean
    setPlaying: React.Dispatch<React.SetStateAction<boolean>>
    testing: boolean
    setTesting: React.Dispatch<React.SetStateAction<boolean>>
    setEmulatorInitialized: Dispatch<SetStateAction<boolean>>
    currentStep: number
    setCurrentStep: Dispatch<SetStateAction<number>>
    testingDuration: number;
    testingNote: number;
    testingInstrument: string;
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
        // console.log(' ');
        // console.log('  ');
        // console.log('========================');
        // console.log('--- 1) init() ---');
        await initTemplating();
        await initEmulator();
        setEmulatorInitialized(true);
        // console.log('--- 4) setEmulatorInitialized(true) ---');
        // console.log('========================');
        // console.log(' ');
        // console.log('  ');
    };

    const initTemplating = async (): Promise<void> => {
        // console.log('--- 2) initTemplating() ---');
        await services.vesProjectService.projectDataReady;
        const soundSpecTemplate = services.vesProjectService.getProjectDataTemplate('SoundSpec');
        if (!soundSpecTemplate) {
            console.error('could not find SoundSpec template');
            return;
        }
        setSoundSpecTemplateString(await services.vesCodeGenService.getTemplateString(soundSpecTemplate));

        const resourcesUri = await services.vesCommonService.getResourcesUri();
        const waveFormsFileUri = resourcesUri.resolve('binaries/vuengine-studio-tools/vb/sound/WaveForms.h.njk');
        const waveFormsFileContent = await services.fileService.readFile(waveFormsFileUri);
        const waveFormsTemplate = services.vesProjectService.getProjectDataTemplate('SoundSpec');
        if (!waveFormsTemplate) {
            console.error('could not find WaveForms template');
            return;
        }
        setWaveFormsTemplateString(waveFormsFileContent.value.toString());

        const tempDirBaseUri = new URI(window.electronVesCore.getTempDir());
        const randomDirName = nanoid();
        const tempDir = tempDirBaseUri.resolve('SoundEditor').resolve(randomDirName);
        setTempBaseDir(tempDir);
    };

    const initEmulator = async (): Promise<void> => {
        // console.log('--- 3) initEmulator() ---');
        let VB;
        try {
            // bundled
            VB = require('../../binaries/vuengine-studio-tools/web/shrooms-vb-core/VB.js')?.default;
        } catch (e) {
            // dev
            VB = require('../../../../../../../../applications/electron/binaries/vuengine-studio-tools/web/shrooms-vb-core/VB.js')?.default;
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

    const createSoundRom = async (): Promise<void> => {
        // console.log('--- 2) createSoundRom ---');
        await generateSpecFile();
        await compileSpecFile();
    };

    const generateSpecFile = async (): Promise<void> => {
        // console.log('--- 3) generateSpecFile ---');
        const specFileUri = tempBaseDir?.resolve('SoundSpec.c');
        await services.vesCodeGenService.renderTemplateToFile(
            'SoundSpec',
            specFileUri!,
            soundSpecTemplateString,
            {
                item: songData,
                project: services.vesProjectService.getProjectData(),
                itemUri: new URI('Dummy.sound'),
                isSoundEditorPreview: true,
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
        // console.log('--- 4) compileSpecFile ---');
        const SpecFileUri = tempBaseDir?.resolve('SoundSpec.c');

        const compilerUri = await services.vesBuildPathsService.getCompilerUri(false);
        const resourcesUri = await services.vesCommonService.getResourcesUri();
        const soundBaseUri = resourcesUri.resolve('binaries/vuengine-studio-tools/vb/sound');

        const args = isWindows ? {
            command: (await services.vesBuildPathsService.getMsysBashUri()).path.fsPath(),
            args: [
                '--login',
                '-c', [
                    await services.vesBuildService.convertToEnvPath(false, compilerUri.resolve('bin/v810-gcc.exe')),
                    '-o', await services.vesBuildService.convertToEnvPath(false, tempBaseDir!.resolve('sound.elf')),
                    '-nostartfiles',
                    '-Tvb_release.ld',
                    '-lm',
                    '-I', await services.vesBuildService.convertToEnvPath(false, tempBaseDir!),
                    '-I', await services.vesBuildService.convertToEnvPath(false, soundBaseUri),
                    await services.vesBuildService.convertToEnvPath(false, SpecFileUri!),
                    '-L', await services.vesBuildService.convertToEnvPath(false, soundBaseUri),
                    '-lcore', '-lsound', '-lcore',
                ].join(' '),
            ],
        } : {
            command: compilerUri.resolve('bin/v810-gcc').path.fsPath(),
            args: [
                '-o', tempBaseDir!.resolve('sound.elf').path.fsPath(),
                '-nostartfiles',
                '-Tvb_release.ld',
                '-lm',
                '-I', tempBaseDir!.path.fsPath(),
                '-I', soundBaseUri.path.fsPath(),
                SpecFileUri!.path.fsPath(),
                '-L', soundBaseUri.path.fsPath(),
                '-lcore', '-lsound', '-lcore',
            ],
        };

        // console.log('compile with args:', args);
        const { processId, processManagerId } = await services.vesProcessService.launchProcess(VesProcessType.Raw, args);
        // console.log('processId:', processId);
        // console.log('processManagerId:', processManagerId);
        // console.log('set up event handler');

        setEventHandler(new DisposableCollection(
            services.vesProcessWatcher.onDidExitProcess(async ({ pId }) => {
                // console.log('process exit event');
                // console.log('process ID:', pId);
                if (processId === pId || processManagerId === pId) {
                    disposeEventHandlers();
                    objcopy();
                }
            }),
            services.vesProcessWatcher.onDidReceiveErrorStreamData(async ({ pId, data }) => {
                // console.log('process error event');
                // console.log('process ID:', pId);
                // console.log('data:', data);
            }),
            services.vesProcessWatcher.onDidReceiveOutputStreamData(async ({ pId, data }) => {
                // console.log('process data event');
                // console.log('process ID:', pId);
                // console.log('data:', data);
            }),
        ));
    };

    const objcopy = async (): Promise<void> => {
        // console.log('--- 5) objcopy ---');
        const compilerUri = await services.vesBuildPathsService.getCompilerUri();

        const args = isWindows ? {
            command: (await services.vesBuildPathsService.getMsysBashUri()).path.fsPath(),
            args: [
                '--login',
                '-c', [
                    await services.vesBuildService.convertToEnvPath(false, compilerUri.resolve('bin/v810-objcopy.exe')),
                    '-O',
                    'binary',
                    await services.vesBuildService.convertToEnvPath(false, tempBaseDir!.resolve('sound.elf')),
                    await services.vesBuildService.convertToEnvPath(false, tempBaseDir!.resolve('sound.vb')),
                ].join(' '),
            ],
        } : {
            command: compilerUri.resolve('bin/v810-objcopy').path.fsPath(),
            args: [
                '-O',
                'binary',
                tempBaseDir!.resolve('sound.elf').path.fsPath(),
                tempBaseDir!.resolve('sound.vb').path.fsPath(),
            ],
        };

        // console.log('objcopy with args:', args);
        const { processId, processManagerId } = await services.vesProcessService.launchProcess(VesProcessType.Raw, args);
        // console.log('processId:', processId);
        // console.log('processManagerId:', processManagerId);
        // console.log('set up event handler');

        setEventHandler(new DisposableCollection(
            services.vesProcessWatcher.onDidExitProcess(async ({ pId }) => {
                // console.log('process exit event');
                // console.log('process ID:', pId);
                if (processId === pId || processManagerId === pId) {
                    disposeEventHandlers();
                    loadRom();
                }
            })
        ));
    };

    const loadRom = async (): Promise<void> => {
        // console.log('--- 6) loadRom ---');
        const romFileUri = tempBaseDir!.resolve('sound.vb');
        // console.log('romFileUri:', romFileUri);
        const romFileContent = await services.fileService.readFile(romFileUri);
        // console.log('romFileContent:', romFileContent);
        await sim.setCartROM(romFileContent.value.buffer);
        await sim.reset();
        core.emulate(sim, true);
        // console.log('========================');
        // console.log(' ');
        // console.log('  ');
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
            // console.log(' ');
            // console.log('  ');
            // console.log('========================');
            // console.log('--- 1) play ---');
            // console.log('compare checksums');
            const currentSongDataChecksum = window.electronVesCore.sha1(JSON.stringify(songData));
            // console.log('current:', currentSongDataChecksum);
            // console.log('previous:', songDataChecksum);
            if (songDataChecksum !== currentSongDataChecksum) {
                // console.log('checksums differ, compile song');
                setProjectDataChecksum(currentSongDataChecksum);
                setCurrentStep(0);
                createSoundRom();
            } else {
                // console.log('checksums are the same, play song');
                core.emulate(sim, true);
                // console.log('========================');
                // console.log(' ');
                // console.log('  ');
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
