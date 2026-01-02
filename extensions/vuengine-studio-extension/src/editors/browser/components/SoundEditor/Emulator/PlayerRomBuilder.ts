import { DisposableCollection, isWindows, URI } from '@theia/core';
import { VesProcessType } from '../../../../../process/common/ves-process-service-protocol.js';
import { ProjectDataTemplateEncoding } from '../../../../../project/browser/ves-project-types.js';
import { EditorsServices } from '../../../ves-editors-types.js';
import { nanoid } from '../../Common/Utils.js';
import { SoundData, TrackSettings } from '../SoundEditorTypes.js';

export default class PlayerRomBuilder {
    services: EditorsServices;
    soundSpecTemplateString: string;
    tempBaseDir: URI;
    eventHandler: DisposableCollection;

    constructor(services: EditorsServices) {
        this.services = services;

        this.initTemplating();
    }

    buildSoundPlayerRom = async (soundData: SoundData, playRangeStart: number, playRangeEnd: number, trackSettings: TrackSettings[]): Promise<URI> => {
        await this.generateSpecFile(soundData, playRangeStart, playRangeEnd, trackSettings);
        await this.compileSpecFile();

        return this.tempBaseDir.resolve('sound.vb');
    };

    cleanUp = async (): Promise<void> => {
        this.disposeEventHandlers();
        if (this.tempBaseDir && await this.services.fileService.exists(this.tempBaseDir)) {
            return this.services.fileService.delete(this.tempBaseDir!, { recursive: true });
        }
    };

    protected disposeEventHandlers = () => {
        if (this.eventHandler) {
            this.eventHandler.dispose();
        }
    };

    protected initTemplating = async (): Promise<void> => {
        await this.services.vesProjectService.projectDataReady;
        const soundSpecTemplate = this.services.vesProjectService.getProjectDataTemplate('SoundSpec');
        if (!soundSpecTemplate) {
            console.error('could not find SoundSpec template');
            return;
        }
        this.soundSpecTemplateString = await this.services.vesCodeGenService.getTemplateString(soundSpecTemplate);

        const tempDirBaseUri = new URI(window.electronVesCore.getTempDir());
        const randomDirName = nanoid();
        const tempDir = tempDirBaseUri.resolve('SoundEditor').resolve(randomDirName);
        this.tempBaseDir = tempDir;
    };

    protected generateSpecFile = async (soundData: SoundData, playRangeStart: number, playRangeEnd: number, trackSettings: TrackSettings[]): Promise<void> => {
        // console.log('--- 3) generateSpecFile ---');
        const specFileUri = this.tempBaseDir?.resolve('SoundSpec.c');
        // console.log('specFileUri: ', specFileUri?.path.fsPath());
        await this.services.vesCodeGenService.renderTemplateToFile(
            'SoundSpec',
            specFileUri,
            this.soundSpecTemplateString,
            {
                item: soundData,
                project: this.services.vesProjectService.getProjectData(),
                itemUri: new URI('Dummy.sound'),
                isSoundEditorPreview: true,
                trackSettings: trackSettings,
                startFromSramTick: false, // currentPlayerPosition > 0,
                playRangeStart: playRangeStart,
                playRangeEnd: playRangeEnd,
            },
            ProjectDataTemplateEncoding.utf8,
            true
        );
    };

    protected compileSpecFile = async (): Promise<void> => {
        // console.log('--- 4) compileSpecFile ---');
        const SpecFileUri = this.tempBaseDir?.resolve('SoundSpec.c');

        const compilerUri = await this.services.vesBuildPathsService.getCompilerUri(false);
        const resourcesUri = await this.services.vesCommonService.getResourcesUri();
        const soundBaseUri = resourcesUri.resolve('binaries/vuengine-studio-tools/vb/sound');

        const args = isWindows ? {
            command: (await this.services.vesBuildPathsService.getMsysBashUri()).path.fsPath(),
            args: [
                '--login',
                '-c', [
                    await this.services.vesBuildService.convertToEnvPath(false, compilerUri.resolve('bin/v810-gcc.exe')),
                    '-o', await this.services.vesBuildService.convertToEnvPath(false, this.tempBaseDir.resolve('sound.elf')),
                    '-nostartfiles',
                    '-Tvb_shipping.ld',
                    '-lm',
                    '-I', await this.services.vesBuildService.convertToEnvPath(false, this.tempBaseDir),
                    '-I', await this.services.vesBuildService.convertToEnvPath(false, soundBaseUri),
                    await this.services.vesBuildService.convertToEnvPath(false, SpecFileUri),
                    '-L', await this.services.vesBuildService.convertToEnvPath(false, soundBaseUri),
                    '-lcore', '-lsound', '-lcore',
                ].join(' '),
            ],
        } : {
            command: compilerUri.resolve('bin/v810-gcc').path.fsPath(),
            args: [
                '-o', this.tempBaseDir.resolve('sound.elf').path.fsPath(),
                '-nostartfiles',
                '-Tvb_shipping.ld',
                '-lm',
                '-I', this.tempBaseDir.path.fsPath(),
                '-I', soundBaseUri.path.fsPath(),
                SpecFileUri.path.fsPath(),
                '-L', soundBaseUri.path.fsPath(),
                '-lcore', '-lsound', '-lcore',
            ],
        };

        // console.log('compile with args:', args);
        const { processId, processManagerId } = await this.services.vesProcessService.launchProcess(VesProcessType.Raw, args);
        // console.log('processId:', processId);
        // console.log('processManagerId:', processManagerId);
        // console.log('set up event handler');

        return new Promise(resolve => {
            this.eventHandler = new DisposableCollection(
                this.services.vesProcessWatcher.onDidExitProcess(async ({ pId }) => {
                    // console.log('process exit event');
                    // console.log('process ID:', pId);
                    if (processId === pId || processManagerId === pId) {
                        this.disposeEventHandlers();
                        await this.objcopy();
                        resolve();
                    }
                }),
                this.services.vesProcessWatcher.onDidReceiveErrorStreamData(async ({ pId, data }) => {
                    // console.log('process error event');
                    // console.log('process ID:', pId);
                    // console.log('data:', data);
                }),
                this.services.vesProcessWatcher.onDidReceiveOutputStreamData(async ({ pId, data }) => {
                    // console.log('process data event');
                    // console.log('process ID:', pId);
                    // console.log('data:', data);
                }),
            );
        });
    };

    protected objcopy = async (): Promise<void> => {
        // console.log('--- 5) objcopy ---');
        const compilerUri = await this.services.vesBuildPathsService.getCompilerUri();

        const args = isWindows ? {
            command: (await this.services.vesBuildPathsService.getMsysBashUri()).path.fsPath(),
            args: [
                '--login',
                '-c', [
                    await this.services.vesBuildService.convertToEnvPath(false, compilerUri.resolve('bin/v810-objcopy.exe')),
                    '-O',
                    'binary',
                    await this.services.vesBuildService.convertToEnvPath(false, this.tempBaseDir.resolve('sound.elf')),
                    await this.services.vesBuildService.convertToEnvPath(false, this.tempBaseDir.resolve('sound.vb')),
                ].join(' '),
            ],
        } : {
            command: compilerUri.resolve('bin/v810-objcopy').path.fsPath(),
            args: [
                '-O',
                'binary',
                this.tempBaseDir.resolve('sound.elf').path.fsPath(),
                this.tempBaseDir.resolve('sound.vb').path.fsPath(),
            ],
        };

        // console.log('objcopy with args:', args);
        const { processId, processManagerId } = await this.services.vesProcessService.launchProcess(VesProcessType.Raw, args);
        // console.log('processId:', processId);
        // console.log('processManagerId:', processManagerId);
        // console.log('set up event handler');

        return new Promise(resolve => {
            this.eventHandler = new DisposableCollection(
                this.services.vesProcessWatcher.onDidExitProcess(async ({ pId }) => {
                    // console.log('process exit event');
                    // console.log('process ID:', pId);
                    if (processId === pId || processManagerId === pId) {
                        this.disposeEventHandlers();
                        resolve();
                    }
                })
            );
        });
    };
}
