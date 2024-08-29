import { Clipboard, CopySimple, Trash } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { CommonCommands, ConfirmDialog } from '@theia/core/lib/browser';
import { DottingRef, PixelModifyItem, useData, useDotting } from 'dotting';
import React, { useEffect, useState } from 'react';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME } from '../../../ves-editors-types';
import HContainer from '../../Common/HContainer';
import { SpriteEditorTool } from '../../SpriteEditor/SpriteEditorTool';
import ImportExport from './ImportExport';

interface ActionsProps {
    offset: number
    characterCount: number
    charPixelHeight: number,
    charPixelWidth: number,
    currentCharData: number[][]
    setCurrentCharData: (data: number[][]) => void
    dottingRef: React.RefObject<DottingRef>
    applyPixelChanges: (modifiedPixels: PixelModifyItem[]) => void
    setCharacters: (updatedCharacters: number[][][]) => void
}

export default function Actions(props: ActionsProps): React.JSX.Element {
    const {
        charPixelHeight, charPixelWidth,
        /* currentCharData, setCurrentCharData, */
        characterCount,
        offset,
        dottingRef,
        applyPixelChanges,
        setCharacters,
    } = props;
    const [clipboard, setClipboard] = useState<PixelModifyItem[][]>();
    const { clear, setData } = useDotting(dottingRef);
    const { dataArray } = useData(dottingRef);

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case CommonCommands.COPY.id:
                copy();
                break;
            case CommonCommands.PASTE.id:
                paste();
                break;
        }
    };

    const confirmClear = async (): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/spriteEditor/clear', 'Clear'),
            msg: nls.localize('vuengine/spriteEditor/areYouSureYouWantToClear', 'Are you sure you want to clear the entire canvas?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            clear();
        }
    };

    /*
    const rotate = (): void => {
        const updatedCharacter = currentCharData ?? [];

        const n = charPixelHeight;
        const x = Math.floor(n / 2);
        const y = n - 1;
        let k;
        for (let i = 0; i < x; i++) {
            if (!updatedCharacter[i]) { updatedCharacter[i] = []; }
            if (!updatedCharacter[y - i]) { updatedCharacter[y - i] = []; }
            for (let j = i; j < y - i; j++) {
                if (!updatedCharacter[j]) { updatedCharacter[j] = []; }
                if (!updatedCharacter[y - j]) { updatedCharacter[y - j] = []; }
                k = updatedCharacter[i][j] ?? 0;
                updatedCharacter[i][j] = updatedCharacter[y - j][i] ?? 0;
                updatedCharacter[y - j][i] = updatedCharacter[y - i][y - j] ?? 0;
                updatedCharacter[y - i][y - j] = updatedCharacter[j][y - i] ?? 0;
                updatedCharacter[j][y - i] = k;
            }
        }

        setCurrentCharData(updatedCharacter);
    };

    const mirrorHorizontally = (): void => {
        const updatedCharacter = currentCharData ?? [];

        [...Array(charPixelHeight)].map((j, y) => {
            if (!updatedCharacter[y]) {
                updatedCharacter[y] = [];
            }
            [...Array(charPixelWidth)].map((k, x) => {
                if (!updatedCharacter[y][x]) { updatedCharacter[y][x] = 0; }
            });
            updatedCharacter[y] = updatedCharacter[y].reverse();
        });

        setCurrentCharData(updatedCharacter);
    };

    const mirrorVertically = (): void => {
        const updatedCharacter = currentCharData ?? [];

        [...Array(charPixelHeight)].map((j, y) => {
            if (!updatedCharacter[y]) {
                updatedCharacter[y] = [];
            }
        });

        setCurrentCharData(updatedCharacter.reverse());
    };
    */

    const copy = (): void => {
        setClipboard(dataArray);
    };

    const paste = (): void => {
        if (clipboard) {
            // write to dotting
            setData(clipboard);

            // write to character data, since no change event is triggered on the above
            const modifiedPixels: PixelModifyItem[] = [];
            clipboard.forEach(c => modifiedPixels.push(...c));
            applyPixelChanges(modifiedPixels);
        }
    };

    useEffect(() => {
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, [
        clipboard,
        applyPixelChanges,
    ]);

    return <HContainer gap={2} wrap='wrap'>
        {/* }
        <SpriteEditorTool
            title={nls.localize('vuengine/fontEditor/actions/rotate', 'Rotate')}
            onClick={rotate}
        >
            <ArrowClockwise size={20} />
        </SpriteEditorTool>
        <SpriteEditorTool
            title={nls.localize('vuengine/fontEditor/actions/mirrorHorizontally', 'Mirror Horizontally')}
            onClick={mirrorHorizontally}
        >
            <FlipHorizontal size={20} />
        </SpriteEditorTool>
        <SpriteEditorTool
            title={nls.localize('vuengine/fontEditor/actions/mirrorVertically', 'Mirror Vertically')}
            onClick={mirrorVertically}
        >
            <FlipVertical size={20} />
        </SpriteEditorTool>
        {*/}
        <SpriteEditorTool
            title={nls.localize('vuengine/fontEditor/actions/copy', 'Copy')}
            onClick={copy}
        >
            <CopySimple size={20} />
        </SpriteEditorTool>
        <SpriteEditorTool
            title={nls.localize('vuengine/fontEditor/actions/paste', 'Paste')}
            onClick={paste}
        >
            <Clipboard size={20} />
        </SpriteEditorTool>
        <SpriteEditorTool
            title={nls.localize('vuengine/fontEditor/actions/clear', 'Clear')}
            onClick={confirmClear}
        >
            <Trash size={20} />
        </SpriteEditorTool>
        <ImportExport
            setCharacters={setCharacters}
            charPixelHeight={charPixelHeight}
            charPixelWidth={charPixelWidth}
            offset={offset}
            characterCount={characterCount}
        />
    </HContainer>;
}
