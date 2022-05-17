import React from 'react';
import { useState } from 'react';

interface VesRatingProps {
    id?: string;
    value: number;
    updateValue: (newValue: number) => void;
}

export const VesRating: React.FC<VesRatingProps> = ({ id, value, updateValue }) => {
    const [hoverAt, setHoverAt] = useState<number | undefined>(undefined);

    return (
        <div className='rating'>
            <label style={{ marginTop: '0.8em' }}>Rating</label>
            <div style={{ cursor: 'pointer', fontSize: '18px' }}>
                {[0, 1, 2, 3, 4].map(i => {
                    const fullStars = hoverAt ?? value;

                    return (
                        <span
                            onMouseOver={() => setHoverAt(i + 1)}
                            onMouseOut={() => setHoverAt(undefined)}
                            onClick={() => updateValue(i + 1)}
                            key={`${id}_${i}`}
                        >
                            {i < fullStars ? '\u2605' : '\u2606'}
                        </span>
                    );
                })}
            </div>
        </div>
    );
};
