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
};

export type ConnectedFlashCart = {
  config: FlashCartConfig,
  device: Device,
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
    // TODO: open terminal
    return;
  }

  vesState.onDidChangeOutputRomExists(outputRomExists => {
    if (outputRomExists && vesState.isFlashQueued) {
      vesState.isFlashQueued = false;
      flash(
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
  vesState.isFlashing = true;

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

  const processId = await vesProcessService.launchProcess({
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
  await terminalWidget.start(processId);
  terminalWidget.clearOutput();
  terminalService.open(terminalWidget);
  // showFlashingMessage(messageService, vesProcessWatcher, processId);

  vesProcessWatcher.onExit(({ pId }) => {
    if (processId === pId) {
      vesState.isFlashing = false;
    }
  });
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

// async function showFlashingMessage(
//   messageService: MessageService,
//   vesProcessWatcher: VesProcessWatcher,
//   processId: number,
// ) {
//   /*
//   Notes on prog-vb output
//   1) Erasing device...
//   2) Flashing...
//   3) [00:01:26] [###################################>----] 1806/2048 packets (12s)
//   4) Image flashed successfully.
//   Or: 
//   1) Error: Input ROM was less than 16kB in length, greater than 2MB in length, or a non power of two length.
//   */

//   const taskHead = `<img style="position:absolute;left:10px;top:15px;background-color:#222;border-radius:5px;padding:10px;height:100px;border:1px dashed rgba(255,255,255,0.2)" src="https://files.virtual-boy.com/album/1042058/hf32_cartfront.png"/>
// <div style="padding-left:100px;margin-bottom:10px;"><b>Flashing ROM image to <i>FlashBoy (Plus)</i></b><br><br>`;

//   const progressMessage = await messageService.showProgress({
//     text: "",
//     actions: ["Abort"],
//   });
//   progressMessage.report({
//     message: taskHead + "<br><br><br>", work: { done: 0, total: 2048 }
//   });

//   vesProcessWatcher.onData(({ pId, data }) => {
//     if (processId === pId) {
//       if (data.includes("Error")) {
//         progressMessage.report({ message: `${taskHead}${data}.</div>`, work: { done: 0, total: 2048 } });
//       } else if (data.includes("Erasing")) {
//         progressMessage.report({ message: `${taskHead}Erasing device... <br><br><i>Working, do not remove your FlashBoy (Plus)</i>.</div>`, work: { done: 0, total: 2048 } });
//       } else if (data.includes("/2048")) {
//         const packetsWrittenMatch = data.match(new RegExp("] " + "(.*)" + "/2048"));
//         const packetsWritten = packetsWrittenMatch ? parseInt(packetsWrittenMatch[1]) : 0;
//         console.log(packetsWrittenMatch, packetsWritten);
//         progressMessage.report({ message: `${taskHead}<i class="fa fa-check"></i> Erasing device done.<br>Flashing... (${packetsWritten}/2048)<br><br><i>Working, do not remove your FlashBoy (Plus)</i>.</div>`, work: { done: packetsWritten, total: 2048 } })
//       } else if (data.includes("successfully")) {
//         progressMessage.report({ message: `${taskHead}<i class="fa fa-check"></i> Erasing device done.<br><i class="fa fa-check"></i> Flashing done.<br><br>All done. You may now remove your FlashBoy (Plus)..</div>`, work: { done: 2048, total: 2048 } })
//       }
//     }
//   });
// }