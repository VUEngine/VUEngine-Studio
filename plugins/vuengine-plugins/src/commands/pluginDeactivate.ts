import { commands, ExtensionContext } from 'vscode';
import { getConfig, setConfig } from '../extension';

export function init(context: ExtensionContext) {

	const command = commands.registerCommand('vuengine.plugins.deactivate', (plugin) => {
		const activePlugins = getConfig().project.plugins;
		const index = activePlugins.indexOf(plugin.id);
		if (index > -1) {
			activePlugins.splice(index, 1);
			activePlugins.sort();
			setConfig(activePlugins);

			commands.executeCommand('vuengine.plugins.refresh', plugin.id);
		}
	});
	context.subscriptions.push(command);
}