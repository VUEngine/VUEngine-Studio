import { commands, ExtensionContext, workspace } from 'vscode';
import { existsSync } from 'fs';
import { join as joinPath } from 'path';
import { convertoToEnvPath, getEngineCorePath, getEnginePluginsPath, getCompilerPath, getOs, getTerminal, getThreads, getWorkspaceRoot } from "vuengine-common";

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

function build(buildType: string, dumpElf?: boolean, pedanticWarnings?: boolean) {
	const engineCorePath = getEngineCorePath();
	const enginePluginsPath = getEnginePluginsPath();
	const compilerPath = getCompilerPath();
	const workingDir = convertoToEnvPath(getWorkspaceRoot());
	const v810path = convertoToEnvPath(joinPath(compilerPath, 'bin:$PATH'));
	const terminal = getTerminal('Build', {
        'ENGINE_FOLDER': convertoToEnvPath(engineCorePath),
        'PLUGINS_FOLDER': convertoToEnvPath(enginePluginsPath),
        'MAKE_JOBS': getThreads() + '',
        'LC_ALL': 'C',
      });
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

	if (getOs() === 'win' && enableWsl) {
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