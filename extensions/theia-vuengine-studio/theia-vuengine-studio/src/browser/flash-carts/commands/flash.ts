import { injectable, inject, postConstruct } from "inversify";
import { createWriteStream, readFileSync, unlinkSync } from "fs";
import { basename, dirname, sep } from "path";
import { PreferenceService } from "@theia/core/lib/browser";
import { CommandService, isWindows, MessageService } from "@theia/core/lib/common";
import URI from "@theia/core/lib/common/uri";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { VesBuildCommands } from "../../build/build-commands";
import { VesBuildPrefs } from "../../build/build-preferences";
import { VesCommonFunctions } from "../../common/common-functions";
import { VesState } from "../../common/ves-state";
import { VesProcessService } from "../../../common/process-service-protocol";
import { VesFlashCartsPrefs } from "../flash-carts-preferences";
import { VesProcessWatcher } from "../../services/process-service/process-watcher";
import { VesFlashCartsCommands } from "../flash-carts-commands";
import { ConnectedFlashCart } from "../flash-carts-types";

@injectable()
export class VesFlashCartsFlashCommand {
  @inject(CommandService) protected readonly commandService: CommandService;
  @inject(FileService) protected readonly fileService: FileService;
  @inject(MessageService) protected readonly messageService: MessageService;
  @inject(PreferenceService) protected readonly preferenceService: PreferenceService;
  @inject(VesCommonFunctions) protected readonly commonFunctions: VesCommonFunctions;
  @inject(VesProcessService) protected readonly vesProcessService: VesProcessService;
  @inject(VesProcessWatcher) protected readonly vesProcessWatcher: VesProcessWatcher;
  @inject(VesState) protected readonly vesState: VesState;

  @postConstruct()
  protected init(): void {
    this.bindEvents();
  }

  async execute() {
    if (this.vesState.isFlashQueued) {
      this.vesState.isFlashQueued = false;
    } else if (this.vesState.buildStatus.active) {
      this.vesState.isFlashQueued = true;
    } else if (this.vesState.isFlashing || this.vesState.connectedFlashCarts.length === 0) {
      this.commandService.executeCommand(VesFlashCartsCommands.OPEN_WIDGET.id);
    } else {
      if (this.vesState.outputRomExists) {
        this.flash();
      } else {
        this.commandService.executeCommand(VesBuildCommands.BUILD.id);
        this.vesState.isFlashQueued = true;
      }
    }
  }

  async flash() {
    for (const connectedFlashCart of this.vesState.connectedFlashCarts) {
      if (!connectedFlashCart.config.path) {
        this.messageService.error(
          `No path to flasher software provided for cart "${connectedFlashCart.config.name}"`
        );
        continue;
      }

      if (!await this.fileService.exists(new URI(dirname(connectedFlashCart.config.path)))) {
        this.messageService.error(
          `Flasher software does not exist at "${connectedFlashCart.config.path}"`
        );
        continue;
      }

      let flasherEnvPath = this.commonFunctions.convertoToEnvPath(connectedFlashCart.config.path);

      const enableWsl = this.preferenceService.get(VesBuildPrefs.ENABLE_WSL.id);
      if (isWindows && enableWsl) {
        flasherEnvPath.replace(/\.[^/.]+$/, "");
      }

      const romPath = connectedFlashCart.config.padRom &&
        await this.padRom(connectedFlashCart.config.size)
        ? this.getPaddedRomPath()
        : this.commonFunctions.getRomPath();

      const flasherArgs = connectedFlashCart.config.args
        ? connectedFlashCart.config.args
          .replace("%ROM%", romPath)
          .split(" ")
        : [];

      await this.fixPermissions();

      const { processManagerId } = await this.vesProcessService.launchProcess({
        command: "." + sep + basename(connectedFlashCart.config.path),
        args: flasherArgs,
        options: {
          cwd: dirname(connectedFlashCart.config.path),
        },
      });

      connectedFlashCart.status = {
        ...connectedFlashCart.status,
        step: (connectedFlashCart.config.name === VesFlashCartsPrefs.FLASH_CARTS.property.default[0].name) // FlashBoy
          ? "Erasing"
          : "Flashing",
        processId: processManagerId,
        progress: 0,
        log: "",
      };

      // trigger change event
      this.vesState.connectedFlashCarts = this.vesState.connectedFlashCarts;
    }

    this.vesState.isFlashing = true;
    this.commandService.executeCommand(VesFlashCartsCommands.OPEN_WIDGET.id, true);
  }

  abort() {
    for (const connectedFlashCart of this.vesState.connectedFlashCarts) {
      this.vesProcessService.killProcess(connectedFlashCart.status.processId)
      connectedFlashCart.status.progress = -1;
    }

    // trigger change event
    this.vesState.connectedFlashCarts = this.vesState.connectedFlashCarts;

    this.vesState.isFlashing = false;
    this.vesState.flashingProgress = -1;
  }

  /**
   * Give executables respective permission on UNIX systems.
   * Must be executed before every run to ensure permissions are right,
   * even right after reconfiguring paths.
   */
  protected async fixPermissions() {
    if (!isWindows) {
      for (const connectedFlashCart of this.vesState.connectedFlashCarts) {
        await this.vesProcessService.launchProcess({
          command: "chmod",
          args: ["a+x", connectedFlashCart.config.path]
        });
      }
    }
  }

  protected bindEvents() {
    this.vesState.onDidChangeOutputRomExists(outputRomExists => {
      if (outputRomExists && this.vesState.isFlashQueued) {
        this.vesState.isFlashQueued = false;
        this.flash();
      }
    })

    this.vesProcessWatcher.onExit(({ pId }) => {
      for (const connectedFlashCart of this.vesState.connectedFlashCarts) {
        if (connectedFlashCart.status.processId === pId) {
          // TODO: differenciate between done and error
          connectedFlashCart.status.progress = -1;

          // trigger change event
          this.vesState.connectedFlashCarts = this.vesState.connectedFlashCarts;

          let finished = 0;
          for (const connectedFlashCart of this.vesState.connectedFlashCarts) {
            if (connectedFlashCart.status.progress === -1 || connectedFlashCart.status.progress === 100) {
              finished++;
            }
          }

          if (finished === this.vesState.connectedFlashCarts.length) {
            this.vesState.isFlashing = false;
          }
        }
      }
    });

    this.vesProcessWatcher.onData(({ pId, data }) => {
      for (const connectedFlashCart of this.vesState.connectedFlashCarts) {
        if (connectedFlashCart.status.processId === pId) {
          connectedFlashCart.status.log += data;

          this.parseDataFlashBoy(connectedFlashCart, data);
          this.parseDataHyperFlash32(connectedFlashCart, data);

          // trigger change event
          this.vesState.connectedFlashCarts = this.vesState.connectedFlashCarts;
        }
      }
    });
  }

  protected async padRom(size: number): Promise<boolean> {
    const romPath = this.commonFunctions.getRomPath();
    const paddedRomPath = this.getPaddedRomPath();

    if (!this.vesState.outputRomExists) {
      return false;
    }

    const targetSize = size * 128;
    const romContent = readFileSync(romPath);
    const romSize = romContent.length / 1024;
    const timesToMirror = targetSize / romSize;

    if (romSize >= targetSize) {
      return false;
    }

    if (await this.fileService.exists(new URI(paddedRomPath))) {
      unlinkSync(paddedRomPath);
    }

    const stream = createWriteStream(paddedRomPath, { flags: "a" });
    [...Array(timesToMirror)].forEach(function () {
      stream.write(romContent);
    });
    stream.end();

    return true;
  }

  protected getPaddedRomPath() {
    return this.commonFunctions.getRomPath().replace("output.vb", "outputPadded.vb");
  }

  protected async parseDataHyperFlash32(connectedFlashCart: ConnectedFlashCart, data: any) {
    if (connectedFlashCart.config.name === VesFlashCartsPrefs.FLASH_CARTS.property.default[1].name) {
      /* Number of # is only fixed (to 20) on HF32 firmware version 1.9 and above.
        On lower firmwares, the number of # depends on file size.
        TODO: support older firmwares as well? Can the firmware be detected? */

      if (data.includes("Transmitting:")) {
        connectedFlashCart.status = {
          ...connectedFlashCart.status,
          step: "Transmitting",
          progress: Math.floor(data.split("Transmitting: ")[1].length * 2.5),
        };
      } else if (data.includes("Flashing:")) {
        connectedFlashCart.status = {
          ...connectedFlashCart.status,
          step: "Flashing",
          progress: 50 + Math.floor(data.split("Flashing: ")[1].length * 2.5),
        };
      }
    }
  }

  protected async parseDataFlashBoy(connectedFlashCart: ConnectedFlashCart, data: any) {
    if (connectedFlashCart.config.name === VesFlashCartsPrefs.FLASH_CARTS.property.default[0].name) {
      if (data.includes("/2048")) {
        const packetsWritten = parseInt(data.substring(data.lastIndexOf("]") + 2, data.lastIndexOf("/")));
        connectedFlashCart.status = {
          ...connectedFlashCart.status,
          step: "Flashing",
          progress: Math.round(packetsWritten * 100 / 2048),
        };
      }
    }
  }
}