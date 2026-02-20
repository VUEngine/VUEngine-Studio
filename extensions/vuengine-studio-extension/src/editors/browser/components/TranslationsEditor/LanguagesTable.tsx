import { DotsNine } from '@phosphor-icons/react';
import { deepClone, nls, QuickPickItem, QuickPickItemOrSeparator, QuickPickOptions } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { ReactElement, useContext, useEffect, useState } from 'react';
import SortableList, { SortableItem, SortableKnob } from 'react-easy-sort';
import styled from 'styled-components';
import { WithContributor, WithFileUri } from '../../../../project/browser/ves-project-types';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import { ActorData, ActorEditorContext } from '../ActorEditor/ActorEditorTypes';
import SpritePreview from '../ActorEditor/Preview/SpritePreview';
import HContainer from '../Common/Base/HContainer';
import Input from '../Common/Base/Input';
import VContainer from '../Common/Base/VContainer';
import { arrayMove, showItemSelection } from '../Common/Utils';
import { Language, LANGUAGE_PRESETS, Translation, Translations, TranslationsData } from './TranslationsEditorTypes';

const LANGUAGE_CONTAINER_HEIGHT = 110;
const LANGUAGE_CONTAINER_WIDTH = 290;

const StyledLanguageContainer = styled.div`
    border: 1px solid var(--theia-dropdown-border);
    border-radius: 2px;
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    font-size: var(--theia-ui-font-size1);
    gap: 10px;
    height: ${LANGUAGE_CONTAINER_HEIGHT}px;
    padding: 10px;
    width: ${LANGUAGE_CONTAINER_WIDTH}px;

    button {
        margin-left: 0;
        min-height: calc(2 * var(--theia-border-width) + var(--theia-content-line-height) + 2px);
        min-width: 32px;
        opacity: 0.1;
        padding-bottom: 0;
        padding-top: 0;
    }

    &:focus,
    &:hover {
        border-color: var(--theia-button-background);

        button {
            opacity: 1;
        }
    }

    .dragKnob {
        cursor: grab;
    }

    &.dragging {
        .dragKnob {
            cursor: grabbing;
        }   
    }
`;

const StyledPreviewContainer = styled.div`
    border: 1px solid var(--theia-dropdown-border);
    border-radius: 2px;
    height: 67px;
    position: relative;
    width: 80px;
`;

const StyledPreviewContainerClickOverlay = styled.div`
    cursor: pointer;
    height: 100%;
    position: absolute;
    width: 100%;
    z-index: 999999;
`;

const DropTarget = styled.div`
    border: 1px dotted var(--theia-dropdown-border);
    border-radius: 2px;
    box-sizing: border-box;
    height: ${LANGUAGE_CONTAINER_HEIGHT}px;
    width: ${LANGUAGE_CONTAINER_WIDTH}px;
`;

interface LanguagesTableProps {
    translationsData: TranslationsData,
    updateTranslationsData: (translationsData: TranslationsData) => void,
}

export default function LanguagesTable(props: LanguagesTableProps): React.JSX.Element {
    const { translationsData, updateTranslationsData } = props;
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const [flagPreviews, setFlagPreviews] = useState<ReactElement[]>([]);

    const setFlagActorId = async (index: number): Promise<void> => {
        const itemToAdd = await showItemSelection(
            'Actor',
            services.quickPickService,
            services.messageService,
            services.vesProjectService,
            [],
            [{
                id: '',
                label: nls.localize('vuengine/editors/translations/unset', 'Unset'),
            }, {
                type: 'separator',
            }]
        );
        if (itemToAdd !== undefined) {

            const updatedLanguages = deepClone(translationsData.languages);
            updatedLanguages[index] = {
                ...updatedLanguages[index],
                flagActorId: itemToAdd.id!,
            };

            updateTranslationsData({
                ...translationsData,
                languages: updatedLanguages
            });
        }
    };

    const setName = (index: number, name: string): void => {
        updateTranslationsData({
            ...translationsData,
            languages: translationsData.languages.map((l, i) => ({
                ...l,
                name: (i === index)
                    ? name
                    : l.name
            }))
        });
    };

    const setCode = (index: number, oldCode: string, newCode: string): void => {
        const allowedCode = newCode.slice(0, 2).padEnd(2, 'aa');

        if (translationsData.languages.map(l => l.code).includes(allowedCode)) {
            return;
        }

        updateTranslationsData({
            languages: translationsData.languages.map((l, i) => ({
                ...l,
                code: (i === index)
                    ? allowedCode
                    : l.code
            })),
            translations: Object.fromEntries(
                Object.entries(translationsData.translations)
                    .map(([tId, ts]) => ([
                        tId,
                        Object.fromEntries(
                            Object.entries(ts)
                                .map(([lCode, t]) => ([
                                    lCode === oldCode ? newCode : lCode,
                                    t
                                ]))
                        )
                    ]))
            )
        });
    };

    const showLanguageSelection = (): Promise<QuickPickItem | undefined> => {
        const quickPickOptions: QuickPickOptions<QuickPickItem> = {
            title: nls.localize('vuengine/editors/translations/addLanguage', 'Add Language'),
            placeholder: nls.localize('vuengine/editors/translations/selectLanguageToAdd', 'Select a language to add...'),
        };
        const items: QuickPickItemOrSeparator[] = [{
            id: 'custom',
            label: nls.localize('vuengine/editors/translations/customLanguage', 'Custom Language'),
        }, {
            type: 'separator',
            label: nls.localize('vuengine/editors/translations/presets', 'Presets'),
        }];
        const existingLanguageCodes = translationsData.languages.map(l => l.code);
        Object.values(LANGUAGE_PRESETS)
            .filter(l => !existingLanguageCodes.includes(l.code))
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(a => {
                items.push({
                    id: a.code,
                    label: a.code,
                    description: a.name,
                });
            });

        return services.quickPickService.show(
            items,
            quickPickOptions
        );
    };

    const addLanguage = async (): Promise<void> => {
        const languageToAdd = await showLanguageSelection();
        if (languageToAdd) {
            let preset = {
                code: 'xx',
                name: '',
                flagActorId: 'UZHCHu3RBQgKczqm', // unknown flag
            } as Language;
            if (languageToAdd.id !== 'custom') {
                preset = LANGUAGE_PRESETS[languageToAdd.id!];
            }

            // TODO: why does this not set dirty flag?
            updateTranslationsData({
                languages: [...translationsData.languages, preset],
                translations: Object.fromEntries(
                    Object.entries(translationsData.translations)
                        .map(([tId, ts]) => ([
                            tId,
                            { ...ts, [preset.code]: '' }
                        ]))
                )
            });
        }
    };

    const removeLanguage = async (language: Language): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/translations/deleteLanguageQuestion', 'Delete Language?'),
            msg: nls.localize(
                'vuengine/editors/translations/areYouSureYouWantToDelete',
                'Are you sure you want to delete {0}?',
                language.name,
            ),
        });
        const remove = await dialog.open();
        if (remove) {
            // remove translations for language
            const updatedTranslations: Translations = {};
            Object.keys(translationsData.translations).map(translationKey => {
                const updatedTranslation: Translation = {};
                Object.keys(translationsData.translations[translationKey]).map(languageId => {
                    if (languageId !== language.code) {
                        updatedTranslation[languageId] = translationsData.translations[translationKey][languageId];
                    }
                });
                updatedTranslations[translationKey] = updatedTranslation;
            });

            updateTranslationsData({
                languages: [...translationsData.languages.filter(l => l.code !== language.code)],
                translations: updatedTranslations,
            });
        }
    };

    const moveLanguage = (from: number, to: number): void => {
        // TODO: why does this not set dirty flag?
        updateTranslationsData({
            ...translationsData,
            languages: arrayMove(translationsData.languages, from, to),
        });
    };

    const getFlagPreviews = async (): Promise<void> => {
        const previews: ReactElement[] = [];

        await services.vesProjectService.projectDataReady;

        translationsData.languages.forEach((language, index) => {

            let actorPreview = <></>;
            let actorName = '';

            const actor = services.vesProjectService.getProjectDataItemById(language.flagActorId, 'Actor') as ActorData & WithContributor & WithFileUri;
            if (actor) {
                actorName = actor._contributorUri.parent.path.relative(actor._fileUri.path)?.fsPath() ?? '';
                actorPreview = (
                    <ActorEditorContext.Provider
                        // @ts-ignore
                        value={{
                            data: actor,
                            setCurrentComponent: () => { },
                            previewAnaglyph: false,
                            previewProjectionDepth: 128,
                        }}
                    >
                        <ActorEditorContext.Consumer>
                            {context => <>
                                {actor.components?.sprites?.map((sprite, i) =>
                                    <SpritePreview
                                        key={i}
                                        index={i}
                                        sprite={sprite}
                                        animate={false}
                                        dragging={false}
                                        frames={1}
                                        currentAnimationFrame={0}
                                        highlighted={false}
                                        palette={'11100100'}
                                    />
                                )}
                            </>}
                        </ActorEditorContext.Consumer>
                    </ActorEditorContext.Provider>
                );
            }

            previews.push(
                <StyledPreviewContainer
                    className='preview-container-world'
                    onClick={() => setFlagActorId(index)}
                >
                    <StyledPreviewContainerClickOverlay
                        onClick={() => setFlagActorId(index)}
                        title={actorName}
                    />
                    {actorPreview}
                </StyledPreviewContainer>
            );
        });

        setFlagPreviews(previews);
    };

    useEffect(() => {
        getFlagPreviews();
    }, [translationsData]);

    return (
        <SortableList
            onSortEnd={moveLanguage}
            draggedItemClassName='dragging'
            dropTarget={<DropTarget />}
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 10,
            }}
        >
            {translationsData.languages.map((lang, i) =>
                <SortableItem key={`string-key-${i}`}>
                    <StyledLanguageContainer>
                        <VContainer gap={15}>
                            <HContainer gap={10} grow={1}>
                                <VContainer grow={1}>
                                    <label>
                                        {nls.localizeByDefault('Name')}
                                    </label>
                                    <Input
                                        value={lang.name}
                                        setValue={v => setName(i, v as string)}
                                        grow={1}
                                    />
                                </VContainer>
                                <VContainer>
                                    <label>
                                        {nls.localizeByDefault('Code')}
                                    </label>
                                    <Input
                                        value={lang.code}
                                        setValue={v => setCode(i, lang.code, v as string)}
                                        width={48}
                                    />
                                </VContainer>
                            </HContainer>
                            <HContainer>
                                <SortableKnob>
                                    <button
                                        className='theia-button secondary dragKnob'
                                        title={nls.localize('vuengine/editors/translations/reorderLanguage', 'Drag to reorder')}
                                    >
                                        <DotsNine size={16} />
                                    </button>
                                </SortableKnob>
                                <button
                                    className='theia-button secondary'
                                    onClick={e => removeLanguage(lang)}
                                    title={nls.localize('vuengine/editors/translations/deleteLanguage', 'Delete Language')}
                                >
                                    <i className='codicon codicon-trash' />
                                </button>
                            </HContainer>
                        </VContainer>
                        <VContainer>
                            <label>
                                {nls.localizeByDefault('Flag')}
                            </label>
                            {flagPreviews[i]}
                        </VContainer>
                    </StyledLanguageContainer>
                </SortableItem>
            )}
            <button
                className='theia-button add-button'
                onClick={addLanguage}
                style={{ width: LANGUAGE_CONTAINER_WIDTH }}
                title={nls.localizeByDefault('Add')}
            >
                <i className='codicon codicon-plus' />
            </button>
        </SortableList>
    );
}
