import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import { Tab, TabList, Tabs } from 'react-tabs';
import styled from 'styled-components';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { EFFECTS_PANEL_COLLAPSED_HEIGHT, EFFECTS_PANEL_EXPANDED_HEIGHT, SoundData } from '../SoundEditorTypes';
import NotePropertiesGrid from './NotePropertiesGrid';
import { MetaLine, MetaLineHeader } from './PianoRollHeader';
import NotePropertiesGridOverview from './NotePropertiesGridOverview';

const StyledToggleButton = styled.button`
    align-items: center;
    background-color: transparent;
    border: none;
    color: var(--theia-editor-foreground);
    cursor: pointer;
    display: flex;
    font-size: 10px;
    justify-content: center;
    min-height: ${EFFECTS_PANEL_COLLAPSED_HEIGHT}px !important;
    outline-offset: -1px;

    &:hover {
        background-color: var(--theia-focusBorder);
        color: #fff;
    }
`;

const StyledTabList = styled(TabList)`
    border-bottom: 1px solid rgba(255, 255, 255, .6);
    margin: 0;
    height: ${EFFECTS_PANEL_COLLAPSED_HEIGHT}px;
    box-sizing: border-box;
    padding: 0 var(--padding);

    body.theia-light &,
    body.theia-hc & {
        border-bottom-color: rgba(0, 0, 0, .6);
    }

    .react-tabs__tab {
        line-height: ${EFFECTS_PANEL_COLLAPSED_HEIGHT - 3}px;
    }
`;

const NotePropertiesTabs = [
    nls.localize('vuengine/editors/sound/tempo', 'Tempo'),
    nls.localize('vuengine/editors/sound/trackVolume', 'Track Volume'),
    nls.localize('vuengine/editors/sound/masterVolume', 'Master Volume'),
];

interface NotePropertiesProps {
    soundData: SoundData
    noteCursor: number
    setNoteCursor: (noteCursor: number) => void
    currentTrackId: number
    currentPatternId: string
    setCurrentPatternId: (trackId: number, patternId: string) => void
    currentSequenceIndex: number
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
    setNote: (step: number, note?: string, prevStep?: number) => void
    effectsPanelHidden: boolean,
    setEffectsPanelHidden: Dispatch<SetStateAction<boolean>>
    pianoRollNoteWidth: number,
}

export default function NoteProperties(props: NotePropertiesProps): React.JSX.Element {
    const {
        soundData,
        noteCursor: noteCursor, setNoteCursor,
        currentTrackId,
        currentPatternId, setCurrentPatternId,
        currentSequenceIndex, setCurrentSequenceIndex,
        effectsPanelHidden, setEffectsPanelHidden,
        setNote,
        pianoRollNoteWidth,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const [tab, setTab] = useState<number>(0);

    const toggleEffectsPanel = () => {
        setEffectsPanelHidden(prev => !prev);
    };

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case SoundEditorCommands.TOGGLE_EFFECTS_VISIBILITY.id:
                toggleEffectsPanel();
                break;
        }
    };

    let grid = <></>;
    if (effectsPanelHidden) {
        grid = <NotePropertiesGridOverview
            soundData={soundData}
            expandPanel={toggleEffectsPanel}
            pianoRollNoteWidth={pianoRollNoteWidth}
        />;
    } else {
        switch (tab) {
            default:
            case 0:
                grid = <NotePropertiesGrid
                    soundData={soundData}
                    noteCursor={noteCursor}
                    currentTrackId={currentTrackId}
                    currentPatternId={currentPatternId}
                    setCurrentPatternId={setCurrentPatternId}
                    currentSequenceIndex={currentSequenceIndex}
                    setCurrentSequenceIndex={setCurrentSequenceIndex}
                    setNoteCursor={setNoteCursor}
                    setNote={setNote}
                    pianoRollNoteWidth={pianoRollNoteWidth}
                />;
                break;
        }
    }

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
            minHeight: effectsPanelHidden ? EFFECTS_PANEL_COLLAPSED_HEIGHT : EFFECTS_PANEL_EXPANDED_HEIGHT,
        }}
    >
        <MetaLineHeader
            style={{
                borderBottomWidth: 0,
                borderTopWidth: 0,
            }}
        >
            <StyledToggleButton
                onClick={toggleEffectsPanel}
                title={
                    `${SoundEditorCommands.TOGGLE_EFFECTS_VISIBILITY.label}${services.vesCommonService.getKeybindingLabel(SoundEditorCommands.TOGGLE_EFFECTS_VISIBILITY.id, true)}`
                }
                style={{
                    width: '100%',
                }}
            >
                <i className="codicon codicon-wand" />
                <i className={effectsPanelHidden ? 'codicon codicon-chevron-up' : 'codicon codicon-chevron-down'} />
            </StyledToggleButton>
        </MetaLineHeader>

        <Tabs
            selectedIndex={tab}
            onSelect={i => setTab(i)}
        >
            {!effectsPanelHidden &&
                <StyledTabList>
                    {NotePropertiesTabs.map(n => <Tab>{n}</Tab>)}
                </StyledTabList>
            }
            {grid}
        </Tabs>
    </MetaLine>;
}
