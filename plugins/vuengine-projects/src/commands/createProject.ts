import { commands, ExtensionContext, window } from 'vscode';

export function init(context: ExtensionContext) {
	const command = commands.registerCommand('vuengine.projects.create', () => {
		createNewProject();
	});
	context.subscriptions.push(command);
}

function createNewProject() {
	window.showInputBox({
		ignoreFocusOut: true,
		placeHolder: "Enter a name for the new project",
		validateInput: (name) => {
			if (name.length === 0) {
				return "Name cannot be empty";
			}
			if (name.match(/[^0-9a-z\d\s:\-_.]/i)) {
				return "Name contains illegal characters";
			}
		}
	}).then(name => {

		if (!name) {
			return;
		}

		window.showQuickPick([
			{
				label: "Barebone",
				detail: "A minimal barebone setup for any type of project",
				description: '(VUEngine Barebone)'
			},
			{
				label: "Platform Game",
				detail: "A feature-rich sidescrolling platformer game",
				description: '(VUEngine Platformer Demo)'
			},
			{
				label: "Image Viewer",
				detail: "A stereoscopic image viewer",
				description: '(VUE-MASTER)'
			}
		], {
			matchOnDescription: true,
			matchOnDetail: true,
			canPickMany: false,
			ignoreFocusOut: true,
			placeHolder: "Choose a template for your new project"
		}).then(selection => {

			if (!selection) {
				return;
			}

			window.showInformationMessage(
				"Not yet implemented kthxbye"
			);

			/*
			vscode.window.withProgress({ location: vscode.ProgressLocation.Notification, title: 'VUEngine Studio' }, p => {
				return new Promise((resolve, reject) => {
					p.report({ message: "Creating new project..." });
	
					let templateRepoName = 'vuengine-barebone';
					let templateWorkspaceName = 'barebone';
					let templateProjectName = 'VUEngine Barebone';
					switch (selection.label) {
						case "Platform Game":
							templateRepoName = 'vuengine-platformer-demo';
							templateWorkspaceName = 'platformer';
							templateProjectName = 'VUEngine Platformer Demo';
							break;
						case "Image Viewer":
							templateRepoName = 'vue-master';
							templateWorkspaceName = 'vue-master';
							templateProjectName = 'VUE-MASTER';
							break;
					}
	
					let nameClean = name.replace(/[^0-9A-Za-z\d\s]/g, '').trim().replace(/\s+/g, '-').toLowerCase();
					let nameSaveStamp = (name.trim().replace(/\s+/g, '') + '                ').substring(0, 16);
					let targetFolder = vuengine.getExtensionConfig('projects.path') + nameClean;
	
					vuengine.downloadResource(
						'https://bitbucket.org/vuengine/' + templateRepoName + '/get/master.zip',
						'vuengine-' + templateRepoName + '-',
						targetFolder,
						name,
						function (success) {
							if (success) {
		
								let oldWorkspaceFile = targetFolder + '/' + templateWorkspaceName + '.code-workspace';
								let newWorkspaceFile = targetFolder + '/' + nameClean + '.code-workspace';
								fs.renameSync(oldWorkspaceFile, newWorkspaceFile);
		
								replaceInFile(newWorkspaceFile, templateProjectName, name);
		
								let romHeaderFilePath = targetFolder + '/.vuengine/romHeader.json';
								let romHeaderFileData = vuengine.parseJson(romHeaderFilePath);
								romHeaderFileData.romHeader.gameTitle = name;
								romHeaderFileData.romHeader.makerCode = vuengine.getExtensionConfig('projects.makerCode');
								fs.writeFileSync(romHeaderFilePath, JSON.stringify(romHeaderFileData, null, '\t'));
		
								let projectFilePath = targetFolder + '/.vuengine/project.json';
								let projectFileData = vuengine.parseJson(projectFilePath);
								projectFileData.project.name = name;
								fs.writeFileSync(projectFilePath, JSON.stringify(projectFileData, null, '\t'));
		
								// TODO: get this working again
								//templates.writeConfigH(targetFolder);
		
								//fs.unlinkSync(targetFolder + '/readme.md');
		
								vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(newWorkspaceFile), false);
								resolve();
		
							} else {
								reject();
							}
						}
					);
				});
			});
			*/

		});
	});
}
/*
function replaceInFile(file: string, oldString: string, newString: string) {
	fs.readFile(file, 'utf8', function (err, data) {
		if (err) {
			vscode.window.showErrorMessage('Error: ' + err);
		}
		var re = new RegExp(oldString, 'g');
		var result = data.replace(re, newString);

		fs.writeFile(file, result, 'utf8', function (err) {
			if (err) {
				return vscode.window.showErrorMessage('Error: ' + err);
			}
		});
	});
}
*/
