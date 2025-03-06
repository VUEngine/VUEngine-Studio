import { Clipboard, CopySimple, Trash } from '@phosphor-icons/react';
import { nls } from '@theia/core';
import { CommonCommands, ConfirmDialog } from '@theia/core/lib/browser';
import { DottingRef, PixelModifyItem, useData, useDotting } from 'dotting';
import React, { useContext, useEffect, useState } from 'react';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../../ves-editors-types';
import HContainer from '../../Common/Base/HContainer';
import VContainer from '../../Common/Base/VContainer';
import { PixelEditorTool } from '../../PixelEditor/Sidebar/PixelEditorTool';
import { FontEditorCommands } from '../FontEditorCommands';

interface ActionsProps {
    currentCharData: number[][]
    dottingRef: React.RefObject<DottingRef>
    applyPixelChanges: (modifiedPixels: PixelModifyItem[]) => void
    setCharacters: (updatedCharacters: number[][][]) => void
}

export default function Actions(props: ActionsProps): React.JSX.Element {
    const { services } = useContext(EditorsContext) as EditorsContextType;
    const {
        /* currentCharData, setCurrentCharData, */
        dottingRef,
        applyPixelChanges,
    } = props;
    const [clipboard, setClipboard] = useState<PixelModifyItem[][]>();
    const { clear, setData } = useDotting(dottingRef);
    const { dataArray } = useData(dottingRef);

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case FontEditorCommands.COPY_CHARACTER.id:
                copy();
                break;
            case FontEditorCommands.PASTE_CHARACTER.id:
                paste();
                break;
        }
    };

    const confirmClear = async (): Promise<void> => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/pixel/clear', 'Clear'),
            msg: nls.localize('vuengine/editors/pixel/areYouSureYouWantToClear', 'Are you sure you want to clear the entire canvas?'),
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

    return (
        <VContainer>
            <label>
                {nls.localizeByDefault('Actions')}
            </label>
            <HContainer gap={2} wrap='wrap'>
                {/* }
                <PixelEditorTool
                    title={
                        nls.localize('vuengine/editors/font/actions/rotate', 'Rotate') +
                        services.vesCommonService.getKeybindingLabel(FontEditorCommands.ROTATE.id, true)
                    }
                    onClick={rotate}
                >
                    <ArrowClockwise size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    title={
                        nls.localize('vuengine/editors/font/actions/mirrorHorizontally', 'Mirror Horizontally') +
                        services.vesCommonService.getKeybindingLabel(FontEditorCommands.MIRROR_HORIZONTALLY.id, true)
                    }
                    onClick={mirrorHorizontally}
                >
                    <FlipHorizontal size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    title={
                        nls.localize('vuengine/editors/font/actions/mirrorVertically', 'Mirror Vertically') +
                        services.vesCommonService.getKeybindingLabel(FontEditorCommands.MIRROR_VERTICALLY.id, true)
                    }
                    onClick={mirrorVertically}
                >
                    <FlipVertical size={20} />
                </PixelEditorTool>
                {*/}
                <PixelEditorTool
                    title={
                        nls.localize('vuengine/editors/font/actions/copy', 'Copy Current Character') +
                        services.vesCommonService.getKeybindingLabel(CommonCommands.COPY.id, true)
                    }
                    onClick={copy}
                >
                    <CopySimple size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    title={
                        nls.localize('vuengine/editors/font/actions/paste', 'Paste To Current Character') +
                        services.vesCommonService.getKeybindingLabel(CommonCommands.PASTE.id, true)
                    }
                    onClick={paste}
                >
                    <Clipboard size={20} />
                </PixelEditorTool>
                <PixelEditorTool
                    title={nls.localize('vuengine/editors/font/actions/clear', 'Clear Current Character')}
                    onClick={confirmClear}
                >
                    <Trash size={20} />
                </PixelEditorTool>
            </HContainer>
        </VContainer>
    );
}
