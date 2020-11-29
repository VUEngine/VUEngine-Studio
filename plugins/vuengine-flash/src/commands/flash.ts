import { commands, ExtensionContext, window, workspace } from "vscode";
import { createWriteStream, existsSync, readFileSync, unlinkSync } from "fs";
import { platform } from "os";
import { dirname, join as joinPath } from "path";
import { convertoToEnvPath, getOs, getTerminal, getWorkspaceRoot } from "vuengine-common";

type FlashCartConfig = {
	name: string;
	vid: number;
	pid: number;
	deviceName: string;
	serialNumber: string;
	size: number;
	path: string;
	args: string;
}

export function init(context: ExtensionContext) {

	const command = commands.registerCommand("vuengine.flash", () => {

		const flashCarts: FlashCartConfig[] | undefined = workspace.getConfiguration("vuengine.flash").get("flashCarts");
		if (!flashCarts || flashCarts.length === 0) {
			// TODO show error "no carts configured"
			return;
		}

		const connectedFlashCart: FlashCartConfig = detectFlashCart(flashCarts);

		if (!connectedFlashCart) {
			// TODO show error "no flash cart connected"
		} else if (!existsSync(getRomPath())) {
			// TODO queue
		} else {
			flash(connectedFlashCart);
		}
	});
	context.subscriptions.push(command);

	const touchBarCommand = commands.registerCommand("vuengine.touchBar.flash", () => {
		commands.executeCommand("vuengine.flash");
	});
	context.subscriptions.push(touchBarCommand);
}

function detectFlashCart(flashCarts: FlashCartConfig[]) {
	// TODO
	return flashCarts[0];
}

function getOs() {
	return platform()
		.replace("win32", "win")
		.replace("darwin", "osx");
}

function flash(flashCart: FlashCartConfig) {
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