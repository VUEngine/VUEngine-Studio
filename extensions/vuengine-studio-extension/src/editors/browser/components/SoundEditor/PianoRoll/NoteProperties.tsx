import { nls } from '@theia/core';
import React, { useContext, useEffect, useState } from 'react';
import { Tab, TabList, Tabs } from 'react-tabs';
import styled from 'styled-components';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { EFFECTS_PANEL_COLLAPSED_HEIGHT, EFFECTS_PANEL_EXPANDED_HEIGHT, EFFECTS_PANEL_HEADER_HEIGHT, SoundData } from '../SoundEditorTypes';
import NotePropertiesGrid from './NotePropertiesGrid';
import { MetaLine, MetaLineHeader } from './PianoRollHeader';

const StyledToggleButton = styled.button`
    align-items: center;
    background-color: transparent;
    border: none;
    color: var(--theia-editor-foreground);
    cursor: pointer;
    display: flex;
    font-size: 10px;
    justify-content: center;
    min-height: ${EFFECTS_PANEL_HEADER_HEIGHT}px !important;
    outline-offset: -1px;

    &:hover {
        background-color: var(--theia-focusBorder);
        color: #fff;
    }
`;

const StyledTabList = styled(TabList)`
    border-bottom: 1px solid rgba(255, 255, 255, .6);
    margin: 0;
    height: ${EFFECTS_PANEL_HEADER_HEIGHT}px;
    box-sizing: border-box;
    padding: 0 var(--padding);

    body.theia-light &,
    body.theia-hc & {
        border-bottom-color: rgba(0, 0, 0, .6);
    }

    .react-tabs__tab {
        line-height: ${EFFECTS_PANEL_HEADER_HEIGHT - 3}px;
    }
`;

const NotePropertiesTabs = [
    nls.localize('vuengine/editors/sound/tempo', 'Tempo'),
    nls.localize('vuengine/editors/sound/channelVolume', 'Channel Volume'),
    nls.localize('vuengine/editors/sound/masterVolume', 'Master Volume'),
    nls.localize('vuengine/editors/sound/pitch', 'Pitch'),
];

interface NotePropertiesProps {
    soundData: SoundData
    currentTick: number
    setCurrentTick: (currentTick: number) => void
    currentChannelId: number
    currentPatternId: string
    setCurrentPatternId: (channelId: number, patternId: string) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (channel: number, sequenceIndex: number) => void
    setNote: (step: number, note?: number, prevStep?: number) => void
}

export default function NoteProperties(props: NotePropertiesProps): React.JSX.Element {
    const {
        soundData,
        currentTick, setCurrentTick,
        currentChannelId,
        currentPatternId, setCurrentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        setNote,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const [visible, setVisible] = useState<boolean>(false);
    const [tab, setTab] = useState<number>(0);

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case SoundEditorCommands.TOGGLE_EFFECTS_VISIBILITY.id:
                setVisible(prev => !prev);
                break;
        }
    };

    useEffect(() => {
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, []);

    return <MetaLine
        style={{
            bottom: 0,
            borderTopWidth: 1,
            minHeight: visible ? EFFECTS_PANEL_EXPANDED_HEIGHT : EFFECTS_PANEL_COLLAPSED_HEIGHT,
        }}
    >
        <MetaLineHeader
            style={{ borderBottom: 'none' }}
        >
            <StyledToggleButton
                onClick={() => setVisible(prev => !prev)}
                title={
                    `${SoundEditorCommands.TOGGLE_EFFECTS_VISIBILITY.label}${services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOGGLE_EFFECTS_VISIBILITY.id, true)}`
                }
            >
                <i className={visible ? 'fa fa-chevron-down' : 'fa fa-chevron-up'} />
            </StyledToggleButton>
        </MetaLineHeader>

        <Tabs
            selectedIndex={tab}
            onSelect={i => setTab(i)}
        >
            {visible &&
                <StyledTabList>
                    {NotePropertiesTabs.map(n => <Tab>{n}</Tab>)}
                </StyledTabList>
            }
            <NotePropertiesGrid
                soundData={soundData}
                currentTick={currentTick}
                currentChannelId={currentChannelId}
                currentPatternId={currentPatternId}
                setCurrentPatternId={setCurrentPatternId}
                currentSequenceIndex={currentSequenceIndex}
                setCurrentSequenceIndex={setCurrentSequenceIndex}
                setCurrentTick={setCurrentTick}
                setNote={setNote}
            />
        </Tabs>
    </MetaLine>;
}
