import { injectable, inject, postConstruct } from "inversify";
import { basename, dirname, join as joinPath } from "path";
import { OpenerService, PreferenceService } from "@theia/core/lib/browser";
import { CommandService, isWindows } from "@theia/core/lib/common";
import { VesBuildCommands } from "../../build/build-commands";
import { VesCommonFunctions } from "../../common/common-functions";
import { VesState } from "../../common/ves-state";
import { DEFAULT_EMULATOR } from "../emulator-types";
import { VesProcessService } from "../../../common/process-service-protocol";
import URI from "@theia/core/lib/common/uri";
import { getDefaultEmulatorConfig } from "../emulator-functions";

@injectable()
export class VesEmulatorRunCommand {
  @inject(CommandService) protected readonly commandService: CommandService;
  @inject(OpenerService) protected readonly openerService: OpenerService;
  @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
  @inject(VesCommonFunctions) protected readonly commonFunctions: VesCommonFunctions;
  @inject(VesProcessService) protected readonly vesProcessService: VesProcessService;
  @inject(VesState) protected readonly vesState: VesState;

  @postConstruct()
  protected init(): void {
    this.bindEvents();
  }

  async execute() {
    if (this.vesState.isRunQueued) {
      this.vesState.isRunQueued = false;
    } else if (this.vesState.buildStatus.active) {
      this.vesState.isRunQueued = true;
    } else if (this.vesState.outputRomExists) {
      this.run();
    } else {
      this.vesState.isRunQueued = true;
      this.commandService.executeCommand(VesBuildCommands.BUILD.id);
    }
  }

  protected bindEvents() {
    this.vesState.onDidChangeOutputRomExists(outputRomExists => {
      if (outputRomExists && this.vesState.isRunQueued) {
        this.vesState.isRunQueued = false;
        this.run();
      }
    })
  }

  protected async run() {
    const defaultEmulatorConfig = getDefaultEmulatorConfig(this.preferenceService);

    if (defaultEmulatorConfig === DEFAULT_EMULATOR) {
      const romUri = new URI(this.commonFunctions.getRomPath());
      const opener = await this.openerService.getOpener(romUri);
      await opener.open(romUri);
    } else {
      const emulatorPath = defaultEmulatorConfig.path;
      const emulatorArgs = defaultEmulatorConfig.args.replace("%ROM%", this.commonFunctions.getRomPath()).split(" ");

      if (!emulatorPath) {
        // TODO: error message
        return;
      }

      await this.fixPermissions(emulatorPath);

      await this.vesProcessService.launchProcess({
        command: joinPath(".", basename(emulatorPath)),
        args: emulatorArgs,
        options: {
          cwd: dirname(emulatorPath),
        },
      });
    }
  }

  /**
   * Give executables respective permission on UNIX systems.
   * Must be executed before every run to ensure permissions are right,
   * even right after reconfiguring paths.
   */
  protected async fixPermissions(emulatorPath: string) {
    if (!isWindows && emulatorPath) {
      await this.vesProcessService.launchProcess({
        command: "chmod",
        args: ["a+x", emulatorPath]
      });
    }
  }
}