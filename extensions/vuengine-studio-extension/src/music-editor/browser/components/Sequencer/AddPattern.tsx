import React from 'react';
import { ChannelConfig } from '../types';

interface AddPatternProps {
    channel: ChannelConfig
    height: number
    addToSequence: (channelId: number, patternId: number) => void
}

export default function AddPattern(props: AddPatternProps): JSX.Element {
    const { channel, height, addToSequence } = props;

    const classNames = ['addPattern'];

    const style = {
        height: `${height / 2}px`,
    };

    return <div
        className={classNames.join(' ')}
        style={style}
    >
        <i className='fa fa-plus' />
        <div className='patternSelect'>
            <button
                className='newPattern'
                onClick={() => addToSequence(channel.id, channel.patterns.length)}
            >+</button>
            <div className='existingPatterns'>
                {[0, 1].map(remainder => (
                    <div key={`channel-add-row-${remainder}`}>
                        {channel.patterns.map((pattern, patternId) => {
                            if (patternId % 2 === remainder) {
                                return (<button
                                    key={`channel-${channel.id}-add-${patternId}`}
                                    onClick={() => addToSequence(channel.id, patternId)}
                                >
                                    {patternId + 1}
                                </button>);
                            }
                        })}
                    </div>
                ))}
            </div>
        </div>
    </div>;
}
