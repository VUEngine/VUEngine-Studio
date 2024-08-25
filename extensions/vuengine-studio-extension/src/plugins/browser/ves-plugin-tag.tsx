import { CommandService, nls } from '@theia/core';
import { TreeElement } from '@theia/core/lib/browser/source-tree';
import { inject, injectable } from '@theia/core/shared/inversify';
import * as React from '@theia/core/shared/react';
import styled from 'styled-components';
import { VesPluginsSearchModel } from './ves-plugins-search-model';
import { VesPluginsCommands } from './ves-plugins-commands';

const TagRow = styled.div`
    align-items: center;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
`;

@injectable()
export class VesPluginTagOptions {
    readonly id: string;
    readonly count: number;
}

export const VesPluginTagFactory = Symbol('VesPluginFactory');
export type VesPluginTagFactory = (options: VesPluginTagOptions) => VesPluginTag;

@injectable()
export class VesPluginTag implements TreeElement {
    @inject(CommandService)
    protected readonly commandService: CommandService;
    @inject(VesPluginTagOptions)
    protected readonly options: VesPluginTagOptions;
    @inject(VesPluginsSearchModel)
    readonly search: VesPluginsSearchModel;

    readonly searchTag = async (tag: string) => this.commandService?.executeCommand(VesPluginsCommands.SEARCH_BY_TAG.id, tag);

    async open(): Promise<void> {
        this.searchTag(this.options.id);
    }

    render(): React.ReactNode {
        return <TagRow>
            <span className='vesTag large'>{this.options.id}</span>
            {this.options.count} {nls.localize('vuengine/plugins/plugins', 'Plugins')}
        </TagRow>
    }
}
