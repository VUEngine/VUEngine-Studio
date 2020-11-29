import { window, commands, Event, Uri, TreeDataProvider, EventEmitter, ExtensionContext, workspace, TreeItem, TreeItemCollapsibleState } from 'vscode';
import { existsSync } from 'fs';
import { sync as globSync } from 'glob';
import { resolve as resolvePath, dirname } from 'path';
//import * as logger from '../logger';
import { parseJson, sortObject } from 'vuengine-common';
import { getExtensionPath, getConfig } from '../extension';

export function init(context: ExtensionContext) {

	const pluginsProvider = new PluginsProvider();

	window.createTreeView('vuengine-studio-plugins', {
		'treeDataProvider': pluginsProvider,
		'showCollapseAll': true,
	});

	const commandOpenResource = commands.registerCommand('vuengine.plugins.openResource', (resource) => {
		window.showTextDocument(Uri.file(resource));
	});
	context.subscriptions.push(commandOpenResource);

	const commandRefresh = commands.registerCommand('vuengine.plugins.refresh', () => {
		pluginsProvider.refresh();
	});
	context.subscriptions.push(commandRefresh);
}

class PluginsProvider implements TreeDataProvider<TreeItem> {

	private menu = {};

	private _onDidChangeTreeData: EventEmitter<TreeItem | undefined> = new EventEmitter<TreeItem | undefined>();
	readonly onDidChangeTreeData: Event<TreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor() { }

	refresh(): void {
		this._onDidChangeTreeData.fire();
	}

	getTreeItem(element: TreeItem): TreeItem {
		return element;
	}

	getChildren(element?: TreeItem): Thenable<TreeItem[]> {
		if (element) {

			return Promise.resolve(getMenuItems(element['children']));

		} else {

			let children = {};
			const pluginsPath = "/Users/chris/dev/vuengine-studio/engine/vuengine-plugins";
			//resolvePath(getExtensionPath() + "/../../vuengine/vuengine-plugins");
			//workspace.getConfiguration('vuengine.plugins').get('path');

			if (pluginsPath && existsSync(pluginsPath)) {

				try {
					const activePlugins: string[] = getConfig().project.plugins;
					const pluginsFiles = globSync(pluginsPath + '/**/.vuengine/plugin.json');

					if (pluginsFiles && pluginsFiles.length > 0) {

						for (const pluginFile of pluginsFiles) {
							const pluginsSlice = "vuengine" + pluginFile.slice(pluginsPath.length);
							const pluginId = pluginsSlice.substring(0, pluginsSlice.length - '/.vuengine/plugin.json'.length);

							let pluginInfo: {} = parseJson(pluginFile);
							const category = pluginInfo['category'] ? pluginInfo['category'] : 'Other';
							const categoryId = pluginId.split('/')[1];

							if (!children[category]) {
								children[category] = {
									label: category,
									id: categoryId,
									type: 'menuItem',
									children: {}
								};
							}

							pluginInfo = {
								...pluginInfo,
								'id': pluginId,
								'type': 'plugin',
								'path': resolvePath(dirname(pluginFile) + '/..'),
								'isActive': activePlugins.includes(pluginId),
							};
							children[category]['children'][pluginId] = pluginInfo;
						}

						children = sortObject(children);

						children = getMenuItems(children);

					}

				} catch (e) {

					//logger.logError('Populate plugins sub menu', e);

				}
			}

			return Promise.resolve(children);
		}
	}
}

class MenuItem extends TreeItem {

	children: null;
	desc: null;

	constructor(entry) {
		super(entry.label);

		this.id = entry.id;
		this.desc = (entry.description != undefined) ? entry.description : null;

		if (entry.icon != undefined) {
			this.iconPath = entry.icon;
		}

		this.collapsibleState = (entry.children != undefined)
			? TreeItemCollapsibleState.Collapsed
			: null;
		this.contextValue = 'projectMenuItem-' + entry.id;
		this.children = (entry.children != undefined) ? entry.children : null;
	}

	get tooltip(): string {
		return null;
	}

	get description(): string {
		return this.desc;
	}
}

class Plugin extends MenuItem {

	constructor(private entry) {
		super(entry);

		this.label = entry.title ? entry.title : entry.id;

		let readme = entry.path + '/readme.md';
		readme = existsSync(readme) ? readme : null;

		this.iconPath = entry['isActive']
			? {
				'dark': getExtensionPath() + '/img/icon/dark/puzzle.svg',
				'light': getExtensionPath() + '/img/icon/light/puzzle.svg',
			}
			: {
				'dark': getExtensionPath() + '/img/icon/dark/puzzle-outline.svg',
				'light': getExtensionPath() + '/img/icon/light/puzzle-outline.svg',
			};

		this.command = readme
			? {
				command: 'vuengine.plugins.openResource',
				arguments: [readme],
				title: 'Open readme'
			}
			: null;

		this.contextValue = entry['isActive'] ? 'activePlugin' : 'inactivePlugin';
	}

	get tooltip(): string {
		return this.entry['description'] ? this.entry['description'] : null;
	}

	get description(): string {
		let description = this.entry['author'] ? this.entry['author'] : null;
		if (description && this.entry['isActive']) {
			description += ' (Active)';
		}
		return description;
	}
}

function getMenuItems(menu) {
	let nodes = [];

	for (const [key, entry] of Object.entries(menu)) {
		let newEntry = null;

		switch (entry['type']) {
			case 'menuItem':
				newEntry = new MenuItem(entry);
				break;
			case 'plugin':
				newEntry = new Plugin(entry);
				break;
		}

		nodes.push(newEntry);
	}

	return nodes;
}