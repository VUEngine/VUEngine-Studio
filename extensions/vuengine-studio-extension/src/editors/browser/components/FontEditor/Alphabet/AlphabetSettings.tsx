import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../../Common/Base/HContainer';
import Input from '../../Common/Base/Input';
import VContainer from '../../Common/Base/VContainer';
import { INPUT_BLOCKING_COMMANDS, MAX_CHAR_COUNT, MAX_PAGE_SIZE, MIN_CHAR_COUNT, MIN_OFFSET, MIN_PAGE_SIZE } from '../FontEditorTypes';
import FontTileInfo from '../Tools/FontTileInfo';

interface AlphabetSettingsProps {
    charCount: number
    setCharCount: (charCount: number) => void
    offset: number
    setOffset: (offset: number) => void
    pageSize: number
    setPageSize: (pageSize: number) => void
    sizeX: number
    sizeY: number
}

export default function AlphabetSettings(props: AlphabetSettingsProps): React.JSX.Element {
    const { charCount, setCharCount, offset, setOffset, pageSize, setPageSize, sizeX, sizeY } = props;

    const effectiveMaxCharCount = MAX_CHAR_COUNT - offset;
    const effectiveMaxOffset = MAX_CHAR_COUNT - charCount;
    const effectiveMaxPageSize = MAX_PAGE_SIZE - effectiveMaxOffset;

    return <HContainer gap={10} justifyContent='space-between'>
        <HContainer gap={10}>
            <Input
                label={nls.localize('vuengine/editors/font/count', 'Count')}
                type="number"
                value={charCount}
                setValue={setCharCount}
                min={MIN_CHAR_COUNT}
                max={effectiveMaxCharCount}
                width={48}
                commands={INPUT_BLOCKING_COMMANDS}
            />
            <Input
                label={nls.localize('vuengine/editors/font/offset', 'Offset')}
                type="number"
                value={offset}
                setValue={setOffset}
                min={MIN_OFFSET}
                max={effectiveMaxOffset}
                commands={INPUT_BLOCKING_COMMANDS}
                width={48}
            />
            <Input
                label={nls.localize('vuengine/editors/font/pageSize', 'Page Size')}
                tooltip={nls.localize(
                    'vuengine/editors/font/pageSizeDescription',
                    'Tiles for this amount of characters will be loaded to memory at once. \
For all regular use cases, this should be the total amount of characters in the font.'
                )}
                type="number"
                value={pageSize}
                setValue={setPageSize}
                min={MIN_PAGE_SIZE}
                max={effectiveMaxPageSize}
                width={48}
                commands={INPUT_BLOCKING_COMMANDS}
            />
        </HContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/editors/font/tiles', 'Tiles')}
            </label>
            <FontTileInfo
                charCount={pageSize}
                sizeX={sizeX}
                sizeY={sizeY}
            />
        </VContainer>
    </HContainer>;
}
