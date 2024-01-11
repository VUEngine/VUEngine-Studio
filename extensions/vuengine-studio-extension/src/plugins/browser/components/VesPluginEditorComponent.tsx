import { URI, nls } from "@theia/core";
import DOMPurify from "dompurify";
import React from "react";
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import sanitize from 'sanitize-html';
import * as showdown from 'showdown';
import { VesPluginsCommands } from "../ves-plugins-commands";
import AbstractVesPluginComponent, { AbstractVesPluginComponentProps } from "./AbstractVesPluginComponent";
import VContainer from "../../../editors/browser/components/Common/VContainer";

export default class VesPluginEditorComponent extends AbstractVesPluginComponent {
    constructor(props: AbstractVesPluginComponentProps) {
        super(props);
        this.state = {
            renderedReadme: '',
            tab: 'details',
        };
    }

    protected header: HTMLElement | undefined;
    protected body: HTMLElement | undefined;
    protected _scrollContainer: HTMLElement | undefined;

    get scrollContainer(): HTMLElement | undefined {
        return this._scrollContainer;
    }

    protected async renderReadme(path: string | undefined): Promise<string> {
        let renderedReadme = '';
        const readmeUri = new URI(path?.replace(/\\/g, '/')).withScheme('file');
        if (path && await this.props.fileService?.exists(readmeUri)) {
            const rawReadme = await this.props.fileService?.readFile(readmeUri);
            if (rawReadme) {
                const readme = this.compileReadme(rawReadme.value.toString());
                renderedReadme = DOMPurify.sanitize(readme);
            }
        }

        return renderedReadme;
    }

    protected compileReadme(readmeMarkdown: string): string {
        const markdownConverter = new showdown.Converter({
            noHeaderId: true,
            strikethrough: true,
            headerLevelStart: 2
        });

        const readmeHtml = markdownConverter.makeHtml(readmeMarkdown);
        return sanitize(readmeHtml, {
            allowedTags: sanitize.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'h4', 'img'])
        });
    }

    async componentDidMount() {
        this.setState({
            renderedReadme: await this.renderReadme(this.props.plugin.readme)
        });
    }

    render(): React.ReactNode {
        const { id, icon, author, displayName, description, repository, license, tags, dependencies } = this.props.plugin;
        const { baseStyle, scrollStyle } = this.getSubcomponentStyles();

        return <>
            <div className='header' style={baseStyle} ref={ref => this.header = (ref || undefined)}>
                {icon ?
                    <img className='icon-container' src={icon} /> :
                    <div className='icon-container ves-placeholder'><i className="codicon codicon-plug" /></div>}
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
                        {tags && <span className='noWrapInfo ves-plugin-tags'>{
                            // @ts-ignore
                            Object.keys(tags).map(key => <span onClick={() => this.searchTag(key)} key={key}>{tags[key]}</span>)
                        }</span>}
                    </div>
                    <div className='description noWrapInfo'> {description} </div>
                    {this.renderAction()}
                </div>
            </div>
            {
                <div className='scroll-container'
                    style={scrollStyle}
                    ref={ref => this._scrollContainer = (ref || undefined)}>
                    <div className='body'
                        ref={ref => this.body = (ref || undefined)}
                        onClick={this.openLink}
                        style={baseStyle}
                    >
                        <VContainer gap={15}>

                            <Tabs>
                                <TabList>
                                    <Tab>
                                        {nls.localize('vuengine/plugins/details', 'Details')}
                                    </Tab>
                                    <Tab>
                                        {nls.localize('vuengine/plugins/dependencies', 'Dependencies')}
                                        {' '}<span className='count'>{dependencies?.length || 0}</span>
                                    </Tab>
                                    {/*
                                    <Tab>
                                        {nls.localize('vuengine/plugins/configuration', 'Configuration')}
                                    </Tab>
                                    */}
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
                                            ? <ul>
                                                {dependencies.map(dependency =>
                                                    <li>
                                                        <code>{dependency}</code>
                                                    </li>
                                                )}
                                            </ul>
                                            : nls.localize('vuengine/plugins/noDependencies', 'This plugin has no dependencies.')
                                        }
                                    </VContainer>
                                </TabPanel>
                                {/*
                                <TabPanel>
                                    <VContainer>
                                        ...
                                    </VContainer>
                                </TabPanel>
                                */}
                            </Tabs>

                        </VContainer>
                    </div>

                </div >
            }
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
            plugin.doOpen(new URI(plugin.repository).withScheme('file'));
        }
    };
}