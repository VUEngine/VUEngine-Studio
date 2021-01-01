import { inject, injectable } from "inversify";
import { RawProcessFactory } from '@theia/process/lib/node';
import { VesProcessService } from "../../common/process-service-protocol";

@injectable()
export class DefaultVesProcessService implements VesProcessService {
    @inject(RawProcessFactory) protected readonly processFactory: RawProcessFactory;

    async launchProcess(): Promise<void> {
        // const terminalProcess = this.processFactory({
        //     command: "mednafen",
        //     args: ["/Users/chris/dev/vb/projects/vuengine-platformer-demo/build/output.vb"],
        //     options: {
        //         cwd: "/Users/chris/dev/vuengine-studio/extensions/theia-vuengine-studio/electron-app/binaries/vuengine-studio-tools/osx/mednafen",
        //         env: {},
        //         // shell: {
        //         //     executable: "";

        //         //     /**
        //         //      * The arguments to be passed to the shell executable to run in command mode
        //         //      * (e.g ['-c'] for bash or ['/S', '/C'] for cmd.exe).
        //         //      */
        //         //     args: [""];
        //         // },
        //     },
        // });

        // await new Promise((resolve, reject) => {
        //     terminalProcess.onStart(resolve);
        //     terminalProcess.onExit(() => console.log("EXIT"));
        //     terminalProcess.onError((error: ProcessErrorEvent) => { });
        // });



        // const process = this.processFactory({
        //     options: {
        //         stdio: ['pipe', 'pipe', 2, 'ipc'],
        //         env: environment.electron.runAsNodeEnv()
        //     },
        //     modulePath: getResourcesPath()
        // });

        // await new Promise((resolve, reject) => {
        //     process.onStart(resolve);
        //     process.onExit(() => console.log("EXIT"));
        //     process.onError((error) => { });
        // });

        // console.log("process.getCwdURI()", await process.getCwdURI());
    }
}