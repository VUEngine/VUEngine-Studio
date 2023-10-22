import { nls } from '@theia/core';
import React from 'react';
import ReactTextareaAutosize from 'react-textarea-autosize';
import { Language, Translations } from './TranslationsEditorTypes';

interface TranslationsTableProps {
    editTranslations?: boolean,
    editIds?: boolean,
    addable?: boolean,
    removeable?: boolean,
    languages: Language[],
    translations: Translations,
    addTranslation: () => void
    removeTranslation: (s: string) => void
    onChangeTranslationId: (oldId: string, newId: string) => void
    onChangeTranslation: (id: string, languageCode: string, translation: string) => void
}

export default function TranslationsTable(props: TranslationsTableProps): React.JSX.Element {
    const {
        editTranslations = true,
        editIds = true,
        addable = true,
        removeable = true,
        languages,
        translations,
        addTranslation,
        removeTranslation,
        onChangeTranslationId,
        onChangeTranslation,
    } = props;

    return <div className='translationsTable'>
        {Object.keys(translations).map((s, i) =>
            <div key={`string-key-${i}`}>
                <div className='translationId'>
                    <input
                        className="theia-input"
                        value={s}
                        disabled={!editIds}
                        onChange={e => onChangeTranslationId(s, e.target.value)}
                    />
                </div>
                <div className='translationStrings'>
                    {
                        languages.map(lang =>
                            <div
                                className='translationLanguage'
                                key={`string-translations-${i}-${lang.code}`}
                            >
                                <label>{lang.code}</label>
                                <ReactTextareaAutosize
                                    className="theia-input"
                                    value={translations[s][lang.code]}
                                    readOnly={!editTranslations}
                                    disabled={!editTranslations}
                                    maxRows={5}
                                    onChange={e => onChangeTranslation(s, lang.code, e.target.value)}
                                    maxLength={48 * 28}
                                />
                            </div>
                        )
                    }
                </div>
                <div className='translationActions'>
                    {removeable && <button
                        className='theia-button secondary'
                        onClick={e => removeTranslation(s)}
                        title={nls.localize('vuengine/translationsEditor/deleteTranslation', 'Delete Translation')}
                    >
                        <i className='fa fa-trash' />
                    </button>}
                </div>
            </div>
        )}
        {addable && <div
            className='translationAdd'
            onClick={addTranslation}
        >
            <i className='fa fa-plus' />
        </div>}
    </div>;
}
