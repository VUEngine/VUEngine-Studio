import { nls } from '@theia/core';
import React, { Dispatch, SetStateAction, useContext } from 'react';
import styled from 'styled-components';
import { EditorCommand, EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { ChannelConfig, PATTERN_HEIGHT, PIANO_ROLL_KEY_WIDTH, SoundEditorChannelType } from '../SoundEditorTypes';
import { StyledChannelHeaderContainer } from './Sequencer';

const StyledChannelHeader = styled.div`
    background-color: var(--theia-editor-background);
    border-bottom: 1px solid rgba(255, 255, 255, .2);
    border-left: 1px solid rgba(255, 255, 255, .6);
    box-sizing: border-box;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    font-size: 10px;
    height: ${PATTERN_HEIGHT}px;
    min-width: ${PIANO_ROLL_KEY_WIDTH}px;
    overflow: hidden;
    width: ${PIANO_ROLL_KEY_WIDTH + 1}px;
    z-index: 100;

    body.theia-light &,
    body.theia-hc & {
        border-bottom-color: rgba(0, 0, 0, .2);
        border-left-color: rgba(0, 0, 0, .6);
    }

    &.current {
        background-color: var(--theia-focusBorder) !important;
        color: #fff;
    }

    ${StyledChannelHeaderContainer} &:last-child {
        border-bottom-color: rgba(255, 255, 255, .4);

        body.theia-light &,
        body.theia-hc & {
            border-bottom-color: rgba(0, 0, 0, .4);
        }
    }
`;

const StyledChannelHeaderInfo = styled.div`
    align-items: start;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    justify-content: center;
    padding: 3px 3px 1px;
`;

const StyledChannelHeaderButtons = styled.div`
    display: flex;
    justify-content: space-between;
    margin: 0 0 1px 1px;
`;

const StyledChannelHeaderButtonsGroup = styled.div`
    display: flex;
`;

const StyledChannelHeaderButton = styled.div`
    align-items: center;
    border-radius: 2px;
    cursor: pointer;
    display: flex;
    height: 16px;
    justify-content: center;
    flex-grow: 1;
    width: 16px;

    &:hover {
        background: rgba(0, 0, 0, .2);
    }
`;

const getChannelCommand = (i: number): EditorCommand => {
    switch (i) {
        default:
        case 0: return SoundEditorCommands.SELECT_CHANNEL_1;
        case 1: return SoundEditorCommands.SELECT_CHANNEL_2;
        case 2: return SoundEditorCommands.SELECT_CHANNEL_3;
        case 3: return SoundEditorCommands.SELECT_CHANNEL_4;
        case 4: return SoundEditorCommands.SELECT_CHANNEL_5;
        case 5: return SoundEditorCommands.SELECT_CHANNEL_6;
    }
};

const getChannelName = (type: SoundEditorChannelType, i: number): string => {
    switch (type) {
        case SoundEditorChannelType.NOISE:
            return nls.localize('vuengine/editors/sound/noise', 'Noise');
        case SoundEditorChannelType.SWEEPMOD:
            return nls.localize('vuengine/editors/sound/waveSmShort', 'Wave (SM)');
        default:
        case SoundEditorChannelType.WAVE:
            return `${nls.localize('vuengine/editors/sound/wave', 'Wave')} ${i + 1}`;
    }
};

interface ChannelHeaderProps {
    channel: ChannelConfig
    channelId: number
    currentChannelId: number
    setCurrentChannelId: (currentChannelId: number) => void
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
    toggleChannelSeeThrough: (channelId: number) => void
    otherSolo: boolean
    setChannelDialogOpen: Dispatch<SetStateAction<boolean>>
}

export default function ChannelHeader(props: ChannelHeaderProps): React.JSX.Element {
    const {
        channel,
        channelId,
        currentChannelId, setCurrentChannelId,
        toggleChannelMuted, toggleChannelSolo, toggleChannelSeeThrough,
        otherSolo,
        setChannelDialogOpen,
    } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;

    const classNames = [];
    if (channel.muted || otherSolo) {
        classNames.push('muted');
    }
    if (channel.solo) {
        classNames.push('solo');
    }
    if (currentChannelId === channelId) {
        classNames.push('current');
    }

    const channelName = getChannelName(channel.type, channelId);
    const channelCommand = getChannelCommand(channelId);

    return <StyledChannelHeader
        className={classNames.join(' ')}
        onClick={() => setCurrentChannelId(channelId)}
        title={`${channelCommand.label}${services.vesCommonService.getKeybindingLabel(channelCommand.id, true)}`}
    >
        <StyledChannelHeaderInfo>
            <div className='channelName'>
                {channelName}
            </div>
        </StyledChannelHeaderInfo>
        <StyledChannelHeaderButtons>
            <StyledChannelHeaderButtonsGroup>
                <StyledChannelHeaderButton
                    className={channel.seeThrough ? 'active' : undefined}
                    onClick={() => toggleChannelSeeThrough(channelId)}
                >
                    <i
                        className={`fa fa-${channel.seeThrough ? 'eye' : 'eye-slash'}`}
                        style={{
                            opacity: channel.seeThrough ? 1 : .3,
                        }}
                    />
                </StyledChannelHeaderButton>
                <StyledChannelHeaderButton
                    onClick={() => toggleChannelMuted(channelId)}
                >
                    <i
                        className={`fa fa-volume-${channel.muted ? 'off' : 'up'}`}
                        style={{
                            opacity: channel.muted ? .3 : 1,
                        }}
                    />
                </StyledChannelHeaderButton>
                <StyledChannelHeaderButton
                    onClick={() => toggleChannelSolo(channelId)}
                >
                    <i
                        className={`fa fa-star${channel.solo ? '' : '-o'}`}
                        style={{
                            opacity: channel.solo ? 1 : .3,
                        }}
                    />
                </StyledChannelHeaderButton>
            </StyledChannelHeaderButtonsGroup>
            <StyledChannelHeaderButtonsGroup>
                <StyledChannelHeaderButton
                    onClick={() => setChannelDialogOpen(true)}
                >
                    <i className="fa fa-cog" />
                </StyledChannelHeaderButton>
            </StyledChannelHeaderButtonsGroup>
        </StyledChannelHeaderButtons>
    </StyledChannelHeader>;
}
