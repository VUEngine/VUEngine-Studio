import { inject, injectable } from "inversify";
// import { spawn } from "child_process";
import { ProcessErrorEvent, TerminalProcessFactory, TerminalProcessOptions } from '@theia/process/lib/node';
import { VesProcessService } from "../../common/process-service-protocol";

@injectable()
export class DefaultVesProcessService implements VesProcessService {
    @inject(TerminalProcessFactory) protected readonly terminalProcessFactory: TerminalProcessFactory;

    async launchProcess(options: TerminalProcessOptions): Promise<number> {
        const terminalProcess = this.terminalProcessFactory(options);
        await new Promise((resolve, reject) => {
            terminalProcess.onStart(resolve);
            terminalProcess.onError((error: ProcessErrorEvent) => console.log(error));
        });

        terminalProcess.onClose(() => console.log("CLOSE"));
        terminalProcess.onExit(() => console.log("EXIT"));

        // terminalProcess.outputStream.on('data', (data) => {
        //     console.log("error: ", data.toString())
        // })

        return terminalProcess.id;
    }
}