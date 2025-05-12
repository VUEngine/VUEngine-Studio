import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorCommand, EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import { SoundEditorCommands } from '../SoundEditorCommands';
import { ChannelConfig, SoundEditorChannelType } from '../SoundEditorTypes';
import { StyledChannelHeader, StyledChannelHeaderButton, StyledChannelHeaderButtons, StyledChannelHeaderButtonsGroup, StyledChannelHeaderInfo } from './StyledComponents';

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
}

export default function ChannelHeader(props: ChannelHeaderProps): React.JSX.Element {
    const {
        channel,
        channelId,
        currentChannelId, setCurrentChannelId,
        toggleChannelMuted, toggleChannelSolo, toggleChannelSeeThrough,
        otherSolo,
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
                    onClick={() => { }}
                >
                    <i className="fa fa-cog" />
                </StyledChannelHeaderButton>
            </StyledChannelHeaderButtonsGroup>
        </StyledChannelHeaderButtons>
    </StyledChannelHeader>;
}
