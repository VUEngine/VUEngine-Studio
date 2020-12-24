import { PreferenceService } from "@theia/core/lib/browser";
import {
  CommandService,
  isWindows,
  MessageService,
} from "@theia/core/lib/common";
import URI from "@theia/core/lib/common/uri";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { createWriteStream, readFileSync, unlinkSync } from "fs";
import { dirname, join as joinPath } from "path";
import { /*getDeviceList, */ Device } from "usb";

import { VesBuildCommand } from "../../build/commands";
import { convertoToEnvPath, getResourcesPath, getRomPath } from "../../common";
import { VesStateModel } from "../../common/vesStateModel";

type FlashCartConfig = {
  name: string;
  vid: number;
  pid: number;
  manufacturer: string;
  product: string;
  serialNumber: string;
  size: number;
  path: string;
  args: string;
  padRom: boolean;
};

export type ConnectedFlashCart = {
  config: FlashCartConfig;
  device: Device;
};

export async function flashCommand(
  commandService: CommandService,
  fileService: FileService,
  messageService: MessageService,
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  vesState: VesStateModel,
  workspaceService: WorkspaceService
) {

  const flashCartConfigs: FlashCartConfig[] = getFlashCartConfigs(
    preferenceService
  );

  vesState.connectedFlashCart = await detectFlashCart(flashCartConfigs);

  vesState.onDidChangeOutputRomExists(outputRomExists => {
    if (outputRomExists && vesState.isFlashQueued) {
      vesState.isFlashQueued = false;
      flash(
        fileService,
        messageService,
        preferenceService,
        terminalService,
        vesState,
        workspaceService
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
      vesState,
      workspaceService
    );
  } else {
    commandService.executeCommand(VesBuildCommand.id);
    vesState.isFlashQueued = true;
  }
}

async function detectFlashCart(
  flashCartConfigs: FlashCartConfig[]
): Promise<ConnectedFlashCart | undefined> {
  // const devices: Device[] = getDeviceList();
  // let manufacturer: string | undefined;
  // let product: string | undefined;
  // let serialNumber: string | undefined;

  // for (const flashCartConfig of flashCartConfigs) {
  //     for (let i = 0; i < devices.length; i++) {
  //         const deviceDesc = devices[i].deviceDescriptor;
  //         if (
  //             deviceDesc.idVendor == flashCartConfig.vid &&
  //             deviceDesc.idProduct == flashCartConfig.pid
  //         ) {
  //             devices[i].open();
  //             manufacturer = await new Promise((resolve, reject) => {
  //                 devices[i].getStringDescriptor(
  //                     devices[i].deviceDescriptor.iManufacturer,
  //                     (error, data) => {
  //                         resolve(data);
  //                     }
  //                 );
  //             });
  //             product = await new Promise((resolve, reject) => {
  //                 devices[i].getStringDescriptor(
  //                     devices[i].deviceDescriptor.iProduct,
  //                     (error, data) => {
  //                         resolve(data);
  //                     }
  //                 );
  //             });
  //             serialNumber = await new Promise((resolve, reject) => {
  //                 devices[i].getStringDescriptor(
  //                     devices[i].deviceDescriptor.iSerialNumber,
  //                     (error, data) => {
  //                         resolve(data);
  //                     }
  //                 );
  //             });
  //             devices[i].close();

  //             if (
  //                 (flashCartConfig.manufacturer === "" ||
  //                     manufacturer?.includes(flashCartConfig.manufacturer)) &&
  //                 (flashCartConfig.product === "" ||
  //                     product?.includes(flashCartConfig.product)) &&
  //                 (flashCartConfig.serialNumber === "" ||
  //                     serialNumber?.includes(flashCartConfig.serialNumber))
  //             ) {
  //                 return {
  //                     config: flashCartConfig,
  //                     device: devices[i],
  //                 };
  //             }
  //         }
  //     }
  // }

  return;
}

function getFlashCartConfigs(preferenceService: PreferenceService) {
  const flashCartConfigs = [
    {
      name: "FlashBoy (Plus)",
      vid: 6017,
      pid: 2466,
      manufacturer: "Richard Hutchinson",
      product: "FlashBoy",
      serialNumber: "",
      size: 16,
      path: joinPath(
        getResourcesPath(),
        "binaries",
        "vuengine-studio-tools",
        "prog-vb",
        isWindows ? "prog-vb.exe" : "prog-vb"
      ),
      args: "%ROM%",
      padRom: true,
    },
    {
      name: "HyperFlash32",
      vid: 0,
      pid: 0,
      manufacturer: "",
      product: "",
      serialNumber: "",
      size: 32,
      path: "",
      args: "%ROM%",
      padRom: false,
    },
  ];

  const userDefinedFlashCartConfigs: FlashCartConfig[] | undefined =
    preferenceService.get("flashCarts.customFlashCarts") ?? [];

  return [...flashCartConfigs, ...userDefinedFlashCartConfigs];
}

async function flash(
  fileService: FileService,
  messageService: MessageService,
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  vesState: VesStateModel,
  workspaceService: WorkspaceService
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
  const enableWsl = preferenceService.get("build.enableWsl");
  if (isWindows && enableWsl) {
    flasherEnvPath.replace(/\.[^/.]+$/, "");
  }

  const romPath =
    vesState.connectedFlashCart.config.padRom &&
      await padRom(fileService, vesState, workspaceService, vesState.connectedFlashCart.config.size)
      ? getPaddedRomPath(workspaceService)
      : getRomPath(workspaceService);

  const flasherArgs = vesState.connectedFlashCart.config.args
    ? " " + vesState.connectedFlashCart.config.args.replace("%ROM%", `"${romPath}"`)
    : "";

  const terminalId = "vuengine-flash";
  const terminalWidget = terminalService.getById(terminalId) || await terminalService.newTerminal({
    title: "Flash",
    id: terminalId
  });
  await terminalWidget.start();
  terminalWidget.clearOutput();
  //await new Promise(resolve => setTimeout(resolve, 1000));
  terminalWidget.sendText(`"${flasherEnvPath}" ${flasherArgs}\n`);
  terminalService.open(terminalWidget);
}

async function padRom(fileService: FileService, vesState: VesStateModel, workspaceService: WorkspaceService, size: number): Promise<boolean> {
  const romPath = getRomPath(workspaceService);
  const paddedRomPath = getPaddedRomPath(workspaceService);

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

function getPaddedRomPath(workspaceService: WorkspaceService) {
  return getRomPath(workspaceService).replace("output.vb", "outputPadded.vb");
}
