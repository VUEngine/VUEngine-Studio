import React from 'react';
import { MusicEditorStateApi, PatternConfig } from '../../ves-music-editor-types';

interface AddPatternProps {
    channel: number
    channelPatterns: number[]
    patterns: PatternConfig[]
    height: number
    stateApi: MusicEditorStateApi
}

export default function AddPattern(props: AddPatternProps): JSX.Element {
    const { channel, channelPatterns, patterns, height, stateApi } = props;

    const classNames = ['addPattern'];

    const style = {
        height: `${height / 2}px`,
    };

    const patternsForChannel: number[] = [];
    channelPatterns.forEach(patternId => {
        patterns.forEach(pattern => {
            if (pattern.channel === channel && !patternsForChannel.includes(pattern.id)) {
                patternsForChannel.push(pattern.id);
            }
        });
    });
    const largestPatternId = patternsForChannel.length
        ? Math.max.apply(undefined, patternsForChannel)
        : 0;

    return <div
        className={classNames.join(' ')}
        style={style}
    >
        <i className='fa fa-plus' />
        <div className='patternSelect'>
            <button
                className='newPattern'
                onClick={() => stateApi.addChannelPattern(channel, largestPatternId + 1)}
            >+</button>
            <div className='existingPatterns'>
                {[0, 1].map(remainder => (
                    <div key={`channel-add-row-${remainder}`}>
                        {patternsForChannel.map((patternId, index) => {
                            if (index % 2 === remainder) {
                                return (<button
                                    key={`channel-${channel}-add-${patternId}`}
                                    onClick={() => stateApi.addChannelPattern(channel, patternId)}
                                >
                                    {patternId}
                                </button>);
                            }
                        })}
                    </div>
                ))}
            </div>
        </div>
    </div>;
}
