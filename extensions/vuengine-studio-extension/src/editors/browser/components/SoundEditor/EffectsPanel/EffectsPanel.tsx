import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { MetaLine, MetaLineHeader } from '../PianoRoll/PianoRollHeader';
import { SoundEditorCommands } from '../SoundEditorCommands';
import {
    EFFECTS_PANEL_COLLAPSED_HEIGHT,
    EFFECTS_PANEL_EXPANDED_HEIGHT,
    EFFECTS_PANEL_EXPANDED_HEIGHT_MAX,
    EFFECTS_PANEL_EXPANDED_HEIGHT_MIN,
    EventsMap,
    PIANO_ROLL_KEY_WIDTH,
    ScrollWindow,
    SoundData,
    SoundEditorTool,
    SoundEvent
} from '../SoundEditorTypes';
import ResizeHandle from '../Other/ResizeHandle';
import EffectsPanelGrid from './EffectsPanelGrid';
import EffectsPanelGridOverview from './EffectsPanelGridOverview';

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
    outline-width: 0 !important;

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
    overflow-x: auto;
    overflow-y: hidden;
    scrollbar-width: none;
    white-space: nowrap;

    body.theia-light &,
    body.theia-hc & {
        border-bottom-color: rgba(0, 0, 0, .6);
    }

    .react-tabs__tab {
        line-height: ${EFFECTS_PANEL_COLLAPSED_HEIGHT - 3}px;
    }
`;

interface EffectsPanelTab {
    label: string
    eventType: SoundEvent
    shortLabel: string
}

const EffectsPanelTabs: EffectsPanelTab[] = [
    {
        label: nls.localize('vuengine/editors/sound/volume', 'Volume'),
        eventType: SoundEvent.Volume,
        shortLabel: nls.localize('vuengine/editors/sound/volumeShort', 'V'),
    },
    {
        label: nls.localize('vuengine/editors/sound/panning', 'Panning'),
        eventType: SoundEvent.Panning,
        shortLabel: nls.localize('vuengine/editors/sound/panningShort', 'P'),
    },
    {
        label: nls.localize('vuengine/editors/sound/masterVolume', 'Master Volume'),
        eventType: SoundEvent.MasterVolume,
        shortLabel: nls.localize('vuengine/editors/sound/masterVolumeShort', 'M'),
    },
    {
        label: nls.localize('vuengine/editors/sound/tempo', 'Tempo'),
        eventType: SoundEvent.Tempo,
        shortLabel: nls.localize('vuengine/editors/sound/tempoShort', 'T'),
    },
    {
        label: nls.localize('vuengine/editors/sound/timeSignature', 'Time Signature'),
        eventType: SoundEvent.TimeSignature,
        shortLabel: nls.localize('vuengine/editors/sound/timeSignatureShort', 'S'),
    },
];

interface EffectsPanelProps {
    soundData: SoundData
    noteCursor: number
    setNoteCursor: (step: number) => void
    setNotes: (notes: EventsMap) => void
    setGlobalEvents: (events: EventsMap) => void
    tool: SoundEditorTool
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    effectsPanelHidden: boolean
    setEffectsPanelHidden: Dispatch<SetStateAction<boolean>>
    effectsPanelHeight: number
    setEffectsPanelHeight: (height: number) => void
    setCurrentSequenceIndex: (trackId: number, sequenceIndex: number) => void
    editGlobalEvent: (step: number, eventType: SoundEvent) => void
    noteSnapping: boolean
    pianoRollNoteWidth: number
    pianoRollScrollWindow: ScrollWindow
}

export default function EffectsPanel(props: EffectsPanelProps): React.JSX.Element {
    const {
        soundData,
        noteCursor: noteCursor, setNoteCursor,
        setNotes,
        setGlobalEvents,
        tool,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
        effectsPanelHidden, setEffectsPanelHidden,
        effectsPanelHeight, setEffectsPanelHeight,
        setCurrentSequenceIndex,
        editGlobalEvent,
        noteSnapping,
        pianoRollNoteWidth,
        pianoRollScrollWindow,
    } = props;
    const { services, onCommandExecute, focusEditor } = useContext(EditorsContext) as EditorsContextType;
    const [tab, setTab] = useState<number>(0);

    // always as wide as the view, even if the sound is shorter
    const width = pianoRollScrollWindow.w;

    const toggleEffectsPanel = () => {
        setEffectsPanelHidden(prev => !prev);
        focusEditor();
    };

    const expandEffectsPanel = (eventType?: SoundEvent) => {
        const tabIndex = EffectsPanelTabs.findIndex(t => eventType !== undefined && t.eventType === eventType);
        if (tabIndex > -1) {
            setTab(tabIndex);
        }
        toggleEffectsPanel();
    };

    const commandListener = (commandId: string): void => {
        switch (commandId) {
            case SoundEditorCommands.TOGGLE_EFFECTS_PANEL_VISIBILITY.id:
                toggleEffectsPanel();
                break;
        }
    };

    let grid = <></>;
    if (effectsPanelHidden) {
        grid = <EffectsPanelGridOverview
            soundData={soundData}
            effects={EffectsPanelTabs.map(t => ({ eventType: t.eventType, shortLabel: t.shortLabel ?? t.label.charAt(0) }))}
            currentTrackId={currentTrackId}
            currentPatternId={currentPatternId}
            currentSequenceIndex={currentSequenceIndex}
            expandPanel={expandEffectsPanel}
            pianoRollNoteWidth={pianoRollNoteWidth}
            pianoRollScrollWindow={pianoRollScrollWindow}
        />;
    } else {
        grid = <EffectsPanelGrid
            soundData={soundData}
            eventType={EffectsPanelTabs[tab]?.eventType}
            noteCursor={noteCursor}
            currentTrackId={currentTrackId}
            currentPatternId={currentPatternId}
            currentSequenceIndex={currentSequenceIndex}
            setNoteCursor={setNoteCursor}
            setNotes={setNotes}
            setGlobalEvents={setGlobalEvents}
            setCurrentSequenceIndex={setCurrentSequenceIndex}
            editGlobalEvent={editGlobalEvent}
            tool={tool}
            noteSnapping={noteSnapping}
            height={effectsPanelHeight}
            pianoRollNoteWidth={pianoRollNoteWidth}
            pianoRollScrollWindow={pianoRollScrollWindow}
        />;
    }

    useEffect(() => {
        const disp = onCommandExecute(commandListener);
        return () => disp.dispose();
    }, []);

    return <MetaLine
        style={{
            bottom: 0,
            borderTopWidth: 1,
            minHeight: effectsPanelHidden ? EFFECTS_PANEL_COLLAPSED_HEIGHT : effectsPanelHeight,
            width: width + PIANO_ROLL_KEY_WIDTH + 2,
        }}
    >
        {!effectsPanelHidden &&
            <ResizeHandle
                direction='vertical'
                size={effectsPanelHeight}
                setSize={setEffectsPanelHeight}
                min={EFFECTS_PANEL_EXPANDED_HEIGHT_MIN}
                max={EFFECTS_PANEL_EXPANDED_HEIGHT_MAX}
                defaultSize={EFFECTS_PANEL_EXPANDED_HEIGHT}
                inverted
                style={{ left: 0, position: 'absolute', right: 0, top: -3 }}
            />
        }
        <MetaLineHeader
            style={{
                borderBottomWidth: 0,
                borderTopWidth: 0,
            }}
        >
            <StyledToggleButton
                onClick={toggleEffectsPanel}
                title={
                    `${SoundEditorCommands.TOGGLE_EFFECTS_PANEL_VISIBILITY.label}${services.vesKeybindingService.getKeybindingLabel(
                        SoundEditorCommands.TOGGLE_EFFECTS_PANEL_VISIBILITY.id, true
                    )}`
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
            {!effectsPanelHidden && <>
                <StyledTabList>
                    {EffectsPanelTabs.map(t => <Tab key={`tab-${t.label}`}>{t.label}</Tab>)}
                </StyledTabList>
                {EffectsPanelTabs.map(t => <TabPanel key={`tabpanel-${t.label}`}></TabPanel>)}
            </>}
            {grid}
        </Tabs>
    </MetaLine>;
}
