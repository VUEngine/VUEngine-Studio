import { commands, ExtensionContext, Terminal, TerminalOptions, window, workspace } from 'vscode';
import { existsSync } from 'fs';
import { cpus, platform } from 'os';
import { join as joinPath, resolve as resolvePath } from 'path';
import { getExtensionPath, getWorkspaceRoot } from '../extension';

let buildTerminal: Terminal | null = null;

export function init(context: ExtensionContext) {

	const command = commands.registerCommand('vuengine.build', () => {
		// TODO: get actual build options from settings
		build("beta", false, false);
	});
	context.subscriptions.push(command);

	const touchBarCommand = commands.registerCommand('vuengine.touchBar.build', () => {
		commands.executeCommand('vuengine.build');
	});
	context.subscriptions.push(touchBarCommand);

}

function getThreads() {
	let threads = cpus().length;
	if (threads > 2) {
		threads--;
	}

	return threads;
}

function getOs() {
	return platform()
		.replace('win32', 'win')
		.replace('darwin', 'osx');
}

function convertoToEnvPath(path: string) {
	const enableWsl = workspace.getConfiguration('vuengine.build').get('enableWsl');
	let envPath = path.replace(/^[a-zA-Z]:\//, function (x) {
		return '/' + x.substr(0, 1).toLowerCase() + '/';
	});
	if ((getOs() == 'win') && enableWsl) {
		envPath = joinPath('/mnt', 'envPath');
	}
	return envPath;
}

function getResourcesPath() {
	return resolvePath(joinPath(getExtensionPath(), '..', '..', 'resources'));
}

function getEngineCorePath() {
	return joinPath(getResourcesPath(), "app", "vuengine", "vuengine-core");
}

function getEnginePluginsPath() {
	return joinPath(getResourcesPath(), "app", "vuengine", "vuengine-plugins");
}

function getCompilerPath() {
	return joinPath(getResourcesPath(), "app", "binaries", getOs(), "gcc");
}

function getMsysPath() {
	return joinPath(getResourcesPath(), "app", "binaries", "win", "msys");
}

function getTerminal(type: string) {
	// TODO: ensure that invoked processes are killed when Terminal is closed
	const terminalMode = workspace.getConfiguration('vuengine.terminal').get('instances');
	const terminalClear = workspace.getConfiguration('vuengine.terminal').get('clear');
	const enableWsl = workspace.getConfiguration('vuengine.build').get('enableWsl');
	const engineCorePath = getEngineCorePath();
	const enginePluginsPath = getEnginePluginsPath();
	const msysPath = getMsysPath();
	const terminalName = "Build";

	let terminalStillExists = false;
	for (const [key, value] of Object.entries(window.terminals)) {
		if (value['name'] && value['name'] == terminalName) {
			terminalStillExists = true;
		}
	}

	if (buildTerminal && terminalClear && terminalStillExists) {
		buildTerminal.dispose();
		buildTerminal = null;
	}

	if (terminalMode == "Individual" || !buildTerminal || !terminalStillExists) {
		const terminalArgs: TerminalOptions = {
			name: terminalName
		};

		if (type == 'build' || type == 'any') {
			terminalArgs.env = {
				'ENGINE_FOLDER': convertoToEnvPath(engineCorePath),
				'PLUGINS_FOLDER': convertoToEnvPath(enginePluginsPath),
				'MAKE_JOBS': getThreads() + '',
				'LC_ALL': 'C',
			};
		}

		if ((type == 'run' || type == 'any') && (getOs() == 'linux')) {
			terminalArgs.env = {
				//'LD_LIBRARY_PATH': path.dirname(getExtensionConfig('emulator.path')) + '/usr/lib'
			};
		}

		if (getOs() == 'win') {
			if (enableWsl) {
				terminalArgs.shellPath = process.env.windir + '\\System32\\wsl.exe';
			} else {
				terminalArgs.shellPath = msysPath + '/usr/bin/bash.exe';
				terminalArgs.shellArgs = ['--login'];
			}
		}

		const newTerminal = window.createTerminal(terminalArgs);

		if (terminalMode == "Individual") {
			return newTerminal;
		} else {
			buildTerminal = newTerminal;
		}
	}

	return buildTerminal;
}

function build(buildType: string, dumpElf?: boolean, pedanticWarnings?: boolean) {
	const engineCorePath = getEngineCorePath();
	const enginePluginsPath = getEnginePluginsPath();
	const compilerPath = getCompilerPath();
	const workingDir = convertoToEnvPath(getWorkspaceRoot());
	const v810path = convertoToEnvPath(joinPath(compilerPath, 'bin:$PATH'));
	const terminal = getTerminal('build');
	const preCallMake = 'export PATH=' + v810path + ' && ';
	const enableWsl = workspace.getConfiguration('vuengine.build').get('enableWsl');

	let makefile = convertoToEnvPath(joinPath(getWorkspaceRoot(), 'makefile'));
	if (!existsSync(makefile)) {
		makefile = convertoToEnvPath(joinPath(engineCorePath, 'makefile-game'));
	}

	const exports = ['-e TYPE=' + buildType];
	if (dumpElf != undefined && dumpElf) {
		exports.push('DUMP_ELF=1');
	}
	if (pedanticWarnings != undefined && pedanticWarnings) {
		exports.push('PRINT_PEDANTIC_WARNINGS=1');
	}

	if ((getOs() == 'win') && enableWsl) {
		exports.push('MAKE_JOBS=' + getThreads());
		exports.push('LC_ALL=C');
		exports.push('ENGINE_FOLDER=' + convertoToEnvPath(engineCorePath));
		exports.push('PLUGINS_FOLDER=' + convertoToEnvPath(enginePluginsPath));
		// fix line endings of preprocessor scripts
		// note: should no longer be necessary due to .gitattributes directive
		//preCallMake = 'find "' + convertoToEnvPath(engineCorePath) + 'lib/compiler/preprocessor/" -name "*.sh" -exec sed -i -e "s/$(printf \'\\r\')//" {} \\; && ' + preCallMake;
	}

	terminal.sendText(preCallMake + 'make all ' + exports.join(" ") + ' -f ' + makefile + ' -C ' + workingDir);
	terminal.show(true);
}