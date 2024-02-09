import { nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React from 'react';
import HContainer from '../Common/HContainer';
import { LANGUAGES } from '../TranslationsEditor/TranslationsEditorTypes';
import { PluginFileTranslatedField } from './PluginFileEditorTypes';

interface TranslatedValueProps {
    data: PluginFileTranslatedField;
    setData: (data: PluginFileTranslatedField) => void;
}

export default function TranslatedValue(props: TranslatedValueProps): React.JSX.Element {
    const { data, setData } = props;

    const usedLangIds = Object.keys(data || {});

    const setTranslationLangCode = (prevLangCode: string, newLangCode: string): void => {
        const updatedData = { ...data };
        updatedData[newLangCode] = updatedData[prevLangCode];
        delete updatedData[prevLangCode];

        const sortedData: { [id: string]: string } = {};
        Object.keys(updatedData).sort((a, b) => a.localeCompare(b)).forEach(key => {
            sortedData[key] = updatedData[key];
        });

        setData(sortedData);
    };

    const setTranslationValue = (langCode: string, translation: string): void => {
        setData({
            ...data,
            [langCode]: translation,
        });
    };

    const addTranslation = (): void => {
        const availableLangCodes = Object.keys(LANGUAGES)
            .filter(k => !usedLangIds.includes(k));
        if (availableLangCodes.length === 0) {
            return;
        }

        const localeKey = nls.locale || 'en';
        const newLangCode = availableLangCodes.includes(localeKey)
            ? localeKey
            : availableLangCodes[0];

        const updatedData = { ...data };
        updatedData[newLangCode] = '';

        const sortedData: { [id: string]: string } = {};
        Object.keys(updatedData).sort((a, b) => a.localeCompare(b)).forEach(key => {
            sortedData[key] = updatedData[key];
        });

        setData(sortedData);
    };

    const removeTranslation = async (langCode: string): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/entityEditor/removeTranslation', 'Remove Translation'),
            msg: nls.localize('vuengine/entityEditor/areYouSureYouWantToRemoveTranslation', 'Are you sure you want to remove this translation?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            const updatedData = { ...data };
            delete updatedData[langCode];

            setData(updatedData);
        }
    };

    return <>
        {usedLangIds.map(l =>
            <HContainer key={l}>
                <input
                    className='theia-input'
                    style={{ flexGrow: 1 }}
                    value={data[l]}
                    onChange={e => setTranslationValue(l, e.target.value)}
                />
                <select
                    value={l}
                    className='theia-select'
                    onChange={e => setTranslationLangCode(l, e.target.value)}
                >
                    {Object.keys(LANGUAGES).map(code =>
                        <option
                            key={code}
                            value={code}
                            disabled={usedLangIds.includes(code) && code !== l}
                        >
                            {nls.localize(`vuengine/general/languages/${code}`, LANGUAGES[code])}
                        </option>
                    )}
                </select>
                <button
                    className='theia-button secondary'
                    title={nls.localize('vuengine/editors/removeTranslation', 'Remove Translation')}
                    onClick={() => removeTranslation(l)}
                >
                    <i className='codicon codicon-x' />
                </button>
            </HContainer>
        )}
        <button
            className='theia-button add-button full-width'
            onClick={addTranslation}
            title={nls.localize('vuengine/editors/addTranslation', 'Add Translation')}
        >
            <i className='codicon codicon-plus' />
        </button>
    </>;
}
