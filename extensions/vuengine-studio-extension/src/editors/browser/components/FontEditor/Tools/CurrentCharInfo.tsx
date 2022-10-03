import React from 'react';
import { win1252CharNames } from '../FontEditorTypes';

interface CurrentCharInfoProps {
    currentCharacter: number
}

export default function CurrentCharInfo(props: CurrentCharInfoProps): JSX.Element {
    const { currentCharacter } = props;

    return <div className='current-character-info'>
        <input
            type="string"
            maxLength={1}
            minLength={1}
            className="theia-input large"
            value={win1252CharNames[currentCharacter]}
            readOnly
        />
        {currentCharacter} / 0x{currentCharacter.toString(16).toUpperCase().padStart(2, '0')}
    </div>;
}
