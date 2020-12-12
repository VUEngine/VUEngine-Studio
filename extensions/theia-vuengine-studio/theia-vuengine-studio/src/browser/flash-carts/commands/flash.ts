import { PreferenceService } from "@theia/core/lib/browser";
import {
  CommandService,
  isWindows,
  MessageService,
} from "@theia/core/lib/common";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { TerminalWidgetOptions } from "@theia/terminal/lib/browser/base/terminal-widget";
import { WorkspaceService } from "@theia/workspace/lib/browser";
import { createWriteStream, existsSync, readFileSync, unlinkSync } from "fs";
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

type ConnectedFlashCart = {
  config: FlashCartConfig;
  device: Device;
};

export async function flashCommand(
  commandService: CommandService,
  messageService: MessageService,
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  vesStateModel: VesStateModel,
  workspaceService: WorkspaceService
) {
  const flashCartConfigs: FlashCartConfig[] = getFlashCartConfigs(
    preferenceService
  );

  const connectedFlashCart:
    | ConnectedFlashCart
    | undefined = await detectFlashCart(flashCartConfigs);

  if (!connectedFlashCart) {
    messageService.error(`No connected flash cart could be found.`);
  } else if (existsSync(getRomPath(workspaceService))) {
    flash(
      messageService,
      preferenceService,
      terminalService,
      workspaceService,
      connectedFlashCart
    );
  } else {
    commandService.executeCommand(VesBuildCommand.id);
    vesStateModel.isFlashQueued = true;
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
        "app",
        "binaries",
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
  messageService: MessageService,
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  workspaceService: WorkspaceService,
  connectedFlashCart: ConnectedFlashCart
) {
  if (!connectedFlashCart.config.path) {
    messageService.error(
      `No path to flasher software provided for cart "${connectedFlashCart.config.name}"`
    );
    return;
  }

  if (!existsSync(dirname(connectedFlashCart.config.path))) {
    messageService.error(
      `Flasher software does not exist at "${connectedFlashCart.config.path}"`
    );
    return;
  }

  let flasherEnvPath = convertoToEnvPath(
    preferenceService,
    connectedFlashCart.config.path
  );
  const enableWsl = preferenceService.get("build.enableWsl");
  if (isWindows && enableWsl) {
    flasherEnvPath.replace(/\.[^/.]+$/, "");
  }

  const romPath =
    connectedFlashCart.config.padRom &&
      padRom(workspaceService, connectedFlashCart.config.size)
      ? getPaddedRomPath(workspaceService)
      : getRomPath(workspaceService);

  const flasherArgs = connectedFlashCart.config.args
    ? " " + connectedFlashCart.config.args.replace("%ROM%", `"${romPath}"`)
    : "";

  messageService.info(`"${flasherEnvPath}" ${flasherArgs}`);

  const terminalWidgetOptions: TerminalWidgetOptions = {
    title: "Flash",
  };
  const terminalWidget = await terminalService.newTerminal(
    terminalWidgetOptions
  );
  terminalWidget.start();
  terminalWidget.sendText(`"${flasherEnvPath}" ${flasherArgs}`);
  terminalService.open(terminalWidget);
}

function padRom(workspaceService: WorkspaceService, size: number): boolean {
  const romPath = getRomPath(workspaceService);
  const paddedRomPath = getPaddedRomPath(workspaceService);

  if (!existsSync(romPath)) {
    return false;
  }

  const targetSize = size * 128;
  const romContent = readFileSync(romPath);
  const romSize = romContent.length / 1024;
  const timesToMirror = targetSize / romSize;

  if (romSize >= targetSize) {
    return false;
  }

  if (existsSync(paddedRomPath)) {
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
