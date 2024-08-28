import React from 'react';
import { win1252CharNames } from '../FontEditorTypes';
import VContainer from '../../Common/VContainer';

interface CurrentCharInfoProps {
    currentCharacterIndex: number
    currentCharacterHoverIndex: number
}

export default function CurrentCharInfo(props: CurrentCharInfoProps): React.JSX.Element {
    const { currentCharacterIndex, currentCharacterHoverIndex } = props;

    const effectiveCurrentCharacterIndex = currentCharacterHoverIndex > -1 ? currentCharacterHoverIndex : currentCharacterIndex;

    return <VContainer className='current-character-info'>
        <input
            type="string"
            maxLength={1}
            minLength={1}
            className="theia-input"
            value={win1252CharNames[effectiveCurrentCharacterIndex]}
            readOnly
        />
        {effectiveCurrentCharacterIndex} / 0x{effectiveCurrentCharacterIndex.toString(16).toUpperCase().padStart(2, '0')}
    </VContainer>;
}
