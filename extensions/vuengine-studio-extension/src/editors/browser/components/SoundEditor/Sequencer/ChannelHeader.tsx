import React from 'react';
import { ChannelConfig } from '../SoundEditorTypes';
import { StyledChannelHeader, StyledChannelHeaderButton, StyledChannelHeaderButtons, StyledChannelHeaderInfo } from './StyledComponents';
import { nls } from '@theia/core';

interface ChannelHeaderProps {
    channel: ChannelConfig
    currentChannelId: number
    setCurrentChannelId: (currentChannelId: number) => void
    toggleChannelMuted: (channelId: number) => void
    toggleChannelSolo: (channelId: number) => void
    toggleChannelSeeThrough: (channelId: number) => void
}

export default function ChannelHeader(props: ChannelHeaderProps): React.JSX.Element {
    const { channel, currentChannelId, setCurrentChannelId, toggleChannelMuted, toggleChannelSolo, toggleChannelSeeThrough } = props;

    const classNames = [];
    if (currentChannelId === channel.id) {
        classNames.push('current');
    }

    const getChannelName = (i: number): string => {
        switch (i) {
            case 0:
            case 1:
            case 2:
            case 3:
                return `${nls.localize('vuengine/editors/sound/wave', 'Wave')} ${i + 1}`;
            case 4:
                return nls.localize('vuengine/editors/sound/sweepModulationShort', 'Sw./Mod.');
            case 5:
                return nls.localize('vuengine/editors/sound/noise', 'Noise');
        }
        return '';
    };

    return <StyledChannelHeader className={classNames.join(' ')}>
        <StyledChannelHeaderInfo
            onClick={() => setCurrentChannelId(channel.id)}
        >
            <div className='channelName'>
                {getChannelName(channel.id)}
            </div>
        </StyledChannelHeaderInfo>
        <StyledChannelHeaderButtons>
            <StyledChannelHeaderButton
                className={channel.seeThrough ? 'active' : undefined}
                onClick={() => toggleChannelSeeThrough(channel.id)}
            >
                <i
                    className={`fa fa-${channel.seeThrough ? 'eye' : 'eye-slash'}`}
                    style={{
                        opacity: channel.seeThrough ? 1 : .3,
                    }}
                />
            </StyledChannelHeaderButton>
            <StyledChannelHeaderButton
                className={channel.muted ? 'active' : undefined}
                onClick={() => toggleChannelMuted(channel.id)}
            >
                <i className={`fa fa-volume-${channel.muted ? 'off' : 'up'}`} />
            </StyledChannelHeaderButton>
            <StyledChannelHeaderButton
                className={channel.solo ? 'active' : undefined}
                onClick={() => toggleChannelSolo(channel.id)}
            >
                <i className={`fa fa-star${channel.solo ? '' : '-o'}`} />
            </StyledChannelHeaderButton>
        </StyledChannelHeaderButtons>
    </StyledChannelHeader>;
}
