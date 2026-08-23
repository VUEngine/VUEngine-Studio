import { PreferenceScope, PreferenceService, deepClone, nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React from 'react';
import styled from 'styled-components';
import {
    VB_ANAGLYPH_PALETTES,
    VB_DEFAULT_ANAGLYPH_PALETTE_ID,
    VB_DEFAULT_PALETTE_ID,
    VB_PALETTES,
} from '../../common/ves-vb-constants';
import HContainer from '../../../editors/browser/components/Common/Base/HContainer';
import VContainer from '../../../editors/browser/components/Common/Base/VContainer';
import { VesEmulatorPreferenceIds } from '../ves-emulator-preferences';
import {
    CustomAnaglyphPalette,
    CustomPalette,
    EMULATION_ANAGLYPH_PALETTES,
    EMULATION_PALETTES,
    getCustomPaletteId,
    formatColor,
    resolvePalette,
    toVbPalette,
} from '../ves-emulator-types';

const StyledPalette = styled.button<{ selected?: boolean }>`
    align-items: center;
    background-color: ${p => p.selected ? 'var(--theia-list-activeSelectionBackground)' : 'var(--theia-secondaryButton-background)'};
    border: none;
    border-radius: 2px;
    box-sizing: border-box;
    color: var(--theia-foreground-color);
    cursor: pointer;
    display: flex;
    flex-direction: column;
    font-size: 80%;
    gap: 5px;
    min-height: 80px !important;
    overflow: hidden;
    padding: var(--theia-ui-padding) !important;
    width: 120px;

    &:focus,
    &:hover {
        outline: 1px solid var(--theia-button-background);
        outline-offset: 1px;
    }

    i {
        font-size: 120% !important;
        vertical-align: bottom;
    }

    div {      
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;

const StyledNewPalette = styled(StyledPalette)`
    background-color: transparent;
    border: 1px solid var(--theia-secondaryButton-background);

    i[class*='codicon-plus'] {
        color: var(--theia-secondaryButton-background);
        font-size: 180% !important;
    }
`;

export function PaletteSwatch(props: { colors: string[], small?: boolean }): React.JSX.Element {
    return <Swatch className={props.small ? 'small' : undefined}>
        {props.colors.map((color, level) =>
            <div key={level} style={{ backgroundColor: color }} />
        )}
    </Swatch>;
}

export function AnaglyphSwatch(props: { left: string, right: string, small?: boolean }): React.JSX.Element {
    return <Swatch className={props.small ? 'small' : undefined}>
        <div style={{ backgroundColor: props.left, gridRow: 'span 2' }} />
        <div style={{ backgroundColor: props.right, gridRow: 'span 2' }} />
    </Swatch>;
}

const Swatch = styled.div`
    border-radius: 2px;
    display: grid;
    grid-template-columns: 50% 50%;
    grid-template-rows: 50% 50%;
    height: 100%;
    overflow: hidden;
    width: 80px;

    &.small {
        width: 32px;
    }
`;

const PaletteEntry = styled(HContainer) <{ selected: boolean }>`
    align-items: center;
    background-color: ${p => p.selected ? 'var(--theia-list-activeSelectionBackground)' : 'transparent'};
    border: 1px solid ${p => p.selected ? 'var(--theia-focusBorder)' : 'var(--theia-dropdown-border)'};
    border-radius: 2px;
    color: ${p => p.selected ? 'var(--theia-list-activeSelectionForeground)' : 'inherit'};
    cursor: pointer;
    padding: calc(var(--theia-ui-padding) / 2) var(--theia-ui-padding);

    input[type="color"] {
        background-color: transparent;
        border: none;
        cursor: pointer;
        height: 22px;
        padding: 0;
        width: 24px;
    }

    button.theia-button {
        margin: 0;
        min-width: 24px;
    }
`;

const PaletteName = styled.div`
    flex-grow: 1;
    height: 16px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap !important;
    width: 100%;
`;

const DEFAULT_TINTS = VB_ANAGLYPH_PALETTES[VB_DEFAULT_ANAGLYPH_PALETTE_ID];

/** What each colour of a palette is for, in the order they are edited. */
const LEVEL_TITLES = [
    nls.localize('vuengine/emulator/palettes/level0', 'Unlit pixel'),
    nls.localize('vuengine/emulator/palettes/level1', 'Brightness level 1'),
    nls.localize('vuengine/emulator/palettes/level2', 'Brightness level 2'),
    nls.localize('vuengine/emulator/palettes/level3', 'Brightness level 3, fully lit'),
];

interface EmulatorPalettesProps {
    preferenceService: PreferenceService
    /** Whether the anaglyph pairs apply to the active rendering mode. */
    anaglyph: boolean
}

/**
 * Picks the colours the emulator shows the display in: a colour ramp for every
 * rendering mode that shows an eye on its own, and, while the Anaglyph mode is
 * active, the pair of tints it assigns to the two eyes.
 *
 * Selections take effect immediately, so the picture behind the window shows
 * what a palette actually looks like.
 */
export default function EmulatorPalettes(props: EmulatorPalettesProps): React.JSX.Element {
    const { preferenceService, anaglyph } = props;

    /**
     * Stored palettes with every colour filled in. settings.json is editable by
     * hand, and a palette missing a level would otherwise reach a colour input
     * as undefined; a missing level falls back to the default palette's.
     */
    const readCustomPalettes = (): CustomPalette[] =>
        preferenceService.get<CustomPalette[]>(
            VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_PALETTES, []
        ).map(entry => ({
            name: entry.name ?? '',
            colors: toVbPalette(entry.colors ?? []).map(formatColor),
        }));

    const readCustomAnaglyphPalettes = (): CustomAnaglyphPalette[] =>
        preferenceService.get<CustomAnaglyphPalette[]>(
            VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_ANAGLYPH_PALETTES, []
        ).map(entry => ({
            name: entry.name ?? '',
            left: entry.left ?? formatColor(DEFAULT_TINTS.left),
            right: entry.right ?? formatColor(DEFAULT_TINTS.right),
        }));

    const [palette, setPalette] = React.useState<string>(
        preferenceService.get(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PALETTE, VB_DEFAULT_PALETTE_ID)
    );
    const [anaglyphPalette, setAnaglyphPalette] = React.useState<string>(
        preferenceService.get(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_ANAGLYPH_PALETTE, VB_DEFAULT_ANAGLYPH_PALETTE_ID)
    );
    const [customPalettes, setCustomPalettes] = React.useState<CustomPalette[]>(readCustomPalettes);
    const [customAnaglyphPalettes, setCustomAnaglyphPalettes] =
        React.useState<CustomAnaglyphPalette[]>(readCustomAnaglyphPalettes);

    const update = (preferenceId: string, value: unknown) =>
        preferenceService.set(preferenceId, value, PreferenceScope.User);

    const select = (id: string) =>
        update(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PALETTE, id);

    const selectAnaglyph = (id: string) =>
        update(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_ANAGLYPH_PALETTE, id);

    /** A name no palette in the given list carries yet. */
    const newName = (taken: { name: string }[]): string => {
        const base = nls.localize('vuengine/emulator/palettes/custom', 'Custom');
        let name = base;
        let index = 1;
        while (taken.some(entry => entry.name === name)) {
            name = `${base} ${++index}`;
        }
        return name;
    };

    const addPalette = async () => {
        const name = newName(customPalettes);
        // Starts from the palette in use, so a custom one is a tweak of what
        // the picture already looks like rather than a blank slate.
        const colors = resolvePalette(palette, customPalettes).map(formatColor);
        await update(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_PALETTES, [
            ...customPalettes,
            { name, colors },
        ]);
        select(getCustomPaletteId(name));
    };

    const addAnaglyphPalette = async () => {
        const name = newName(customAnaglyphPalettes);
        await update(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_ANAGLYPH_PALETTES, [
            ...customAnaglyphPalettes,
            { name, left: '#ff0000', right: '#00ffff' },
        ]);
        selectAnaglyph(getCustomPaletteId(name));
    };

    /**
     * Typing and dragging a colour picker are shown right away but only written
     * to the preferences once the field is done with, so that a rename does not
     * cost a settings write per keystroke.
     */
    const editPalette = async (index: number, changes: Partial<CustomPalette>, persist = true) => {
        const updated = deepClone(customPalettes);
        const previousName = updated[index].name;
        updated[index] = { ...updated[index], ...changes };
        if (!persist) {
            setCustomPalettes(updated);
            return;
        }
        await update(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_PALETTES, updated);
        // A renamed palette is a new id, so a selection pointing at it follows.
        if (changes.name !== undefined && palette === getCustomPaletteId(previousName)) {
            select(getCustomPaletteId(changes.name));
        }
    };

    const editPaletteColor = (index: number, level: number, color: string, persist = true) => {
        const colors = [...customPalettes[index].colors];
        colors[level] = color;
        return editPalette(index, { colors }, persist);
    };

    const editAnaglyphPalette = async (index: number, changes: Partial<CustomAnaglyphPalette>, persist = true) => {
        const updated = deepClone(customAnaglyphPalettes);
        const previousName = updated[index].name;
        updated[index] = { ...updated[index], ...changes };
        if (!persist) {
            setCustomAnaglyphPalettes(updated);
            return;
        }
        await update(VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_ANAGLYPH_PALETTES, updated);
        if (changes.name !== undefined && anaglyphPalette === getCustomPaletteId(previousName)) {
            selectAnaglyph(getCustomPaletteId(changes.name));
        }
    };

    const confirmRemove = async (name: string): Promise<boolean> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/emulator/palettes/removePalette', 'Remove Palette'),
            msg: nls.localize(
                'vuengine/emulator/palettes/areYouSureYouWantToRemove',
                'Are you sure you want to remove the palette "{0}"?',
                name
            ),
        });
        return !!await dialog.open();
    };

    const removePalette = async (index: number) => {
        const removed = customPalettes[index];
        if (!await confirmRemove(removed.name)) {
            return;
        }
        await update(
            VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_PALETTES,
            customPalettes.filter((entry, i) => i !== index)
        );
        if (palette === getCustomPaletteId(removed.name)) {
            select(VB_DEFAULT_PALETTE_ID);
        }
    };

    const removeAnaglyphPalette = async (index: number) => {
        const removed = customAnaglyphPalettes[index];
        if (!await confirmRemove(removed.name)) {
            return;
        }
        await update(
            VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_ANAGLYPH_PALETTES,
            customAnaglyphPalettes.filter((entry, i) => i !== index)
        );
        if (anaglyphPalette === getCustomPaletteId(removed.name)) {
            selectAnaglyph(VB_DEFAULT_ANAGLYPH_PALETTE_ID);
        }
    };

    React.useEffect(() => {
        const listener = preferenceService.onPreferenceChanged(({ preferenceName }) => {
            switch (preferenceName) {
                case VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PALETTE:
                    return setPalette(preferenceService.get(
                        VesEmulatorPreferenceIds.EMULATOR_BUILTIN_PALETTE, VB_DEFAULT_PALETTE_ID
                    ));
                case VesEmulatorPreferenceIds.EMULATOR_BUILTIN_ANAGLYPH_PALETTE:
                    return setAnaglyphPalette(preferenceService.get(
                        VesEmulatorPreferenceIds.EMULATOR_BUILTIN_ANAGLYPH_PALETTE, VB_DEFAULT_ANAGLYPH_PALETTE_ID
                    ));
                case VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_PALETTES:
                    return setCustomPalettes(readCustomPalettes());
                case VesEmulatorPreferenceIds.EMULATOR_BUILTIN_CUSTOM_ANAGLYPH_PALETTES:
                    return setCustomAnaglyphPalettes(readCustomAnaglyphPalettes());
            }
        });
        return () => listener.dispose();
    }, [preferenceService]);

    return <VContainer gap={15}>
        <VContainer>
            <label>
                {nls.localize('vuengine/emulator/palettes/defaultPalettes', 'Default Palettes')}
            </label>
            <HContainer gap={10} wrap='wrap'>
                {Object.keys(VB_PALETTES).map(id =>
                    <StyledPalette
                        key={id}
                        selected={palette === id}
                        onClick={() => select(id)}
                        onKeyDown={() => select(id)}
                        // onFocus={disableCommands}
                        // onBlur={enableCommands}
                    >
                        <PaletteSwatch colors={VB_PALETTES[id].map(formatColor)} />
                        <PaletteName>{EMULATION_PALETTES[id] ?? id}</PaletteName>
                    </StyledPalette>
                )}
            </HContainer>
        </VContainer>
        <VContainer>
            <label>
                {nls.localize('vuengine/emulator/palettes/customPalettes', 'Custom Palettes')}
            </label>
            <HContainer gap={10} wrap='wrap'>
                {customPalettes.map((customPalette, index) => {
                    const id = getCustomPaletteId(customPalette.name);
                    return <StyledPalette
                        key={`custom-${index}`}
                        selected={palette === id}
                        onClick={() => select(id)}
                        onKeyDown={() => select(id)}
                        // onFocus={disableCommands}
                        // onBlur={enableCommands}
                    >
                        <PaletteSwatch colors={customPalette.colors} />
                        <PaletteName>{customPalette.name}</PaletteName>
                    </StyledPalette>;
                })}
                <StyledNewPalette onClick={addPalette}>
                    <VContainer justifyContent='center' grow={1}>
                        <i className='codicon codicon-plus' />
                    </VContainer>
                    <div>
                        {nls.localize('vuengine/emulator/palettes/newPalette', 'New Palette')}
                    </div>
                </StyledNewPalette>
            </HContainer>
        </VContainer>
        <VContainer>
            {customPalettes.map((customPalette, index) => {
                const id = getCustomPaletteId(customPalette.name);
                return <PaletteEntry
                    key={`custom-${index}`}
                    selected={palette === id}
                    onClick={() => select(id)}
                >
                    <PaletteSwatch colors={customPalette.colors} />
                    <input
                        type="text"
                        className="theia-input"
                        style={{ flexGrow: 1, width: 0 }}
                        spellCheck={false}
                        value={customPalette.name}
                        onClick={e => e.stopPropagation()}
                        onBlur={e => editPalette(index, { name: e.target.value })}
                        onChange={e => editPalette(index, { name: e.target.value }, false)}
                    />
                    {customPalette.colors.map((color, level) =>
                        <input
                            key={level}
                            type="color"
                            title={LEVEL_TITLES[level]}
                            value={color}
                            onClick={e => e.stopPropagation()}
                            onBlur={e => editPaletteColor(index, level, e.target.value)}
                            onChange={e => editPaletteColor(index, level, e.target.value, false)}
                        />
                    )}
                    <button
                        className="theia-button secondary"
                        title={nls.localizeByDefault('Remove')}
                        onClick={e => {
                            e.stopPropagation();
                            removePalette(index);
                        }}
                    >
                        <i className="codicon codicon-trash" />
                    </button>
                </PaletteEntry>;
            })}
        </VContainer>
        {anaglyph &&
            <VContainer>
                <label>
                    {nls.localize('vuengine/emulator/palettes/anaglyphColors', 'Anaglyph Colors')}
                </label>
                {Object.keys(VB_ANAGLYPH_PALETTES).map(id => {
                    const colors = VB_ANAGLYPH_PALETTES[id];
                    return <PaletteEntry
                        key={id}
                        selected={anaglyphPalette === id}
                        onClick={() => selectAnaglyph(id)}
                    >
                        <AnaglyphSwatch left={formatColor(colors.left)} right={formatColor(colors.right)} />
                        <PaletteName>{EMULATION_ANAGLYPH_PALETTES[id] ?? id}</PaletteName>
                    </PaletteEntry>;
                })}
                {customAnaglyphPalettes.map((customPalette, index) => {
                    const id = getCustomPaletteId(customPalette.name);
                    return <PaletteEntry
                        key={`custom-${index}`}
                        selected={anaglyphPalette === id}
                        onClick={() => selectAnaglyph(id)}
                    >
                        <AnaglyphSwatch left={customPalette.left} right={customPalette.right} />
                        <input
                            type="text"
                            className="theia-input"
                            style={{ flexGrow: 1, width: 0 }}
                            spellCheck={false}
                            value={customPalette.name}
                            onClick={e => e.stopPropagation()}
                            onBlur={e => editAnaglyphPalette(index, { name: e.target.value })}
                            onChange={e => editAnaglyphPalette(index, { name: e.target.value }, false)}
                        />
                        <input
                            type="color"
                            title={nls.localize('vuengine/emulator/palettes/leftEyeTint', 'Tint of the left eye')}
                            value={customPalette.left}
                            onClick={e => e.stopPropagation()}
                            onBlur={e => editAnaglyphPalette(index, { left: e.target.value })}
                            onChange={e => editAnaglyphPalette(index, { left: e.target.value }, false)}
                        />
                        <input
                            type="color"
                            title={nls.localize('vuengine/emulator/palettes/rightEyeTint', 'Tint of the right eye')}
                            value={customPalette.right}
                            onClick={e => e.stopPropagation()}
                            onBlur={e => editAnaglyphPalette(index, { right: e.target.value })}
                            onChange={e => editAnaglyphPalette(index, { right: e.target.value }, false)}
                        />
                        <button
                            className="theia-button secondary"
                            title={nls.localizeByDefault('Remove')}
                            onClick={e => {
                                e.stopPropagation();
                                removeAnaglyphPalette(index);
                            }}
                        >
                            <i className="codicon codicon-trash" />
                        </button>
                    </PaletteEntry>;
                })}
                <div>
                    <button className="theia-button secondary" onClick={addAnaglyphPalette}>
                        {nls.localize('vuengine/emulator/palettes/addCustomAnaglyphColors', 'Add Custom Anaglyph Colors')}
                    </button>
                </div>
            </VContainer>
        }
    </VContainer>;
}
