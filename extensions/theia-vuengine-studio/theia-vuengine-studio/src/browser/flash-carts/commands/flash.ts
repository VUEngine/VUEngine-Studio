// import { PreferenceService } from "@theia/core/lib/browser";
// import { MessageService } from "@theia/core/lib/common";
// import { createWriteStream, existsSync, readFileSync, unlinkSync } from "fs";
// import { dirname, join as joinPath } from "path";
// import { getDeviceList, Device } from "usb";
// import {
//   convertoToEnvPath,
//   getOs,
//   getResourcesPath,
//   getWorkspaceRoot,
// } from "../../common";

// type FlashCartConfig = {
//   name: string;
//   vid: number;
//   pid: number;
//   manufacturer: string;
//   product: string;
//   serialNumber: string;
//   size: number;
//   path: string;
//   args: string;
//   padRom: boolean;
// };

// type ConnectedFlashCart = {
//   config: FlashCartConfig;
//   device: Device;
// };

// export async function flashCommand(
//   messageService: MessageService,
//   preferenceService: PreferenceService
// ) {
//   const flashCartConfigs: FlashCartConfig[] = getFlashCartConfigs(
//     preferenceService
//   );
//   const connectedFlashCart:
//     | ConnectedFlashCart
//     | undefined = await detectFlashCart(flashCartConfigs);

//   if (!connectedFlashCart) {
//     messageService.error(`No connected flash cart could be found.`);
//   } else if (!existsSync(getRomPath())) {
//     // TODO queue
//   } else {
//     flash(messageService, preferenceService, connectedFlashCart);
//   }
// }

// async function detectFlashCart(flashCartConfigs: FlashCartConfig[]) {
//   const devices: Device[] = getDeviceList();
//   let manufacturer: string | undefined;
//   let product: string | undefined;
//   let serialNumber: string | undefined;

//   for (const flashCartConfig of flashCartConfigs) {
//     for (let i = 0; i < devices.length; i++) {
//       const deviceDesc = devices[i].deviceDescriptor;
//       if (
//         deviceDesc.idVendor == flashCartConfig.vid &&
//         deviceDesc.idProduct == flashCartConfig.pid
//       ) {
//         devices[i].open();
//         manufacturer = await new Promise((resolve, reject) => {
//           devices[i].getStringDescriptor(
//             devices[i].deviceDescriptor.iManufacturer,
//             (error, data) => {
//               resolve(data);
//             }
//           );
//         });
//         product = await new Promise((resolve, reject) => {
//           devices[i].getStringDescriptor(
//             devices[i].deviceDescriptor.iProduct,
//             (error, data) => {
//               resolve(data);
//             }
//           );
//         });
//         serialNumber = await new Promise((resolve, reject) => {
//           devices[i].getStringDescriptor(
//             devices[i].deviceDescriptor.iSerialNumber,
//             (error, data) => {
//               resolve(data);
//             }
//           );
//         });
//         devices[i].close();

//         if (
//           (flashCartConfig.manufacturer === "" ||
//             manufacturer?.includes(flashCartConfig.manufacturer)) &&
//           (flashCartConfig.product === "" ||
//             product?.includes(flashCartConfig.product)) &&
//           (flashCartConfig.serialNumber === "" ||
//             serialNumber?.includes(flashCartConfig.serialNumber))
//         ) {
//           return {
//             config: flashCartConfig,
//             device: devices[i],
//           };
//         }
//       }
//     }
//   }
// }

// function getFlashCartConfigs(preferenceService: PreferenceService) {
//   const flashCartConfigs = [
//     {
//       name: "FlashBoy (Plus)",
//       vid: 6017,
//       pid: 2466,
//       manufacturer: "Richard Hutchinson",
//       product: "FlashBoy",
//       serialNumber: "",
//       size: 16,
//       path: joinPath(
//         getResourcesPath(),
//         "app",
//         "binaries",
//         "prog-vb",
//         getOs() === "win" ? "prog-vb.exe" : "prog-vb"
//       ),
//       args: "%ROM%",
//       padRom: true,
//     },
//     {
//       name: "HyperFlash32",
//       vid: 0,
//       pid: 0,
//       manufacturer: "",
//       product: "",
//       serialNumber: "",
//       size: 32,
//       path: "",
//       args: "%ROM%",
//       padRom: false,
//     },
//   ];

//   const userDefinedFlashCartConfigs: FlashCartConfig[] | undefined =
//     preferenceService.get("flashCarts.customFlashCarts") ?? [];

//   return [...flashCartConfigs, ...userDefinedFlashCartConfigs];
// }

// function flash(
//   messageService: MessageService,
//   preferenceService: PreferenceService,
//   connectedFlashCart: ConnectedFlashCart
// ) {
//   if (!connectedFlashCart.config.path) {
//     messageService.error(
//       `No path to flasher software provided for cart "${connectedFlashCart.config.name}"`
//     );
//     return;
//   }

//   if (!existsSync(dirname(connectedFlashCart.config.path))) {
//     messageService.error(
//       `Flasher software does not exist at "${connectedFlashCart.config.path}"`
//     );
//     return;
//   }

//   //   const terminal = getTerminal("Flash");
//   let flasherEnvPath = convertoToEnvPath(
//     preferenceService,
//     connectedFlashCart.config.path
//   );
//   const enableWsl = preferenceService.get("build.enableWsl");
//   if (getOs() === "win" && enableWsl) {
//     flasherEnvPath.replace(/\.[^/.]+$/, "");
//   }

//   const romPath =
//     connectedFlashCart.config.padRom && padRom(connectedFlashCart.config.size)
//       ? getPaddedRomPath()
//       : getRomPath();

//   const flasherArgs = connectedFlashCart.config.args
//     ? " " + connectedFlashCart.config.args.replace("%ROM%", `"${romPath}"`)
//     : "";

//   messageService.info(`"${flasherEnvPath}" ${flasherArgs}`);
//   //   terminal.sendText(`"${flasherEnvPath}" ${flasherArgs}`);
//   //   terminal.show(true);
// }

// function getRomPath(): string {
//   return joinPath(getWorkspaceRoot(), "build", "output.vb");
// }

// function padRom(size: number): boolean {
//   const romPath = getRomPath();
//   const paddedRomPath = getPaddedRomPath();

//   if (!existsSync(romPath)) {
//     return false;
//   }

//   const targetSize = size * 128;
//   const romContent = readFileSync(romPath);
//   const romSize = romContent.length / 1024;
//   const timesToMirror = targetSize / romSize;

//   if (romSize >= targetSize) {
//     return false;
//   }

//   if (existsSync(paddedRomPath)) {
//     unlinkSync(paddedRomPath);
//   }

//   const stream = createWriteStream(paddedRomPath, { flags: "a" });
//   [...Array(timesToMirror)].forEach(function() {
//     stream.write(romContent);
//   });
//   stream.end();

//   return true;
// }

// function getPaddedRomPath() {
//   return getRomPath().replace("output.vb", "outputPadded.vb");
// }
