import React from 'react';

interface FontTileInfoProps {
    charCount: number
    sizeX: number
    sizeY: number
}

export default function FontTileInfo(props: FontTileInfoProps): React.JSX.Element {
    const { charCount, sizeY, sizeX } = props;

    const tileCount = charCount * sizeX * sizeY;

    return (
        <input
            className={`theia-input heaviness ${tileCount > 1024 ? 'heavinessHeavy' : tileCount > 512 ? 'heavinessMedium' : ''}`}
            style={{
                width: 64,
            }}
            type='text'
            value={`${tileCount > 2048 ? '⚠ ' : ''}${tileCount}`}
            disabled
        />
    );
}
