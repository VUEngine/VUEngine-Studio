import { nls } from '@theia/core';
import React from 'react';
import HContainer from '../Common/Base/HContainer';
import Input from '../Common/Base/Input';
import VContainer from '../Common/Base/VContainer';
import InfoLabel from '../Common/InfoLabel';
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
            revision,
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
            <Input
                value={data.gameTitle}
                style={{ width: 288 }}
                setValue={setGameTitle}
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
                    <Input
                        value={data.gameCodeSystem}
                        setValue={() => { }}
                        width={80}
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
                    <Input
                        value={data.gameCodeId}
                        width={80}
                        setValue={setGameCodeId}
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
                    <Input
                        value={data.gameCodeLanguage}
                        width={80}
                        setValue={setGameCodeLanguage}
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
            <Input
                value={data.makerCode}
                width={80}
                setValue={setMakerCode}
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
                <Input
                    type="number"
                    value={data.revision}
                    setValue={setRevision}
                    min={REVISION_MIN_VALUE}
                    max={REVISION_MAX_VALUE}
                    width={66}
                />
            </HContainer>
        </VContainer>
    </VContainer>;
}
