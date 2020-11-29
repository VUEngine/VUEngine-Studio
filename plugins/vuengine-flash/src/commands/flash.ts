import { commands, ExtensionContext, window, workspace } from "vscode";
import { createWriteStream, existsSync, readFileSync, unlinkSync } from "fs";
import { dirname, join as joinPath } from "path";
import { getDeviceList, Device } from "usb";

import { convertoToEnvPath, getOs, getTerminal, getWorkspaceRoot } from "vuengine-common";

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
}

export function init(context: ExtensionContext) {

	const command = commands.registerCommand("vuengine.flash", async () => {

		const flashCarts: FlashCartConfig[] | undefined = workspace.getConfiguration("vuengine.flash").get("flashCarts");
		if (!flashCarts || flashCarts.length === 0) {
			window.showErrorMessage(`No flash cart configs provided. Update vuengine.flash.flashCarts.`);
			return;
		}

		const connectedFlashCart: {"config": FlashCartConfig, "device": Device} | undefined = await detectFlashCart(flashCarts);

		if (!connectedFlashCart) {
			window.showErrorMessage(`No connected flash cart could be found.`);
		} else if (!existsSync(getRomPath())) {
			// TODO queue
		} else {
			flash(connectedFlashCart.config, connectedFlashCart.device);
		}
	});
	context.subscriptions.push(command);

	const touchBarCommand = commands.registerCommand("vuengine.touchBar.flash", () => {
		commands.executeCommand("vuengine.flash");
	});
	context.subscriptions.push(touchBarCommand);
}

async function detectFlashCart(flashCarts: FlashCartConfig[]) {
	const devices: Device[] = getDeviceList();
	let manufacturer: string | undefined;
	let product: string | undefined;
	let serialNumber: string | undefined;

	for (const flashCart of flashCarts) {
		for (let i = 0; i < devices.length; i++) {
			const deviceDesc = devices[i].deviceDescriptor;
			if ((deviceDesc.idVendor == flashCart.vid) && (deviceDesc.idProduct == flashCart.pid)) {
				devices[i].open();
				manufacturer = await new Promise((resolve, reject) => {
					devices[i].getStringDescriptor(devices[i].deviceDescriptor.iManufacturer, (error, data) => {
						resolve(data);
					});
				});
				product = await new Promise((resolve, reject) => {
					devices[i].getStringDescriptor(devices[i].deviceDescriptor.iProduct, (error, data) => {
						resolve(data);
					});
				});
				serialNumber = await new Promise((resolve, reject) => {
					devices[i].getStringDescriptor(devices[i].deviceDescriptor.iSerialNumber, (error, data) => {
						resolve(data);
					});
				});
				devices[i].close();

				if ((flashCart.manufacturer === "" || manufacturer == flashCart.manufacturer) && 
					(flashCart.product === "" || product == flashCart.product) && 
					(flashCart.serialNumber === "" || serialNumber == flashCart.serialNumber)) {
					return {
						config: flashCart,
						device: devices[i]
					};
				}
			}
		}
	}
}

function flash(flashCart: FlashCartConfig, device: Device) {
	if (!flashCart.path) {
		window.showErrorMessage(`No path to flasher software provided for cart "${flashCart}"`);
		return;
	}

	if (!existsSync(dirname(flashCart.path))) {
		window.showErrorMessage(`Flasher software does not exist at "${flashCart.path}"`);
		return;
	}

	const terminal = getTerminal('Flash');
	const flasherEnvPath = convertoToEnvPath(flashCart.path);
	const enableWsl = workspace.getConfiguration('vuengine.build').get('enableWsl');
	if (getOs() === "win" && enableWsl) {
		flasherEnvPath.replace(/\.[^/.]+$/, "");
	}

	padRom(flashCart.size);

	const paddedRomPath = getPaddedRomPath();
	let flasherArgs = flashCart.args ? " " + flashCart.args : flashCart.args;
	if (existsSync(paddedRomPath)) {
		flasherArgs = flasherArgs.replace("output.vb", "outputPadded.vb");
	}

	terminal.sendText(flasherEnvPath + flasherArgs);
	terminal.show(true);
}

function getRomPath(): string {
	return joinPath(getWorkspaceRoot(), "build", "output.vb");
}

function padRom(size: number) {
	if (!existsSync(getRomPath())) {
		return;
	}

	const targetSize = size * 128;
	const romPath = getRomPath();
	const paddedRomPath = getPaddedRomPath();
	const romContent = readFileSync(romPath);
	const romSize = romContent.length / 1024;
	const timesToMirror = targetSize / romSize;

	if (romSize >= targetSize) {
		return;
	}

	if (existsSync(paddedRomPath)) {
		unlinkSync(paddedRomPath);
	}

	const stream = createWriteStream(paddedRomPath, { flags: "a" });
	[...Array(timesToMirror)].forEach(function () {
		stream.write(romContent);
	});
	stream.end();
}

function getPaddedRomPath() {
	return getRomPath().replace("output.vb", "outputPadded.vb");
}