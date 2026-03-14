import React from 'react';

interface FontTileInfoProps {
    tileCount: number
    sizeX: number
    sizeY: number
}

export default function FontTileInfo(props: FontTileInfoProps): React.JSX.Element {
    const { tileCount, sizeY, sizeX } = props;

    const tiles = tileCount * sizeX * sizeY;

    return (
        <input
            className={`theia-input heaviness ${tiles > 1024 ? 'heavinessHeavy' : tiles > 512 ? 'heavinessMedium' : ''}`}
            style={{
                width: 64,
            }}
            type='text'
            value={`${tiles > 2048 ? '⚠ ' : ''}${tiles}`}
            disabled
        />
    );
}
