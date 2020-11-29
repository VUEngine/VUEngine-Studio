import { commands, ExtensionContext } from 'vscode';
import { getConfig, setConfig } from '../extension';

export function init(context: ExtensionContext) {

	const command = commands.registerCommand('vuengine.plugins.activate', (plugin) => {
		const activePlugins = getConfig().project.plugins;
		activePlugins.push(plugin.id);
		activePlugins.sort();
		setConfig(activePlugins);

		commands.executeCommand('vuengine.plugins.refresh', plugin.id);
	});
	context.subscriptions.push(command);
}