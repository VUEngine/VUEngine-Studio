import { nls } from '@theia/core';
import React, { useState } from 'react';
import { Language, LANGUAGES } from './TranslationsEditorTypes';

interface LanguagesTableProps {
    languages: Language[],
    onChangeFlag: (index: number, flag: string) => void
    onChangeLocalizedName: (index: number, localizedName: string) => void
    onChangeLanguage: (index: number, code: string) => void
    addLanguage: () => void
    removeLanguage: (code: string) => void
    moveLanguage: (from: number, to: number) => void
}

export default function LanguagesTable(props: LanguagesTableProps): React.JSX.Element {
    const [dragged, setDragged] = useState<boolean>(false);
    const {
        languages,
        onChangeFlag,
        onChangeLocalizedName,
        onChangeLanguage,
        addLanguage,
        removeLanguage,
        moveLanguage,
    } = props;

    const existingLanguageCodes = languages.map(lang => lang.code);

    const onDragStart = (e: React.DragEvent<HTMLDivElement>): void => {
        setDragged(true);
        e.currentTarget.classList.add('beingDragged');
        e.dataTransfer.setData('position', e.currentTarget.getAttribute('data-position') ?? '');
    };

    const onDragEnd = (e: React.DragEvent<HTMLDivElement>): void => {
        setDragged(false);
        e.currentTarget.classList.remove('beingDragged');

        const dragOverElements = document.getElementsByClassName('dragOver');
        for (let i = 0; i < dragOverElements.length; i++) {
            dragOverElements[i].classList.remove('dragOver');
        }
    };

    const onDrop = (e: React.DragEvent<HTMLDivElement>): void => {
        const from = parseInt(e.dataTransfer.getData('position'));
        const to = parseInt(e.currentTarget.getAttribute('data-position') ?? '');
        moveLanguage(from, to);
    };

    const onDragEnter = (e: React.DragEvent<HTMLDivElement>): void => {
        if (dragged) {
            e.currentTarget.classList.add('dragOver');
        }
    };

    const onDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
        e.currentTarget.classList.remove('dragOver');
    };

    return <div className='languagesTable'>
        <div>
            <div className='languageSelect'>
                Language
            </div>
            <div className='languageCode'>
                Code
            </div>
            <div className='languageName'>
                Localized Name
            </div>
            <div className='languageFlag'>
                Flag
            </div>
            <div className='languageActions'>
            </div>
        </div>
        {languages.map((lang, i) =>
            <div
                key={`string-key-${i}`}
                data-position={i}
                draggable={true}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
                onDragEnter={onDragEnter}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                <div className='languageSelect'>
                    <select
                        value={lang.code}
                        className='theia-select'
                        onChange={e => onChangeLanguage(i, e.target.value)}
                    >
                        {Object.keys(LANGUAGES).map(code =>
                            <option
                                key={`language-select-${code}`}
                                value={code}
                                disabled={existingLanguageCodes.includes(code) && lang.code !== code}
                            >
                                {nls.localize(`vuengine/general/languages/${code}`, LANGUAGES[code])}
                            </option>
                        )}
                    </select>
                </div>
                <div className='languageCode'>
                    <input
                        className="theia-input"
                        value={lang.code}
                        disabled={true}
                    />
                </div>
                <div className='languageName'>
                    <input
                        className="theia-input"
                        value={lang.localizedName}
                        onChange={e => onChangeLocalizedName(i, e.target.value)}
                    />
                </div>
                <div className='languageFlag'>
                    <input
                        className="theia-input"
                        value={lang.flag}
                        onChange={e => onChangeFlag(i, e.target.value)}
                    />
                </div>
                <div className='languageActions'>
                    <button
                        className='theia-button secondary'
                        title={nls.localize('vuengine/translationsEditor/reorderLanguage', 'Drag to reorder')}
                    >
                        <i className='codicon codicon-grabber' />
                    </button>
                    <button
                        className='theia-button secondary'
                        onClick={e => removeLanguage(lang.code)}
                        title={nls.localize('vuengine/translationsEditor/deleteLanguage', 'Delete Language')}
                    >
                        <i className='fa fa-trash' />
                    </button>
                </div>
            </div>
        )}
        <div
            className='languageAdd'
            onClick={addLanguage}
        >
            <i className='fa fa-plus' />
        </div>
    </div>;
}
