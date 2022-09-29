import React from 'react';

interface ActionsProps {
    clipboard: number[][] | undefined,
    setClipboard: (data: number[][]) => void,
    charHeight: number,
    charWidth: number,
    currentCharData: number[][]
    setCurrentCharData: (data: number[][]) => void
}

export default function Actions(props: ActionsProps): JSX.Element {
    const {
        clipboard, setClipboard,
        charHeight, charWidth,
        currentCharData, setCurrentCharData
    } = props;

    const getBlankCharacterLine = (): number[] => {
        const charLineData: number[] = [];
        [...Array(charWidth)].map((k, x) => {
            charLineData.push(0);
        });
        return charLineData;
    };

    const getBlankCharacter = (): number[][] => {
        const charData: number[][] = [];
        [...Array(charHeight)].map((j, y) => {
            charData.push(getBlankCharacterLine());
        });
        return charData;
    };

    const clear = (): void => {
        setCurrentCharData(getBlankCharacter());
    };

    const rotate = (): void => {
        const char = currentCharData;

        const n = char.length;
        const x = Math.floor(n / 2);
        const y = n - 1;
        let k;
        for (let i = 0; i < x; i++) {
            for (let j = i; j < y - i; j++) {
                k = char[i][j];
                char[i][j] = char[y - j][i];
                char[y - j][i] = char[y - i][y - j];
                char[y - i][y - j] = char[j][y - i];
                char[j][y - i] = k;
            }
        }

        setCurrentCharData(char);
    };

    const mirrorHorizontally = (): void => {
        setCurrentCharData(currentCharData.map(line => line.reverse()));
    };

    const mirrorVertically = (): void => {
        setCurrentCharData(currentCharData.reverse());
    };

    const moveUp = (): void => {
        setCurrentCharData([
            ...currentCharData.slice(1),
            getBlankCharacterLine()
        ]);
    };

    const moveDown = (): void => {
        setCurrentCharData([
            getBlankCharacterLine(),
            ...currentCharData.slice(0, -1)
        ]);
    };

    const moveLeft = (): void => {
        setCurrentCharData(currentCharData.map(line => [...line.slice(1), 0]));
    };

    const moveRight = (): void => {
        setCurrentCharData(currentCharData.map(line => [0, ...line.slice(0, -1)]));
    };

    const copy = (): void => {
        setClipboard([...currentCharData]);
    };

    const paste = (): void => {
        if (clipboard) {
            setCurrentCharData(clipboard);
        }
    };

    return <div className="tools">
        <button
            className="theia-button secondary"
            title="Clear"
            onClick={clear}
        >
            <i className="fa fa-trash"></i>
        </button>
        <button
            className="theia-button secondary"
            title="Rotate"
            onClick={rotate}
        >
            <i className="fa fa-rotate-right"></i>
        </button>
        <button
            className="theia-button secondary"
            title="Mirror Horizontally"
            onClick={mirrorHorizontally}
        >
            <i className="fa fa-arrows-h"></i>
        </button>
        <button
            className="theia-button secondary"
            title="Mirror Vertically"
            onClick={mirrorVertically}
        >
            <i className="fa fa-arrows-v"></i>
        </button>
        <button
            className="theia-button secondary"
            title="Move Up"
            onClick={moveUp}
        >
            <i className="fa fa-arrow-up"></i>
        </button>
        <button
            className="theia-button secondary"
            title="Move Down"
            onClick={moveDown}
        >
            <i className="fa fa-arrow-down"></i>
        </button>
        <button
            className="theia-button secondary"
            title="Move Left"
            onClick={moveLeft}
        >
            <i className="fa fa-arrow-left"></i>
        </button>
        <button
            className="theia-button secondary"
            title="Move Right"
            onClick={moveRight}
        >
            <i className="fa fa-arrow-right"></i>
        </button>
        <button
            className="theia-button secondary"
            title="Copy"
            onClick={copy}
        >
            <i className="fa fa-clone"></i>
        </button>
        <button
            className="theia-button secondary"
            title="Paste"
            onClick={paste}
        >
            <i className="fa fa-paste"></i>
        </button>
    </div>;
}
