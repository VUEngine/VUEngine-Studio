import { commands, ExtensionContext, ProgressLocation, window } from "vscode";
import * as rimraf from "rimraf";
import { getWorkspaceRoot } from "vuengine-common";

export function init(context: ExtensionContext) {

	const command = commands.registerCommand("vuengine.clean", () => {
		window.showQuickPick([
			{
				label: "All"
			},
			{
				label: "release"
			},
			{
				label: "beta"
			},
			{
				label: "tools"
			},
			{
				label: "debug"
			},
			{
				label: "preprocessor"
			}
		], {
			placeHolder: "Which build type do you want to remove processed files for?"
		}).then(selection => {

			if (!selection) {
				return;
			}

			clean(selection.label);

		});
	});
	context.subscriptions.push(command);

	const touchBarCommand = commands.registerCommand('vuengine.touchBar.clean', () => {
		commands.executeCommand('vuengine.clean');
	});
	context.subscriptions.push(touchBarCommand);

}

export function clean(type: string, callback?: () => void) {

	const all = (type == "All");

	let cleanPath = getWorkspaceRoot() + 'build';
	if (!all) {
		cleanPath += '/' + type;
	}

	const inProgressMessage = all
		? "All"
		: `Cleaning build folder for type "${type}"...`;

	window.withProgress({ location: ProgressLocation.Notification, title: inProgressMessage }, promise => {
		return new Promise((resolve, reject) => {
			rimraf(cleanPath, function (error) {
				resolve();

				if (callback != undefined) {
					callback();
				}
			});
		});
	});
}