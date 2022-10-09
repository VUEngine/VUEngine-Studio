import { nls } from '@theia/core';
import React from 'react';
import { FontEditorState } from '../FontEditorTypes';

interface ActionsProps {
    clipboard: number[][] | undefined,
    charHeight: number,
    charWidth: number,
    currentCharData: number[][]
    setCurrentCharData: (data: number[][]) => void
    setState: (state: Partial<FontEditorState>) => void
}

export default function Actions(props: ActionsProps): JSX.Element {
    const {
        clipboard,
        charHeight, charWidth,
        currentCharData, setCurrentCharData,
        setState
    } = props;

    const clear = (): void => {
        setCurrentCharData([]);
    };

    const rotate = (): void => {
        const updatedCharacter = currentCharData ?? [];

        const n = charHeight;
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

        [...Array(charHeight)].map((j, y) => {
            if (!updatedCharacter[y]) { updatedCharacter[y] = []; }
            [...Array(charWidth)].map((k, x) => {
                if (!updatedCharacter[y][x]) { updatedCharacter[y][x] = 0; }
            });
            updatedCharacter[y] = updatedCharacter[y].reverse();
        });

        setCurrentCharData(updatedCharacter);
    };

    const mirrorVertically = (): void => {
        const updatedCharacter = currentCharData ?? [];

        [...Array(charHeight)].map((j, y) => {
            if (!updatedCharacter[y]) { updatedCharacter[y] = []; }
        });

        setCurrentCharData(updatedCharacter.reverse());
    };

    const moveUp = (): void => {
        if (!currentCharData || currentCharData.length < 1) { return; }

        setCurrentCharData([
            ...currentCharData.slice(1),
            []
        ]);
    };

    const moveDown = (): void => {
        if (!currentCharData || currentCharData.length < 1) { return; }

        [...Array(charHeight)].map((j, y) => {
            if (!currentCharData[y]) { currentCharData[y] = []; }
        });

        setCurrentCharData([
            [],
            ...currentCharData.slice(0, -1)
        ]);
    };

    const moveLeft = (): void => {
        if (!currentCharData || currentCharData.length < 1) { return; }

        setCurrentCharData(currentCharData.map(line => [...line.slice(1), 0]));
    };

    const moveRight = (): void => {
        if (!currentCharData || currentCharData.length < 1) { return; }

        currentCharData.map((j, y) => {
            const line = currentCharData[y];
            [...Array(charWidth)].map((k, x) => {
                if (!line[x]) { line[x] = 0; }
            });
        });

        setCurrentCharData(currentCharData.map(line => [0, ...line.slice(0, -1)]));
    };

    const toneUp = (): void => {
        const updatedCharacter = currentCharData ?? [];

        [...Array(charHeight)].map((j, y) => {
            if (!updatedCharacter[y]) { updatedCharacter[y] = []; }
            [...Array(charWidth)].map((k, x) => {
                if (!updatedCharacter[y][x]) { updatedCharacter[y][x] = 0; }
                if (updatedCharacter[y][x] < 3) { updatedCharacter[y][x]++; }
            });
        });

        setCurrentCharData(updatedCharacter);
    };

    const toneDown = (): void => {
        const updatedCharacter = currentCharData ?? [];

        [...Array(charHeight)].map((j, y) => {
            if (!updatedCharacter[y]) { updatedCharacter[y] = []; }
            [...Array(charWidth)].map((k, x) => {
                if (!updatedCharacter[y][x]) { updatedCharacter[y][x] = 0; }
                if (updatedCharacter[y][x] > 0) { updatedCharacter[y][x]--; }
            });
        });

        setCurrentCharData(updatedCharacter);
    };

    const copy = (): void => {
        if (!currentCharData || currentCharData.length < 1) { return; }

        setState({ clipboard: [...currentCharData] });
    };

    const paste = (): void => {
        if (!currentCharData || currentCharData.length < 1) { return; }

        if (clipboard) {
            setCurrentCharData(clipboard);
        }
    };

    return <div className="tools">
        <button
            className="theia-button secondary"
            title={nls.localize('vuengine/fontEditor/actions/clear', 'Clear')}
            onClick={clear}
        >
            <i className="fa fa-trash"></i>
        </button>
        <button
            className="theia-button secondary"
            title={nls.localize('vuengine/fontEditor/actions/rotate', 'Rotate')}
            onClick={rotate}
        >
            <i className="fa fa-rotate-right"></i>
        </button>
        <button
            className="theia-button secondary"
            title={nls.localize('vuengine/fontEditor/actions/mirrorHorizontally', 'Mirror Horizontally')}
            onClick={mirrorHorizontally}
        >
            <i className="fa fa-arrows-h"></i>
        </button>
        <button
            className="theia-button secondary"
            title={nls.localize('vuengine/fontEditor/actions/mirrorVertically', 'Mirror Vertically')}
            onClick={mirrorVertically}
        >
            <i className="fa fa-arrows-v"></i>
        </button>
        <button
            className="theia-button secondary"
            title={nls.localize('vuengine/fontEditor/actions/moveUp', 'Move Up')}
            onClick={moveUp}
        >
            <i className="fa fa-arrow-up"></i>
        </button>
        <button
            className="theia-button secondary"
            title={nls.localize('vuengine/fontEditor/actions/moveDown', 'Move Down')}
            onClick={moveDown}
        >
            <i className="fa fa-arrow-down"></i>
        </button>
        <button
            className="theia-button secondary"
            title={nls.localize('vuengine/fontEditor/actions/moveLeft', 'Move Left')}
            onClick={moveLeft}
        >
            <i className="fa fa-arrow-left"></i>
        </button>
        <button
            className="theia-button secondary"
            title={nls.localize('vuengine/fontEditor/actions/moveRight', 'Move Right')}
            onClick={moveRight}
        >
            <i className="fa fa-arrow-right"></i>
        </button>
        <button
            className="theia-button secondary"
            title={nls.localize('vuengine/fontEditor/actions/toneDown', 'Tone Down')}
            onClick={toneDown}
        >
            <i className="fa fa-sun-o"></i>
            <i className="fa fa-long-arrow-down"></i>
        </button>
        <button
            className="theia-button secondary"
            title={nls.localize('vuengine/fontEditor/actions/toneUp', 'Tone Up')}
            onClick={toneUp}
        >
            <i className="fa fa-sun-o"></i>
            <i className="fa fa-long-arrow-up"></i>
        </button>
        <button
            className="theia-button secondary"
            title={nls.localize('vuengine/fontEditor/actions/copy', 'Copy')}
            onClick={copy}
        >
            <i className="fa fa-clone"></i>
        </button>
        <button
            className="theia-button secondary"
            title={nls.localize('vuengine/fontEditor/actions/paste', 'Paste')}
            onClick={paste}
        >
            <i className="fa fa-paste"></i>
        </button>
    </div>;
}
