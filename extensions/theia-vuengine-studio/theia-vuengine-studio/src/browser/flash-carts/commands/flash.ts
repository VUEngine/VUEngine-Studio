import { createWriteStream, readFileSync, unlinkSync } from "fs";
import { basename, dirname, join as joinPath, sep } from "path";
import { Device } from "usb";
import { PreferenceService } from "@theia/core/lib/browser";
import { CommandService, isWindows, MessageService } from "@theia/core/lib/common";
import URI from "@theia/core/lib/common/uri";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { VesBuildCommand } from "../../build/commands";
import { VesBuildEnableWslPreference } from "../../build/preferences";
import { convertoToEnvPath, getOs, getResourcesPath, getRomPath } from "../../common/functions";
import { VesStateModel } from "../../common/vesStateModel";
import { VesProcessService } from "../../../common/process-service-protocol";
import { VesFlashCartsPreference } from "../preferences";
import { VesProcessWatcher } from "../../services/process-service/process-watcher";
import { VesOpenFlashCartsWidgetCommand } from "../commands";

export type FlashCartConfig = {
  name: string;
  vid: number;
  pid: number;
  manufacturer: string;
  product: string;
  size: number;
  path: string;
  args: string;
  padRom: boolean;
  image: string;
};

export type ConnectedFlashCart = {
  config: FlashCartConfig,
  device: Device,
}

export type FlashingProgress = {
  step: string,
  progress: number
}

export async function flashCommand(
  commandService: CommandService,
  fileService: FileService,
  messageService: MessageService,
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  vesProcessService: VesProcessService,
  vesProcessWatcher: VesProcessWatcher,
  vesState: VesStateModel,
) {
  if (vesState.isFlashQueued) {
    vesState.isFlashQueued = false;
    return;
  } else if (vesState.isFlashing) {
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
        terminalService,
        vesProcessService,
        vesProcessWatcher,
        vesState,
      );
    }
  })

  if (!vesState.connectedFlashCart) {
    messageService.error(`No connected flash cart could be found.`);
  } else if (vesState.outputRomExists) {
    flash(
      commandService,
      fileService,
      messageService,
      preferenceService,
      terminalService,
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
  terminalService: TerminalService,
  vesProcessService: VesProcessService,
  vesProcessWatcher: VesProcessWatcher,
  vesState: VesStateModel
) {
  if (!vesState.connectedFlashCart) {
    return;
  }

  if (!vesState.connectedFlashCart.config.path) {
    messageService.error(
      `No path to flasher software provided for cart "${vesState.connectedFlashCart.config.name}"`
    );
    return;
  }

  if (!await fileService.exists(new URI(dirname(vesState.connectedFlashCart.config.path)))) {
    messageService.error(
      `Flasher software does not exist at "${vesState.connectedFlashCart.config.path}"`
    );
    return;
  }

  let flasherEnvPath = convertoToEnvPath(
    preferenceService,
    vesState.connectedFlashCart.config.path
  );

  const enableWsl = preferenceService.get(VesBuildEnableWslPreference.id);
  if (isWindows && enableWsl) {
    flasherEnvPath.replace(/\.[^/.]+$/, "");
  }

  const romPath = vesState.connectedFlashCart.config.padRom &&
    await padRom(fileService, vesState, vesState.connectedFlashCart.config.size)
    ? getPaddedRomPath()
    : getRomPath();

  const flasherArgs = vesState.connectedFlashCart.config.args
    ? vesState.connectedFlashCart.config.args
      .replace("%ROM%", romPath)
      .replace("%PORT%", `...`) // TODO
      .split(" ")
    : [];

  // fix permissions
  // TODO: do this only once on app startup
  if (!isWindows) {
    vesProcessService.launchProcess({
      command: "chmod",
      args: ["a+x", vesState.connectedFlashCart.config.path]
    });
  }

  const { terminalProcessId, processManagerId } = await vesProcessService.launchProcess({
    command: "." + sep + basename(vesState.connectedFlashCart.config.path),
    args: flasherArgs,
    options: {
      cwd: dirname(vesState.connectedFlashCart.config.path),
    },
  });

  const terminalWidget = terminalService.getById(getTerminalId()) || await terminalService.newTerminal({
    title: "Flash",
    id: getTerminalId()
  });
  await terminalWidget.start(terminalProcessId);
  terminalWidget.clearOutput();
  //terminalService.open(terminalWidget);

  vesProcessWatcher.onExit(({ pId }) => {
    if (processManagerId === pId) {
      vesState.isFlashing = 0;
    }
  });

  vesState.isFlashing = processManagerId;
  monitorFlashing(vesProcessWatcher, vesState);

  commandService.executeCommand(VesOpenFlashCartsWidgetCommand.id, true);
}

function getTerminalId(): string {
  return "ves-flash";
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
    };
  });
}

async function monitorFlashing(
  vesProcessWatcher: VesProcessWatcher,
  vesState: VesStateModel
) {
  switch (vesState.connectedFlashCart?.config.name) {
    // FlashBoy (Plus)
    case VesFlashCartsPreference.property.default[0].name:
      monitorFlashingFlashBoy(vesProcessWatcher, vesState);
      break;
    // HyperFlash32:
    case VesFlashCartsPreference.property.default[1].name:
      monitorFlashingHyperFlash32(vesProcessWatcher, vesState);
      break;
    default:
      vesState.flashingProgress = {
        step: "Flashing",
        progress: -1,
      };
      break;
  }
}

// TODO
async function monitorFlashingHyperFlash32(
  vesProcessWatcher: VesProcessWatcher,
  vesState: VesStateModel
) {
  vesState.flashingProgress = {
    step: "Flashing",
    //step: "Erasing",
    progress: -1,
  };

  vesProcessWatcher.onData(({ pId, data }) => {
    if (vesState.isFlashing === pId && data.includes("")) {
      // const packetsWritten = parseInt(data.substring(data.lastIndexOf("]") + 2, data.lastIndexOf("/")));
      // vesState.flashingProgress = {
      //   step: "Flashing",
      //   progress: Math.round(packetsWritten * 100 / 2048),
      // };
    }
  });
}

async function monitorFlashingFlashBoy(
  vesProcessWatcher: VesProcessWatcher,
  vesState: VesStateModel
) {
  vesState.flashingProgress = {
    step: "Erasing",
    progress: -1,
  };

  vesProcessWatcher.onData(({ pId, data }) => {
    if (vesState.isFlashing === pId && data.includes("/2048")) {
      const packetsWritten = parseInt(data.substring(data.lastIndexOf("]") + 2, data.lastIndexOf("/")));
      vesState.flashingProgress = {
        step: "Flashing",
        progress: Math.round(packetsWritten * 100 / 2048),
      };
    }
  });
}