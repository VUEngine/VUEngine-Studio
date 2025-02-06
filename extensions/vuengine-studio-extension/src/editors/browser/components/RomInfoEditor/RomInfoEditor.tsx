import React from 'react';
import VContainer from '../Common/Base/VContainer';
import {
    GAME_CODE_ID_MAX_LENGTH,
    GAME_CODE_LANGUAGE_MAX_LENGTH,
    GAME_CODE_SYSTEM_MAX_LENGTH,
    GAME_TITLE_MAX_LENGTH,
    MAKER_CODE_MAX_LENGTH,
    REVISION_MAX_VALUE,
    REVISION_MIN_VALUE,
    RomInfoData
} from './RomInfoEditorTypes';
import { nls } from '@theia/core';
import InfoLabel from '../Common/InfoLabel';
import { clamp } from '../Common/Utils';
import HContainer from '../Common/Base/HContainer';

interface RomInfoEditorProps {
    data: RomInfoData
    updateData: (data: RomInfoData) => void
}

export default function RomInfoEditor(props: RomInfoEditorProps): React.JSX.Element {
    const { data, updateData } = props;

    const setGameTitle = (gameTitle: string): void => {
        updateData({
            ...data,
            gameTitle: gameTitle.substring(0, GAME_TITLE_MAX_LENGTH),
        });
    };

    const setGameCodeId = (gameCodeId: string): void => {
        updateData({
            ...data,
            gameCodeId: gameCodeId.substring(0, GAME_CODE_ID_MAX_LENGTH).toUpperCase(),
        });
    };

    const setGameCodeLanguage = (gameCodeLanguage: string): void => {
        updateData({
            ...data,
            gameCodeLanguage: gameCodeLanguage.substring(0, GAME_CODE_LANGUAGE_MAX_LENGTH).toUpperCase(),
        });
    };

    const setMakerCode = (makerCode: string): void => {
        updateData({
            ...data,
            makerCode: makerCode.substring(0, MAKER_CODE_MAX_LENGTH).toUpperCase(),
        });
    };

    const setRevision = (revision: number): void => {
        updateData({
            ...data,
            revision: clamp(revision, REVISION_MIN_VALUE, REVISION_MAX_VALUE, REVISION_MIN_VALUE),
        });
    };

    return <VContainer gap={15}>
        <VContainer>
            <InfoLabel
                label={nls.localize('vuengine/editors/romInfo/gameTitle', 'Game Title')}
                tooltip={nls.localize(
                    'vuengine/editors/romInfo/gameTitleDescription',
                    "The game's title. Up to {0} characters.",
                    GAME_TITLE_MAX_LENGTH
                )}
            />
            <input
                className='theia-input'
                value={data.gameTitle}
                style={{ width: 288 }}
                onChange={e => setGameTitle(e.target.value)}
            />
        </VContainer>
        <VContainer>
            <InfoLabel
                label={nls.localize('vuengine/editors/romInfo/gameCode', 'Game Code')}
            />
            <HContainer gap={15}>
                <VContainer>
                    <InfoLabel
                        label={nls.localize('vuengine/editors/romInfo/system', 'System')}
                        tooltip={nls.localize(
                            'vuengine/editors/romInfo/systemDescription',
                            '{0} character system code. Always "V" for "VUE".',
                            GAME_CODE_SYSTEM_MAX_LENGTH
                        )}
                    />
                    <input
                        className='theia-input'
                        value={data.gameCodeSystem}
                        style={{ width: 80 }}
                        disabled
                    />
                </VContainer>
                <VContainer>
                    <InfoLabel
                        label={nls.localize('vuengine/editors/romInfo/id', 'ID')}
                        tooltip={nls.localize(
                            'vuengine/editors/romInfo/idDescription',
                            'Unique game identifier. {0} characters.',
                            GAME_CODE_ID_MAX_LENGTH
                        )}
                    />
                    <input
                        className='theia-input'
                        value={data.gameCodeId}
                        style={{ width: 80 }}
                        onChange={e => setGameCodeId(e.target.value)}
                    />
                </VContainer>
                <VContainer>
                    <InfoLabel
                        label={nls.localize('vuengine/editors/romInfo/language', 'Language')}
                        tooltip={nls.localize(
                            'vuengine/editors/romInfo/languageDescription',
                            'In-game language. {0} character. Usually "E" for "English", "J" for "Japanese" or "M" for multiple languages.',
                            GAME_CODE_LANGUAGE_MAX_LENGTH
                        )}
                    />
                    <input
                        className='theia-input'
                        value={data.gameCodeLanguage}
                        style={{ width: 80 }}
                        onChange={e => setGameCodeLanguage(e.target.value)}
                    />
                </VContainer>
            </HContainer>
        </VContainer>
        <VContainer>
            <InfoLabel
                label={nls.localize('vuengine/editors/romInfo/makerCode', 'Maker Code')}
                tooltip={nls.localize(
                    'vuengine/editors/romInfo/makerCodeDescription',
                    "Unique {0} character identifier of the game's developer.",
                    MAKER_CODE_MAX_LENGTH
                )}
            />
            <input
                className='theia-input'
                value={data.makerCode}
                style={{ width: 80 }}
                onChange={e => setMakerCode(e.target.value)}
            />
        </VContainer>
        <VContainer>
            <InfoLabel
                label={nls.localize('vuengine/editors/romInfo/revision', 'Revision')}
                tooltip={nls.localize(
                    'vuengine/editors/romInfo/revisionDescription',
                    'Version of the game, should be counted up with every release.',
                )}
            />
            <HContainer alignItems="center">
                1.
                <input
                    className="theia-input"
                    style={{ width: 66 }}
                    type="number"
                    value={data.revision}
                    min={REVISION_MIN_VALUE}
                    max={REVISION_MAX_VALUE}
                    onChange={e => setRevision(e.target.value === '' ? REVISION_MIN_VALUE : parseInt(e.target.value))}
                />
            </HContainer>
        </VContainer>
    </VContainer>;
}
