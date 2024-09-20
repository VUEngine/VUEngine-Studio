import { nls } from '@theia/core';
import React, { useContext } from 'react';
import { EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/HContainer';
import InfoLabel from '../../Common/InfoLabel';
import { clamp } from '../../Common/Utils';
import VContainer from '../../Common/VContainer';
import { INPUT_BLOCKING_COMMANDS } from '../FontEditor';
import { MAX_CHAR_COUNT, MAX_PAGE_SIZE, MIN_CHAR_COUNT, MIN_OFFSET, MIN_PAGE_SIZE } from '../FontEditorTypes';
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
    const { disableCommands, enableCommands } = useContext(EditorsContext) as EditorsContextType;

    const effectiveMaxCharCount = MAX_CHAR_COUNT - offset;
    const effectiveMaxOffset = MAX_CHAR_COUNT - charCount;
    const effectiveMaxPageSize = MAX_PAGE_SIZE - effectiveMaxOffset;

    return <HContainer gap={10} justifyContent='space-between'>
        <HContainer gap={10}>
            <VContainer>
                <label>
                    {nls.localize('vuengine/fontEditor/count', 'Count')}
                </label>
                <input
                    type="number"
                    className="theia-input"
                    style={{ width: 48 }}
                    step="1"
                    min={MIN_CHAR_COUNT}
                    max={effectiveMaxCharCount}
                    value={charCount}
                    onChange={e => setCharCount(
                        clamp(parseInt(e.target.value), MIN_CHAR_COUNT, effectiveMaxCharCount)
                    )}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
            </VContainer>
            <VContainer>
                <label>
                    {nls.localize('vuengine/fontEditor/offset', 'Offset')}
                </label>
                <input
                    type="number"
                    className="theia-input"
                    style={{ width: 48 }}
                    step="1"
                    min={MIN_OFFSET}
                    max={effectiveMaxOffset}
                    value={offset}
                    onChange={e => setOffset(
                        clamp(parseInt(e.target.value), MIN_OFFSET, effectiveMaxOffset)
                    )}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
            </VContainer>
            <VContainer>
                <InfoLabel
                    label={nls.localize('vuengine/fontEditor/pageSize', 'Page Size')}
                    tooltip={nls.localize(
                        'vuengine/fontEditor/pageSizeDescription',
                        'Tiles for this amount of characters will be loaded to memory at once. ' +
                        'For all regular use cases, this should be the total amount of characters in the font.'
                    )}
                />
                <input
                    type="number"
                    className="theia-input"
                    style={{ width: 48 }}
                    step="1"
                    min={MIN_PAGE_SIZE}
                    max={effectiveMaxPageSize}
                    value={pageSize}
                    onChange={e => setPageSize(
                        clamp(parseInt(e.target.value), MIN_PAGE_SIZE, effectiveMaxPageSize)
                    )}
                    onFocus={() => disableCommands(INPUT_BLOCKING_COMMANDS)}
                    onBlur={() => enableCommands(INPUT_BLOCKING_COMMANDS)}
                />
            </VContainer>
        </HContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/fontEditor/tiles', 'Tiles')}
            </label>
            <FontTileInfo
                charCount={pageSize}
                sizeX={sizeX}
                sizeY={sizeY}
            />
        </VContainer>
    </HContainer>;
}
