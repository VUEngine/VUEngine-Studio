import { PreferenceService } from "@theia/core/lib/browser";
import {
  CommandService,
  isWindows,
  MessageService,
} from "@theia/core/lib/common";
import URI from "@theia/core/lib/common/uri";
import { FileService } from "@theia/filesystem/lib/browser/file-service";
import { TerminalService } from "@theia/terminal/lib/browser/base/terminal-service";
import { createWriteStream, readFileSync, unlinkSync } from "fs";
import { dirname, join as joinPath } from "path";
import { VesUsbService } from "../../../common/usb-service-protocol";

import { VesBuildCommand } from "../../build/commands";
import { VesBuildEnableWslPreference } from "../../build/preferences";
import { convertoToEnvPath, getOs, getResourcesPath, getRomPath } from "../../common/functions";
import { VesStateModel } from "../../common/vesStateModel";
import { VesFlashCartsCustomPreference } from "../preferences";

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

export async function flashCommand(
  commandService: CommandService,
  fileService: FileService,
  messageService: MessageService,
  preferenceService: PreferenceService,
  terminalService: TerminalService,
  vesUsbService: VesUsbService,
  vesState: VesStateModel
) {
  if (vesState.isFlashQueued) {
    vesState.isFlashQueued = false;
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
        vesState
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
      vesState
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
      path: "",
      args: "%ROM%",
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
  vesState: VesStateModel
) {
  if (!vesState.connectedFlashCart) {
    return;
  }

  if (!vesState.connectedFlashCart.path) {
    messageService.error(
      `No path to flasher software provided for cart "${vesState.connectedFlashCart.name}"`
    );
    return;
  }

  if (!await fileService.exists(new URI(dirname(vesState.connectedFlashCart.path)))) {
    messageService.error(
      `Flasher software does not exist at "${vesState.connectedFlashCart.path}"`
    );
    return;
  }

  const fixPermissions = isWindows ? "" : `chmod a+x "${vesState.connectedFlashCart.path}" && `;

  let flasherEnvPath = convertoToEnvPath(
    preferenceService,
    vesState.connectedFlashCart.path
  );

  const enableWsl = preferenceService.get(VesBuildEnableWslPreference.id);
  if (isWindows && enableWsl) {
    flasherEnvPath.replace(/\.[^/.]+$/, "");
  }

  const romPath =
    vesState.connectedFlashCart.padRom &&
      await padRom(fileService, vesState, vesState.connectedFlashCart.size)
      ? getPaddedRomPath()
      : getRomPath();

  const flasherArgs = vesState.connectedFlashCart.args
    ? " " + vesState.connectedFlashCart.args.replace("%ROM%", `"${romPath}"`)
    : "";

  const terminalId = "vuengine-flash";
  const terminalWidget = terminalService.getById(terminalId) || await terminalService.newTerminal({
    title: "Flash",
    id: terminalId
  });
  await terminalWidget.start();
  terminalWidget.clearOutput();
  //await new Promise(resolve => setTimeout(resolve, 1000));
  terminalWidget.sendText(`${fixPermissions}"${flasherEnvPath}" ${flasherArgs}\n`);
  terminalService.open(terminalWidget);
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
