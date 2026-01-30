import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import { Tab, TabList, Tabs } from 'react-tabs';
import styled from 'styled-components';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { SoundEditorCommands } from '../SoundEditorCommands';
import {
    EFFECTS_PANEL_COLLAPSED_HEIGHT,
    EFFECTS_PANEL_EXPANDED_HEIGHT,
    PIANO_ROLL_KEY_WIDTH,
    ScrollWindow,
    SoundData
} from '../SoundEditorTypes';
import EffectsPanelGrid from './EffectsPanelGrid';
import EffectsPanelGridOverview from './EffectsPanelGridOverview';
import { MetaLine, MetaLineHeader } from '../PianoRoll/PianoRollHeader';

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

    body.theia-light &,
    body.theia-hc & {
        border-bottom-color: rgba(0, 0, 0, .6);
    }

    .react-tabs__tab {
        line-height: ${EFFECTS_PANEL_COLLAPSED_HEIGHT - 3}px;
    }
`;

const EffectsPanelTabs = [
    nls.localize('vuengine/editors/sound/timeSignature', 'Time Signature'),
    nls.localize('vuengine/editors/sound/tempo', 'Tempo'),
    nls.localize('vuengine/editors/sound/trackVolume', 'Track Volume'),
    nls.localize('vuengine/editors/sound/masterVolume', 'Master Volume'),
];

interface EffectsPanelProps {
    soundData: SoundData
    noteCursor: number
    setNoteCursor: Dispatch<SetStateAction<number>>
    currentTrackId: number
    currentPatternId: string
    currentSequenceIndex: number
    effectsPanelHidden: boolean
    setEffectsPanelHidden: Dispatch<SetStateAction<boolean>>
    pianoRollNoteWidth: number
    pianoRollScrollWindow: ScrollWindow
    stepsPerNote: number
    stepsPerBar: number
}

export default function EffectsPanel(props: EffectsPanelProps): React.JSX.Element {
    const {
        soundData,
        noteCursor: noteCursor, setNoteCursor,
        currentTrackId,
        currentPatternId,
        currentSequenceIndex,
        effectsPanelHidden, setEffectsPanelHidden,
        pianoRollNoteWidth,
        pianoRollScrollWindow,
        stepsPerNote, stepsPerBar
    } = props;
    const { services, onCommandExecute } = useContext(EditorsContext) as EditorsContextType;
    const [tab, setTab] = useState<number>(0);

    const width = Math.min(
        pianoRollScrollWindow.w,
        soundData.size * pianoRollNoteWidth
    );

    const toggleEffectsPanel = () => {
        setEffectsPanelHidden(prev => !prev);
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
            expandPanel={toggleEffectsPanel}
            pianoRollNoteWidth={pianoRollNoteWidth}
            pianoRollScrollWindow={pianoRollScrollWindow}
            stepsPerNote={stepsPerNote}
            stepsPerBar={stepsPerBar}
        />;
    } else {
        switch (tab) {
            default:
            case 0:
                grid = <EffectsPanelGrid
                    soundData={soundData}
                    noteCursor={noteCursor}
                    currentTrackId={currentTrackId}
                    currentPatternId={currentPatternId}
                    currentSequenceIndex={currentSequenceIndex}
                    setNoteCursor={setNoteCursor}
                    pianoRollNoteWidth={pianoRollNoteWidth}
                    pianoRollScrollWindow={pianoRollScrollWindow}
                    stepsPerNote={stepsPerNote}
                    stepsPerBar={stepsPerBar}
                />;
                break;
        }
    }

    useEffect(() => {
        const disp = onCommandExecute(commandListener);
        return () => disp.dispose();
    }, []);

    return <MetaLine
        style={{
            bottom: 0,
            borderTopWidth: 1,
            minHeight: effectsPanelHidden ? EFFECTS_PANEL_COLLAPSED_HEIGHT : EFFECTS_PANEL_EXPANDED_HEIGHT,
            width: width + PIANO_ROLL_KEY_WIDTH + 2,
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
                    `${SoundEditorCommands.TOGGLE_EFFECTS_PANEL_VISIBILITY.label}${services.vesCommonService.getKeybindingLabel(
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
            {!effectsPanelHidden &&
                <StyledTabList>
                    {EffectsPanelTabs.map(n => <Tab>{n}</Tab>)}
                </StyledTabList>
            }
            {grid}
        </Tabs>
    </MetaLine>;
}
