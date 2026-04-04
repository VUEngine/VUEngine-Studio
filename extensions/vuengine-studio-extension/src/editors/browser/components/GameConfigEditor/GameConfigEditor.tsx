import { nls } from '@theia/core';
import React, { useState } from 'react';
import styled from 'styled-components';
import SimpleListEditor from '../SimpleListEditor/SimpleListEditor';
import CompilerConfig from './CompilerConfig/CompilerConfig';
import EngineConfig from './EngineConfig/EngineConfig';
import { GameConfigData } from './GameConfigEditorTypes';
import General from './General/General';
import RomInfo from './RomInfo/RomInfo';

enum SidebarTab {
    general = 'general',
    colliderLayers = 'colliderLayers',
    compiler = 'compiler',
    engine = 'engine',
    events = 'events',
    inGameTypes = 'inGameTypes',
    messages = 'messages',
    romInfo = 'romInfo',
}

const StyledGameConfigEditor = styled.div`
    display: flex !important;
    flex-direction: row !important;
    gap: var(--theia-ui-padding);
    padding: 0 !important;
`;

const StyledSideBar = styled.div`
    border-right: 1px solid var(--theia-editorGroup-border);
    display: flex;
    flex-direction: column;
    height: 100%;
    max-width: 300px;
    min-width: 300px;
`;

const StyledSideBarTab = styled.div`
    border-bottom: 1px solid var(--theia-editorGroup-border);
    border-right: 1px solid transparent;
    cursor: pointer;
    display: flex;
    gap: var(--theia-ui-padding);
    margin-right: -1px;
    padding: calc(3 * var(--theia-ui-padding));

    &:hover,
    &.selected {
        background-color: var(--theia-editorGroup-border);
    }

    &.selected {
        border-right-color: var(--theia-foreground);
    }

    .codicon-symbol-event {
        color: var(--theia-foreground) !important;
    }
`;

const StyledTab = styled.div`
    flex-grow: 1;
    overflow: auto;
    padding: calc(2 * var(--theia-ui-padding));
`;

interface GameConfigEditorProps {
    data: GameConfigData
    updateData: (data: GameConfigData) => void
}

export default function GameConfigEditor(props: GameConfigEditorProps): React.JSX.Element {
    const { data, updateData } = props;
    const [sidebarTab, setSidebarTab] = useState<SidebarTab>(SidebarTab.general);

    return (
        <StyledGameConfigEditor>
            <StyledSideBar>
                <StyledSideBarTab
                    className={sidebarTab === SidebarTab.general ? 'selected' : undefined}
                    onClick={() => setSidebarTab(SidebarTab.general)}
                >
                    <i className='codicon codicon-settings-gear' />
                    {nls.localize('vuengine/editors/gameConfig/tabs/general', 'General')}
                </StyledSideBarTab>
                <StyledSideBarTab
                    className={sidebarTab === SidebarTab.colliderLayers ? 'selected' : undefined}
                    onClick={() => setSidebarTab(SidebarTab.colliderLayers)}
                >
                    <i className='codicon codicon-activate-breakpoints' />
                    {nls.localize('vuengine/editors/gameConfig/tabs/colliderLayers', 'Collider Layers')}
                </StyledSideBarTab>
                <StyledSideBarTab
                    className={sidebarTab === SidebarTab.compiler ? 'selected' : undefined}
                    onClick={() => setSidebarTab(SidebarTab.compiler)}
                >
                    <i className='codicon codicon-terminal' />
                    {nls.localize('vuengine/editors/gameConfig/tabs/compiler', 'Compiler')}
                </StyledSideBarTab>
                <StyledSideBarTab
                    className={sidebarTab === SidebarTab.engine ? 'selected' : undefined}
                    onClick={() => setSidebarTab(SidebarTab.engine)}
                >
                    <i className='codicon codicon-gear' />
                    {nls.localize('vuengine/editors/gameConfig/tabs/engine', 'Engine')}
                </StyledSideBarTab>
                <StyledSideBarTab
                    className={sidebarTab === SidebarTab.events ? 'selected' : undefined}
                    onClick={() => setSidebarTab(SidebarTab.events)}
                >
                    <i className='codicon codicon-symbol-event' />
                    {nls.localize('vuengine/editors/gameConfig/tabs/events', 'Events')}
                </StyledSideBarTab>
                <StyledSideBarTab
                    className={sidebarTab === SidebarTab.inGameTypes ? 'selected' : undefined}
                    onClick={() => setSidebarTab(SidebarTab.inGameTypes)}
                >
                    <i className='codicon codicon-broadcast' />
                    {nls.localize('vuengine/editors/gameConfig/tabs/inGameTypes', 'In-Game Types')}
                </StyledSideBarTab>
                <StyledSideBarTab
                    className={sidebarTab === SidebarTab.messages ? 'selected' : undefined}
                    onClick={() => setSidebarTab(SidebarTab.messages)}
                >
                    <i className='codicon codicon-comment' />
                    {nls.localize('vuengine/editors/gameConfig/tabs/messages', 'Messages')}
                </StyledSideBarTab>
                <StyledSideBarTab
                    className={sidebarTab === SidebarTab.romInfo ? 'selected' : undefined}
                    onClick={() => setSidebarTab(SidebarTab.romInfo)}
                >
                    <i className='codicon codicon-layout-menubar' />
                    {nls.localize('vuengine/editors/gameConfig/tabs/romInfo', 'ROM Info')}
                </StyledSideBarTab>
            </StyledSideBar>
            <StyledTab>
                {sidebarTab === SidebarTab.colliderLayers &&
                    <SimpleListEditor
                        data={data.colliderLayers}
                        updateData={colliderLayers => updateData({ ...data, colliderLayers })}
                    />
                }
                {sidebarTab === SidebarTab.compiler &&
                    <CompilerConfig
                        data={data.compiler}
                        updateData={compiler => updateData({ ...data, compiler })}
                    />
                }
                {sidebarTab === SidebarTab.engine &&
                    <EngineConfig
                        data={data.engine}
                        updateData={engine => updateData({ ...data, engine })}
                    />
                }
                {sidebarTab === SidebarTab.events &&
                    <SimpleListEditor
                        data={data.events}
                        updateData={events => updateData({ ...data, events })}
                    />
                }
                {sidebarTab === SidebarTab.general &&
                    <General
                        data={data}
                        updateData={updateData}
                    />
                }
                {sidebarTab === SidebarTab.inGameTypes &&
                    <SimpleListEditor
                        data={data.inGameTypes}
                        updateData={inGameTypes => updateData({ ...data, inGameTypes })}
                    />
                }
                {sidebarTab === SidebarTab.messages &&
                    <SimpleListEditor
                        data={data.messages}
                        updateData={messages => updateData({ ...data, messages })}
                    />
                }
                {sidebarTab === SidebarTab.romInfo &&
                    <RomInfo
                        data={data.romInfo}
                        updateData={romInfo => updateData({ ...data, romInfo })}
                    />
                }
            </StyledTab>
        </StyledGameConfigEditor>
    );
}
