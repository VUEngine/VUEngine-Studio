import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import styled from 'styled-components';
import { EditorCommand, EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { TrackConfig, PIANO_ROLL_KEY_WIDTH, SoundData, SEQUENCER_PATTERN_HEIGHT_DEFAULT } from '../SoundEditorTypes';
import { StyledTrackHeaderContainer } from './Sequencer';
import { getTrackName } from '../SoundEditor';
import { COLOR_PALETTE, DEFAULT_COLOR_INDEX } from '../../Common/PaletteColorSelect';

const StyledTrackHeader = styled.div`
    background-color: var(--theia-editor-background);
    border-bottom: 1px solid rgba(255, 255, 255, .2);
    border-left: 1px solid rgba(255, 255, 255, .6);
    border-right: 1px solid rgba(255, 255, 255, .6);
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    font-size: 10px;
    min-width: ${PIANO_ROLL_KEY_WIDTH + 2}px;
    overflow: hidden;
    width: ${PIANO_ROLL_KEY_WIDTH + 2}px;
    z-index: 100;

    body.theia-light &,
    body.theia-hc & {
        border-bottom-color: rgba(0, 0, 0, .2);
        border-left-color: rgba(0, 0, 0, .6);
        border-right-color: rgba(0, 0, 0, .6);
    }

    &.muted {
        color: rgba(255, 255, 255, .3);

        body.theia-light &,
        body.theia-hc & {
            background-color: rgba(0, 0, 0, .3);
        }
    }

    &.current {
        background-color: rgba(255, 255, 255, .1) !important;

        body.theia-light &,
        body.theia-hc & {
            background-color: rgba(0, 0, 0, .1) !important;
        }
    }

    &.last {
        border-bottom-color: rgba(255, 255, 255, .6);

        body.theia-light &,
        body.theia-hc & {
            border-bottom-color: rgba(0, 0, 0, .6);
        }
    }

    ${StyledTrackHeaderContainer} &:last-child {
        border-bottom-color: rgba(255, 255, 255, .4);

        body.theia-light &,
        body.theia-hc & {
            border-bottom-color: rgba(0, 0, 0, .4);
        }
    }
`;

const StyledTrackHeaderInfo = styled.div`
    box-sizing: border-box;
    flex-grow: 1;
    padding: 1px 3px;

    div {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &:nth-child(2) {
            font-size: 90%;
        }
    }
`;

const StyledTrackHeaderButtons = styled.div`
    display: flex;
    justify-content: space-between;
`;

const StyledTrackHeaderButtonsGroup = styled.div`
    display: flex;
`;

const StyledTrackHeaderButton = styled.div`
    align-items: center;
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    height: 14px;
    justify-content: center;
    flex-grow: 1;
    width: 16px;

    &:hover {
        background-color: rgba(255, 255, 255, .2);

        body.theia-light &,
        body.theia-hc & {
            background-color: rgba(0, 0, 0, .2);
        }
    }
`;

const getTrackCommand = (i: number): EditorCommand => {
    switch (i) {
        default:
        case 0: return SoundEditorCommands.SELECT_TRACK_1;
        case 1: return SoundEditorCommands.SELECT_TRACK_2;
        case 2: return SoundEditorCommands.SELECT_TRACK_3;
        case 3: return SoundEditorCommands.SELECT_TRACK_4;
        case 4: return SoundEditorCommands.SELECT_TRACK_5;
        case 5: return SoundEditorCommands.SELECT_TRACK_6;
    }
};

interface TrackHeaderProps {
    soundData: SoundData
    track: TrackConfig
    trackId: number
    currentTrackId: number
    setCurrentTrackId: (currentTrackId: number) => void
    removeTrack: (trackId: number) => void
    toggleTrackMuted: (trackId: number) => void
    toggleTrackSolo: (trackId: number) => void
    toggleTrackSeeThrough: (trackId: number) => void
    otherSolo: boolean
    setTrackDialogOpen: Dispatch<SetStateAction<boolean>>
    sequencerPatternHeight: number
}

export default function TrackHeader(props: TrackHeaderProps): React.JSX.Element {
    const {
        soundData,
        track,
        trackId,
        currentTrackId, setCurrentTrackId,
        removeTrack,
        toggleTrackMuted, toggleTrackSolo, toggleTrackSeeThrough,
        otherSolo,
        setTrackDialogOpen,
        sequencerPatternHeight,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;

    const classNames = [];
    if (track.muted || otherSolo) {
        classNames.push('muted');
    }
    if (track.solo) {
        classNames.push('solo');
    }
    if (currentTrackId === trackId) {
        classNames.push('current');
    }
    if (trackId === soundData.tracks.length - 1) {
        classNames.push('last');
    }

    const trackName = getTrackName(track.type, trackId);
    const trackCommand = getTrackCommand(trackId);
    const instrumentName = soundData.instruments[track.instrument]
        ? soundData.instruments[track.instrument].name
        : '-';
    const instrumentColor = soundData.instruments[track.instrument]
        ? soundData.instruments[track.instrument].color
        : DEFAULT_COLOR_INDEX;

    return <StyledTrackHeader
        className={classNames.join(' ')}
        onClick={() => setCurrentTrackId(trackId)}
        onDoubleClick={() => setTrackDialogOpen(true)}
        onContextMenu={() => removeTrack(trackId)}
        title={`${trackCommand.label}${services.vesCommonService.getKeybindingLabel(trackCommand.id, true)}`}
        style={{
            minHeight: sequencerPatternHeight,
        }}
    >
        <StyledTrackHeaderInfo>
            <div>{trackName}</div>
            {sequencerPatternHeight >= SEQUENCER_PATTERN_HEIGHT_DEFAULT &&
                <div style={{ color: COLOR_PALETTE[instrumentColor] }}>
                    { /* }
                    <span style={{ color: COLOR_PALETTE[instrumentColor] }}>●</span>
                    { */ }
                    {instrumentName}
                </div>
            }
        </StyledTrackHeaderInfo>
        <StyledTrackHeaderButtons>
            <StyledTrackHeaderButtonsGroup>
                <StyledTrackHeaderButton
                    className={track.seeThrough ? 'active' : undefined}
                    title={nls.localize('vuengine/editors/sound/showNoteShadows', 'Show Note Shadows On Other Tracks')}
                    onDoubleClick={e => e.stopPropagation()}
                    onClick={() => toggleTrackSeeThrough(trackId)}
                >
                    <i
                        className={`fa fa-${track.seeThrough ? 'eye' : 'eye-slash'}`}
                        style={{
                            opacity: track.seeThrough ? 1 : .3,
                        }}
                    />
                </StyledTrackHeaderButton>
                <StyledTrackHeaderButton
                    title={nls.localize('vuengine/editors/sound/muteTrack', 'Mute Track')}
                    onDoubleClick={e => e.stopPropagation()}
                    onClick={() => toggleTrackMuted(trackId)}
                >
                    <i
                        className={`fa fa-volume-${track.muted ? 'off' : 'up'}`}
                        style={{
                            opacity: track.muted ? .3 : 1,
                        }}
                    />
                </StyledTrackHeaderButton>
                <StyledTrackHeaderButton
                    title={nls.localize('vuengine/editors/sound/soloTrack', 'Solo Track')}
                    onDoubleClick={e => e.stopPropagation()}
                    onClick={() => toggleTrackSolo(trackId)}
                >
                    <i
                        className={`fa fa-star${track.solo ? '' : '-o'}`}
                        style={{
                            opacity: track.solo ? 1 : .3,
                        }}
                    />
                </StyledTrackHeaderButton>
            </StyledTrackHeaderButtonsGroup>
            <StyledTrackHeaderButtonsGroup>
                <StyledTrackHeaderButton
                    title={nls.localize('vuengine/editors/sound/editTrack', 'Edit Track')}
                    onDoubleClick={e => e.stopPropagation()}
                    onClick={() => setTrackDialogOpen(true)}
                >
                    <i className="fa fa-cog" />
                </StyledTrackHeaderButton>
            </StyledTrackHeaderButtonsGroup>
        </StyledTrackHeaderButtons>
    </StyledTrackHeader>;
}
