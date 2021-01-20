import { createWriteStream, readFileSync, unlinkSync } from "fs";
import { basename, dirname, join as joinPath, sep } from "path";
import { Device } from "usb";
import { PreferenceService } from "@theia/core/lib/browser";
import { CommandService, isOSX, isWindows, MessageService } from "@theia/core/lib/common";
import URI from "@theia/core/lib/common/uri";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { VesUsbService } from "../../../common/usb-service-protocol";
import { VesBuildCommand } from "../../build/commands";
import { VesBuildEnableWslPreference } from "../../build/preferences";
import { convertoToEnvPath, getOs, getResourcesPath, getRomPath } from "../../common/functions";
import { VesStateModel } from "../../common/vesStateModel";
import { VesFlashCartsCustomPreference } from "../preferences";
import { VesProcessService } from "../../../common/process-service-protocol";

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
  vesState: VesStateModel,
  vesUsbService: VesUsbService
) {
  if (vesState.isFlashQueued) {
    vesState.isFlashQueued = false;
    return;
  } else if (vesState.isFlashing) {
    // TODO: open terminal
    return;
  }

  await detectFlashCart(preferenceService, vesState, vesUsbService);
  // vesUsbService.onDeviceConnected((device) => {
  //   console.log("HEUREKA", device);
  // });

  vesState.onDidChangeOutputRomExists(outputRomExists => {
    if (outputRomExists && vesState.isFlashQueued) {
      vesState.isFlashQueued = false;
      flash(
        fileService,
        messageService,
        preferenceService,
        terminalService,
        vesProcessService,
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
      vesState,
    );
  } else {
    commandService.executeCommand(VesBuildCommand.id);
    vesState.isFlashQueued = true;
  }
}

export async function detectFlashCart(
  preferenceService: PreferenceService,
  vesState: VesStateModel,
  vesUsbService: VesUsbService,
) {
  const flashCartConfigs: FlashCartConfig[] = getFlashCartConfigs(
    preferenceService
  );
  vesState.connectedFlashCart = await vesUsbService.detectFlashCart(...flashCartConfigs);
}

export function getFlashCartConfigs(preferenceService: PreferenceService) {
  const flashCartConfigs = [
    {
      name: "FlashBoy (Plus)",
      vid: 6017,
      pid: 2466,
      manufacturer: "Richard Hutchinson",
      product: "FlashBoy",
      size: 16,
      path: joinPath(
        getResourcesPath(),
        "binaries",
        "vuengine-studio-tools",
        getOs(),
        "prog-vb",
        isWindows ? "prog-vb.exe" : "prog-vb"
      ),
      args: "%ROM%",
      padRom: true,
    },
    {
      name: "HyperFlash32",
      vid: 1027,
      pid: 24577,
      manufacturer: "FTDI",
      product: "FT232R",
      size: 32,
      path: joinPath(
        getResourcesPath(),
        "binaries",
        "vuengine-studio-tools",
        getOs(),
        "hf-cli",
        isWindows ? "hfcli.exe" : "hfcli"
      ),
      args: isOSX
        ? `-p %PORT% -s %ROM% -u --slow`
        : `-p %PORT% -s %ROM% -u`,
      padRom: false,
    },
  ];

  const userDefinedFlashCartConfigs: FlashCartConfig[] | undefined =
    preferenceService.get(VesFlashCartsCustomPreference.id) ?? [];

  return [...flashCartConfigs, ...userDefinedFlashCartConfigs];
}

async function flash(
  fileService: FileService,
  messageService: MessageService,
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  vesProcessService: VesProcessService,
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
  // showFlashingMessage(messageService); return;
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

// async function showFlashingMessage(messageService: MessageService) {
//   /*
//   Notes on prog-vb output
//   1) Erasing device...
//   2) Flashing...
//   3) [00:01:26] [###################################>----] 1806/2048 packets (12s)
//   4) Image flashed successfully.
//   */

//   const progressMessage = await messageService.showProgress({
//     text: `<img style="position:absolute;left:10px;top:15px;background-color:#222;border-radius:5px;padding:10px;height:100px;border:1px dashed rgba(255,255,255,0.2)" src="https://files.virtual-boy.com/album/1042058/hf32_cartfront.png"/>
//     <div style="padding-left:100px;margin-bottom:10px;">Flashing ROM image to <i>HyperFlash32</i>`,
//     actions: ["Abort"],
//   });
//   progressMessage.report({message: `<br><br>Erasing device... <br><br>Working, do not remove your HyperFlash32.</div>`, work: {done: 0, total: 2048}}),

//   setTimeout(
//     () => progressMessage.report({message: `<br><br><i class="fa fa-check"></i> Erasing device done.<br>Flashing... (10/2048)<br><br>Working, do not remove your HyperFlash32.</div>`, work: {done: 10, total: 2048}}),
//     4000
//   );

//   setTimeout(
//     () => progressMessage.report({message: `<br><br><i class="fa fa-check"></i> Erasing device done.<br>Flashing... (256/2048)<br><br>Working, do not remove your HyperFlash32.</div>`, work: {done: 256, total: 2048}}),
//     5000
//   );

//   setTimeout(
//     () => progressMessage.report({message: `<br><br><i class="fa fa-check"></i> Erasing device done.<br>Flashing... (512/2048)<br><br>Working, do not remove your HyperFlash32.</div>`, work: {done: 512, total: 2048}}),
//     6000
//   );

//   setTimeout(
//     () => progressMessage.report({message: `<br><br><i class="fa fa-check"></i> Erasing device done.<br>Flashing... (1024/2048)<br><br>Working, do not remove your HyperFlash32.</div>`, work: {done: 1024, total: 2048}}),
//     7000
//   );

//   setTimeout(
//     () => progressMessage.report({message: `<br><br><i class="fa fa-check"></i> Erasing device done.<br><i class="fa fa-check"></i> Flashing done.<br><br>All done. You may now remove your HyperFlash32..</div>`, work: {done: 2048, total: 2048}}),
//     8000
//   );
// }