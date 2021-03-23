import { createWriteStream, readFileSync, unlinkSync } from "fs";
import { basename, dirname, join as joinPath, sep } from "path";
import { Device } from "usb";
import { PreferenceService } from "@theia/core/lib/browser";
import { CommandService, isWindows, MessageService } from "@theia/core/lib/common";
import URI from "@theia/core/lib/common/uri";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { VesBuildCommand } from "../../build/commands";
import { VesBuildEnableWslPreference } from "../../build/preferences";
import { convertoToEnvPath, getOs, getResourcesPath, getRomPath } from "../../common/functions";
import { VesStateModel } from "../../common/vesStateModel";
import { VesProcessService } from "../../../common/process-service-protocol";
import { VesFlashCartsPreference } from "../preferences";
import { VesProcessWatcher } from "../../services/process-service/process-watcher";
import { VesOpenFlashCartsWidgetCommand } from "../commands";
import { IMAGE_HYPERFLASH32 } from "../images/hyperflash32";
import { IMAGE_FLASHBOY_PLUS } from "../images/flashboy-plus";

export type FlashCartConfig = {
  name: string
  vid: number
  pid: number
  manufacturer: string
  product: string
  size: number
  path: string
  args: string
  padRom: boolean
  image: string
}

export type ConnectedFlashCart = {
  config: FlashCartConfig
  device: Device
  status: FlashCartStatus
}

export type FlashCartStatus = {
  processId: number
  progress: number
  step: string
  log: string
}

export async function flashCommand(
  commandService: CommandService,
  fileService: FileService,
  messageService: MessageService,
  preferenceService: PreferenceService,
  vesProcessService: VesProcessService,
  vesProcessWatcher: VesProcessWatcher,
  vesState: VesStateModel,
) {
  if (vesState.isFlashQueued) {
    vesState.isFlashQueued = false;
    return;
  } else if (vesState.isFlashing || vesState.connectedFlashCarts.length === 0) {
    commandService.executeCommand(VesOpenFlashCartsWidgetCommand.id);
    return;
  }

  vesState.onDidChangeOutputRomExists(outputRomExists => {
    if (outputRomExists && vesState.isFlashQueued) {
      vesState.isFlashQueued = false;
      flash(
        commandService,
        fileService,
        messageService,
        preferenceService,
        vesProcessService,
        vesProcessWatcher,
        vesState,
      );
    }
  })

  if (vesState.outputRomExists) {
    flash(
      commandService,
      fileService,
      messageService,
      preferenceService,
      vesProcessService,
      vesProcessWatcher,
      vesState,
    );
  } else {
    commandService.executeCommand(VesBuildCommand.id);
    vesState.isFlashQueued = true;
  }
}

async function flash(
  commandService: CommandService,
  fileService: FileService,
  messageService: MessageService,
  preferenceService: PreferenceService,
  vesProcessService: VesProcessService,
  vesProcessWatcher: VesProcessWatcher,
  vesState: VesStateModel
) {
  for (const connectedFlashCart of vesState.connectedFlashCarts) {
    if (!connectedFlashCart.config.path) {
      messageService.error(
        `No path to flasher software provided for cart "${connectedFlashCart.config.name}"`
      );
      continue;
    }

    if (!await fileService.exists(new URI(dirname(connectedFlashCart.config.path)))) {
      messageService.error(
        `Flasher software does not exist at "${connectedFlashCart.config.path}"`
      );
      continue;
    }

    let flasherEnvPath = convertoToEnvPath(
      preferenceService,
      connectedFlashCart.config.path
    );

    const enableWsl = preferenceService.get(VesBuildEnableWslPreference.id);
    if (isWindows && enableWsl) {
      flasherEnvPath.replace(/\.[^/.]+$/, "");
    }

    const romPath = connectedFlashCart.config.padRom &&
      await padRom(fileService, vesState, connectedFlashCart.config.size)
      ? getPaddedRomPath()
      : getRomPath();

    const flasherArgs = connectedFlashCart.config.args
      ? connectedFlashCart.config.args
        .replace("%ROM%", romPath)
        .split(" ")
      : [];

    // fix permissions
    if (!isWindows) {
      vesProcessService.launchProcess({
        command: "chmod",
        args: ["a+x", connectedFlashCart.config.path]
      });
    }

    const { processManagerId } = await vesProcessService.launchProcess({
      command: "." + sep + basename(connectedFlashCart.config.path),
      args: flasherArgs,
      options: {
        cwd: dirname(connectedFlashCart.config.path),
      },
    });

    vesProcessWatcher.onExit(({ pId }) => {
      if (processManagerId === pId) {
        // TODO: differenciate between done and error
        connectedFlashCart.status.progress = -1;

        // trigger change event
        vesState.connectedFlashCarts = vesState.connectedFlashCarts;

        let finished = 0;
        for (const connectedFlashCart of vesState.connectedFlashCarts) {
          if (connectedFlashCart.status.progress === -1 || connectedFlashCart.status.progress === 100) {
            finished++;
          }
        }

        if (finished === vesState.connectedFlashCarts.length) {
          vesState.isFlashing = false;
        }
      }
    });

    connectedFlashCart.status.processId = processManagerId;
    monitorFlashing(vesProcessWatcher, vesState);
  }

  vesState.isFlashing = true;
  commandService.executeCommand(VesOpenFlashCartsWidgetCommand.id, true);
}

export function abortFlash(vesProcessService: VesProcessService, vesState: VesStateModel) {
  for (const connectedFlashCart of vesState.connectedFlashCarts) {
    vesProcessService.killProcess(connectedFlashCart.status.processId)
    connectedFlashCart.status.progress = -1;
  }

  // trigger change event
  vesState.connectedFlashCarts = vesState.connectedFlashCarts;

  vesState.isFlashing = false;
  vesState.flashingProgress = -1;
}

async function padRom(fileService: FileService, vesState: VesStateModel, size: number): Promise<boolean> {
  const romPath = getRomPath();
  const paddedRomPath = getPaddedRomPath();

  if (!vesState.outputRomExists) {
    return false;
  }

  const targetSize = size * 128;
  const romContent = readFileSync(romPath);
  const romSize = romContent.length / 1024;
  const timesToMirror = targetSize / romSize;

  if (romSize >= targetSize) {
    return false;
  }

  if (await fileService.exists(new URI(paddedRomPath))) {
    unlinkSync(paddedRomPath);
  }

  const stream = createWriteStream(paddedRomPath, { flags: "a" });
  [...Array(timesToMirror)].forEach(function () {
    stream.write(romContent);
  });
  stream.end();

  return true;
}

function getPaddedRomPath() {
  return getRomPath().replace("output.vb", "outputPadded.vb");
}

export function getFlashCartConfigs(preferenceService: PreferenceService): FlashCartConfig[] {
  const flashCartConfigs: FlashCartConfig[] = preferenceService.get(VesFlashCartsPreference.id) ?? [];

  const effectiveFlashCartConfigs = flashCartConfigs.length > 0
    ? flashCartConfigs
    : VesFlashCartsPreference.property.default;

  return effectiveFlashCartConfigs.map((flashCartConfig: FlashCartConfig) => {
    return {
      ...flashCartConfig,
      path: flashCartConfig.path
        .replace("%HFCLI%", joinPath(
          getResourcesPath(),
          "binaries",
          "vuengine-studio-tools",
          getOs(),
          "hf-cli",
          isWindows ? "hfcli.exe" : "hfcli"
        ))
        .replace("%PROGVB%", joinPath(
          getResourcesPath(),
          "binaries",
          "vuengine-studio-tools",
          getOs(),
          "prog-vb",
          isWindows ? "prog-vb.exe" : "prog-vb"
        )),
      image: flashCartConfig.image
        .replace("%FBP_IMG%", IMAGE_FLASHBOY_PLUS)
        .replace("%HF32_IMG%", IMAGE_HYPERFLASH32),
    };
  });
}

async function monitorFlashing(
  vesProcessWatcher: VesProcessWatcher,
  vesState: VesStateModel
) {
  for (const connectedFlashCart of vesState.connectedFlashCarts) {
    connectedFlashCart.status = {
      ...connectedFlashCart.status,
      step: "Flashing",
      progress: 0,
      log: "",
    };

    // trigger change event
    vesState.connectedFlashCarts = vesState.connectedFlashCarts;

    // log
    vesProcessWatcher.onData(({ pId, data }) => {
      if (connectedFlashCart.status.processId === pId) {
        connectedFlashCart.status.log += data;
      }
    });

    switch (connectedFlashCart.config.name) {
      // FlashBoy (Plus)
      case VesFlashCartsPreference.property.default[0].name:
        monitorFlashingFlashBoy(connectedFlashCart, vesProcessWatcher, vesState);
        break;
      // HyperFlash32:
      case VesFlashCartsPreference.property.default[1].name:
        monitorFlashingHyperFlash32(connectedFlashCart, vesProcessWatcher, vesState);
        break;
    }
  }
}

async function monitorFlashingHyperFlash32(
  connectedFlashCart: ConnectedFlashCart,
  vesProcessWatcher: VesProcessWatcher,
  vesState: VesStateModel,
) {
  /* Number of # is only fixed (to 20) on HF32 firmware version 1.9 and above. 
     On lower firmwares, the number of # depends on file size.
     TODO: support older firmwares as well? Can the firmware be detected? */

  vesProcessWatcher.onData(({ pId, data }) => {
    if (connectedFlashCart.status.processId === pId) {
      if (data.includes("Transmitting:")) {
        connectedFlashCart.status = {
          ...connectedFlashCart.status,
          step: "Transmitting",
          progress: Math.floor(data.split("Transmitting: ")[1].length * 2.5),
        };

        // trigger change event
        vesState.connectedFlashCarts = vesState.connectedFlashCarts;
      } else if (data.includes("Flashing:")) {
        connectedFlashCart.status = {
          ...connectedFlashCart.status,
          step: "Flashing",
          progress: 50 + Math.floor(data.split("Flashing: ")[1].length * 2.5),
        };

        // trigger change event
        vesState.connectedFlashCarts = vesState.connectedFlashCarts;
      }
    }
  });
}

async function monitorFlashingFlashBoy(
  connectedFlashCart: ConnectedFlashCart,
  vesProcessWatcher: VesProcessWatcher,
  vesState: VesStateModel,
) {
  connectedFlashCart.status.step = "Erasing";

  // trigger change event
  vesState.connectedFlashCarts = vesState.connectedFlashCarts;

  vesProcessWatcher.onData(({ pId, data }) => {
    if (connectedFlashCart.status.processId === pId && data.includes("/2048")) {
      const packetsWritten = parseInt(data.substring(data.lastIndexOf("]") + 2, data.lastIndexOf("/")));
      connectedFlashCart.status = {
        ...connectedFlashCart.status,
        step: "Flashing",
        progress: Math.round(packetsWritten * 100 / 2048),
      };

      // trigger change event
      vesState.connectedFlashCarts = vesState.connectedFlashCarts;
    }
  });
}