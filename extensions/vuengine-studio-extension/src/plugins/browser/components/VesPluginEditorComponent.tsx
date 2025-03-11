import { ArrowCounterClockwise } from '@phosphor-icons/react';
import { URI, nls } from '@theia/core';
import { BinaryBuffer } from '@theia/core/lib/common/buffer';
import DOMPurify from 'dompurify';
import React from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import sanitize from 'sanitize-html';
import * as showdown from 'showdown';
import { BuildMode } from '../../../build/browser/ves-build-types';
import HContainer from '../../../editors/browser/components/Common/Base/HContainer';
import VContainer from '../../../editors/browser/components/Common/Base/VContainer';
import InfoLabel from '../../../editors/browser/components/Common/InfoLabel';
import { stringify } from '../../../editors/browser/components/Common/Utils';
import { VesPlugin } from '../ves-plugin';
import { VesPluginsCommands } from '../ves-plugins-commands';
import { PluginConfiguration, PluginConfigurationDataType, USER_PLUGINS_PREFIX, VUENGINE_PLUGINS_PREFIX } from '../ves-plugins-types';
import AbstractVesPluginComponent, { AbstractVesPluginComponentProps } from './AbstractVesPluginComponent';
import PluginDefaultInput from './PluginDefaultInput';

export default class VesPluginEditorComponent extends AbstractVesPluginComponent {
    constructor(props: AbstractVesPluginComponentProps) {
        super(props);
        this.state = {
            renderedReadme: '',
            tab: 'details',
            ready: false,
            configuration: {},
            dirtyConfigurations: {},
            isSaving: false,
        };
    }

    protected header: HTMLElement | undefined;
    protected body: HTMLElement | undefined;
    protected _scrollContainer: HTMLElement | undefined;

    get scrollContainer(): HTMLElement | undefined {
        return this._scrollContainer;
    }

    protected async renderReadme(plugin: VesPlugin): Promise<string> {
        let renderedReadme = '';
        const readmeUri = new URI(plugin.readme?.replace(/\\/g, '/')).withScheme('file');
        if (plugin.readme && await this.props.fileService?.exists(readmeUri)) {
            const rawReadme = await this.props.fileService?.readFile(readmeUri);
            if (rawReadme) {
                const readme = await this.compileReadme(rawReadme.value.toString(), plugin);
                renderedReadme = DOMPurify.sanitize(readme);
            }
        }

        return renderedReadme;
    }

    protected async compileReadme(readmeMarkdown: string, plugin: VesPlugin): Promise<string> {
        const markdownConverter = new showdown.Converter({
            noHeaderId: true,
            strikethrough: true,
            headerLevelStart: 2
        });

        await this.props.preferenceService?.ready;
        const enginePluginsUri = await this.props.vesPluginsPathsService?.getEnginePluginsUri();
        const userPluginsUri = await this.props.vesPluginsPathsService?.getUserPluginsUri();
        let baseUri = new URI;
        if (plugin.id.startsWith(VUENGINE_PLUGINS_PREFIX)) {
            baseUri = enginePluginsUri!.resolve(plugin.id.replace(VUENGINE_PLUGINS_PREFIX, ''));
        } else if (plugin.id.startsWith(USER_PLUGINS_PREFIX)) {
            baseUri = userPluginsUri!.resolve(plugin.id.replace(USER_PLUGINS_PREFIX, ''));
        }

        const readmeHtml = markdownConverter.makeHtml(readmeMarkdown
            .replace('](', '](' + baseUri.path.fsPath() + '/')
        );

        return sanitize(readmeHtml, {
            allowedTags: sanitize.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'h4', 'img'])
        });
    }

    async componentDidMount() {
        const renderedReadme = await this.renderReadme(this.props.plugin);
        await this.props.vesProjectService?.projectDataReady;

        const workspaceRootUri = this.props.workspaceService.tryGetRoots()[0]?.resource;
        const gameConfigFileUri = workspaceRootUri.resolve('config').resolve('GameConfig');
        let configuration;
        if (await this.props.fileService?.exists(gameConfigFileUri)) {
            try {
                const fileContent = await this.props.fileService?.readFile(gameConfigFileUri);
                const gameConfig = fileContent ? JSON.parse(fileContent.value.toString()) : {};
                configuration = gameConfig.plugins[this.props.plugin.id];
            } catch (error) { }
        }

        this.setState({
            ready: true,
            renderedReadme,
            configuration: configuration || {},
        });
    }

    async updateConfiguration(config: PluginConfiguration, value: any, persist?: boolean) {
        const workspaceRootUri = this.props.workspaceService.tryGetRoots()[0]?.resource;
        const gameConfigFileUri = workspaceRootUri.resolve('config').resolve('GameConfig');

        // adjust value according to format
        switch (config.dataType) {
            case PluginConfigurationDataType.hex:
                value = '0x' + (value as string).replace('0x', '').replace(/[^A-Fa-f0-9]/g, '').toUpperCase();
                break;
            case PluginConfigurationDataType.integer:
                if (typeof value === 'string') {
                    value = parseInt(value);
                }
                if (config.min && value < config.min) {
                    value = config.min;
                }
                if (config.max && value > config.max) {
                    value = config.max;
                }
                break;
        }

        // don't update if nothing changed
        if (this.state.configuration[config.name] === value && !this.state.dirtyConfigurations[config.name]) {
            return;
        }

        // update dirty config flags in state
        const updatedDirtyConfigurations = {
            ...this.state.dirtyConfigurations,
            [config.name]: true,
        }

        // update state config
        const updatedConfiguration = {
            ...this.state.configuration,
            [config.name]: value,
        };

        // sort updated state config keys alphabetically
        const sortedConfiguration: { [id: string]: string } = {};
        Object.keys(updatedConfiguration).sort((a, b) => a.localeCompare(b)).forEach(key => {
            sortedConfiguration[key] = updatedConfiguration[key];
        });

        this.setState({
            configuration: sortedConfiguration,
            dirtyConfigurations: updatedDirtyConfigurations,
        });

        if (persist === true) {
            this.setState({ isSaving: true });

            // get current from file
            if (await this.props.fileService?.exists(gameConfigFileUri)) {
                const fileContent = await this.props.fileService?.readFile(gameConfigFileUri);
                const gameConfig = fileContent ? JSON.parse(fileContent.value.toString()) : {};

                // @ts-ignore
                gameConfig.plugins[this.props.plugin.id][config.name] = value;

                // persist to GameConfig file
                await this.props.fileService?.writeFile(
                    gameConfigFileUri,
                    BinaryBuffer.fromString(stringify(gameConfig)),
                );

                // remove library file in build folder to force rebuild
                await this.props.workspaceService.ready;
                const workspaceRootUri = this.props.workspaceService.tryGetRoots()[0]?.resource;
                const buildPathUri = workspaceRootUri.resolve('build');
                const pluginName = this.props.plugin.id.split('/').pop();
                const libraryFileUris = [
                    buildPathUri.resolve(`lib${pluginName}.a`)
                ];
                Object.values(BuildMode).map(mode => {
                    const modeLc = mode.toLowerCase();
                    libraryFileUris.push(
                        buildPathUri.resolve(`working/libraries/${modeLc}/lib${pluginName}-${modeLc}.a`)
                    );
                })
                await Promise.all(libraryFileUris.map(async libraryFile => {
                    if (await this.props.fileService?.exists(libraryFile)) {
                        await this.props.fileService?.delete(libraryFile);
                    }
                }));
            }

            // let the code generation catch up
            setTimeout(() => {
                // update dirty config flags in state
                const updatedDirtyConfigurations = {
                    ...this.state.dirtyConfigurations,
                    [config.name]: false,
                }

                this.setState({
                    isSaving: false,
                    dirtyConfigurations: updatedDirtyConfigurations,
                });
            }, 1000);
        }
    }

    render(): React.ReactNode {
        const { id, icon, author, displayName, description, repository, license, tags, dependencies, configuration, installed } = this.props.plugin;
        const { baseStyle, scrollStyle } = this.getSubcomponentStyles();

        return <>
            <div className='header' style={baseStyle} ref={ref => this.header = (ref || undefined)}>
                {icon ?
                    <img className='icon-container' src={icon} /> :
                    <div className='icon-container vesPlaceholder'><i className='codicon codicon-plug' /></div>}
                <div className='details'>
                    <div className='title'>
                        <span title='Plugin name' className='name'>{displayName}</span>
                        <span title='Plugin identifier' className='identifier'>{id}</span>
                    </div>
                    <div className='subtitle'>
                        <span title='Author' className='publisher' onClick={this.searchAuthor}>
                            {author}
                        </span>
                        {repository && <span className='repository' onClick={this.openRepository}>Repository</span>}
                        {license && <span className='license'>{license}</span>}
                        {tags && <span className='noWrapInfo vesPluginTags'>{
                            // @ts-ignore
                            Object.keys(tags).map(key => <span className='vesTag' onClick={() => this.searchTag(tags[key])} key={key}>{tags[key]}</span>)
                        }</span>}
                    </div>
                    <div className='description noWrapInfo'> {description} </div>
                    {this.renderAction()}
                </div>
            </div>
            <div className='scroll-container'
                style={scrollStyle}
                ref={ref => this._scrollContainer = (ref || undefined)}>
                <div className='body'
                    ref={ref => this.body = (ref || undefined)}
                    onClick={this.openLink}
                    style={baseStyle}
                >
                    <VContainer gap={15} style={{ height: '100%' }}>

                        <Tabs>
                            <TabList>
                                <Tab>
                                    {nls.localize('vuengine/plugins/details', 'Details')}
                                </Tab>
                                <Tab>
                                    {nls.localize('vuengine/plugins/dependencies', 'Dependencies')}
                                    {' '}<span className='count'>{dependencies?.length || 0}</span>
                                </Tab>
                                <Tab>
                                    {nls.localize('vuengine/general/configuration', 'Configuration')}
                                    {' '}<span className='count'>{configuration?.length || 0}</span>
                                </Tab>
                            </TabList>

                            <TabPanel>
                                <VContainer>
                                    {this.state.renderedReadme &&
                                        <div
                                            dangerouslySetInnerHTML={{ __html: this.state.renderedReadme }}
                                        />
                                    }
                                </VContainer>
                            </TabPanel>
                            <TabPanel>
                                <VContainer>
                                    {dependencies?.length && dependencies?.length > 0
                                        ? <>
                                            <p>
                                                {nls.localize(
                                                    'vuengine/plugins/dependenciesDescription',
                                                    'This plugin depends on the following plugins. These will be linked at build time.'
                                                )}
                                                <ul>
                                                    {dependencies.map((d, i) =>
                                                        <li key={i}>
                                                            <code>{d}</code>
                                                        </li>
                                                    )}
                                                </ul>
                                            </p>
                                        </>
                                        : <p>
                                            {nls.localize('vuengine/plugins/noDependencies', 'This plugin has no dependencies.')}
                                        </p>
                                    }
                                </VContainer>
                            </TabPanel>
                            <TabPanel>
                                <VContainer>
                                    {this.state.ready && configuration?.length && configuration?.length > 0
                                        ? <VContainer gap={15}>
                                            {configuration.map((c, i) =>
                                                <VContainer key={i}>
                                                    <InfoLabel
                                                        label={c.label}
                                                        tooltip={c.description}
                                                        hoverService={this.props.hoverService}
                                                    />
                                                    <HContainer>
                                                        <div style={{ display: 'flex', flexGrow: 1 }}>
                                                            <PluginDefaultInput
                                                                config={c}
                                                                value={this.state.configuration[c.name] ? this.state.configuration[c.name] : c.default}
                                                                setValue={(value: any, persist?: boolean) => this.updateConfiguration(c, value, persist)}
                                                                disabled={!installed || (this.state.isSaving ?? true)}
                                                                vesCommonService={this.props.vesCommonService!}
                                                                vesProjectService={this.props.vesProjectService!}
                                                            />
                                                        </div>
                                                        <div style={{ textAlign: 'right', width: 20 }}>
                                                            {this.state.configuration[c.name] !== undefined && this.state.configuration[c.name] != c.default &&
                                                                <div
                                                                    className='vesPluginConfigReset'
                                                                    title={nls.localize('vuengine/plugins/resetToDefault', 'Reset To Default')}
                                                                    onClick={() => this.updateConfiguration(c, c.default, true)}
                                                                >
                                                                    <ArrowCounterClockwise size={16} />
                                                                </div>
                                                            }
                                                        </div>
                                                    </HContainer>
                                                </VContainer>
                                            )}
                                        </VContainer>
                                        : <p>
                                            {nls.localize('vuengine/plugins/noConfiguration', 'This plugin has no configuration.')}
                                        </p>
                                    }
                                </VContainer>
                            </TabPanel>
                        </Tabs>

                    </VContainer>
                </div>
            </div>
        </>;
    }

    protected getSubcomponentStyles(): { baseStyle: React.CSSProperties, scrollStyle: React.CSSProperties; } {
        const visibility: 'unset' | 'hidden' = this.header ? 'unset' : 'hidden';
        const baseStyle = { visibility };
        const scrollStyle = this.header?.clientHeight ? { visibility, height: `calc(100 % - (${this.header.clientHeight}px + 1px))` } : baseStyle;

        return { baseStyle, scrollStyle };
    }

    readonly openLink = (event: React.MouseEvent) => {
        if (!this.body) {
            return;
        }
        const target = event.nativeEvent.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }
        let node = target;
        while (node.tagName.toLowerCase() !== 'a') {
            if (node === this.body) {
                return;
            }
            if (!(node.parentElement instanceof HTMLElement)) {
                return;
            }
            node = node.parentElement;
        }
        const href = node.getAttribute('href');
        if (href && !href.startsWith('#')) {
            event.preventDefault();
            this.props.plugin.doOpen(new URI(href).withScheme('file'));
        }
    };

    readonly searchTag = async (tag: string) => this.props.commandService?.executeCommand(VesPluginsCommands.SEARCH_BY_TAG.id, tag);

    readonly searchAuthor = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const plugin = this.props.plugin;
        if (plugin.author) {
            this.props.commandService?.executeCommand(VesPluginsCommands.SEARCH_BY_AUTHOR.id, plugin.author);
        }
    };

    readonly openRepository = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();

        const plugin = this.props.plugin;
        if (plugin.repository) {
            plugin.openUrl(plugin.repository);
        }
    };
}