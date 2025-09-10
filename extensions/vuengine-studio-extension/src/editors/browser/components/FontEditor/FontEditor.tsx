/* eslint-disable no-null/no-null */
import { nls } from '@theia/core';
import { CommonCommands } from '@theia/core/lib/browser';
import { CanvasDataChangeHandler, Dotting, DottingRef, PixelModifyItem, useDotting, useHandlers } from 'dotting';
import React, { useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { ColorMode, PALETTE_COLORS, PALETTE_INDICES } from '../../../../core/browser/ves-common-types';
import { ImageCompressionType } from '../../../../images/browser/ves-images-types';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME, EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import RadioSelect from '../Common/Base/RadioSelect';
import VContainer from '../Common/Base/VContainer';
import { DataSection } from '../Common/CommonTypes';
import InfoLabel from '../Common/InfoLabel';
import SectionSelect from '../Common/SectionSelect';
import { PixelEditorCommands } from '../PixelEditor/PixelEditorCommands';
import PixelEditorStatus from '../PixelEditor/PixelEditorStatus';
import PaletteSelect from '../PixelEditor/Sidebar/PaletteSelect';
import PixelEditorCurrentToolSettings from '../PixelEditor/Sidebar/PixelEditorCurrentToolSettings';
import PixelEditorTools from '../PixelEditor/Sidebar/PixelEditorTools';
import Alphabet from './Alphabet/Alphabet';
import AlphabetSettings from './Alphabet/AlphabetSettings';
import CharSettings from './Alphabet/CharSettings';
import { FontEditorCommands } from './FontEditorCommands';
import {
    CHAR_PIXEL_SIZE,
    FontData,
    Size,
    VariableSize
} from './FontEditorTypes';
import Actions from './Tools/Actions';
import CurrentCharInfo from './Tools/CurrentCharInfo';
import ImportExportTools from './Tools/ImportExport/ImportExportTools';

interface FontEditorProps {
    data: FontData
    updateData: (data: FontData) => void
}

const EditorSidebar = styled.div`
  background-color: rgba(17, 17, 17, .9);
  border-radius: 2px;
  border: 1px solid var(--theia-activityBar-background);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  padding: var(--padding);
  transition: all .1s;
  z-index: 101;

  body.light-vuengine & {
    background-color: rgba(236, 236, 236, .9);
  }
`;

export default function FontEditor(props: FontEditorProps): React.JSX.Element {
    const { data, updateData } = props;
    const { enableCommands } = useContext(EditorsContext) as EditorsContextType;
    const [primaryColorIndex, setPrimaryColorIndex] = useState<number>(3);
    const [secondaryColorIndex, setSecondaryColorIndex] = useState<number>(0);
    const [currentCharacterIndex, setCurrentCharacterIndex] = useState<number>(data.offset);
    const [currentCharacterHoverIndex, setCurrentCharacterHoverIndex] = useState<number>(data.offset);
    const [canvasHeight, setCanvasHeight] = useState<number | string>('100%');
    const [canvasWidth, setCanvasWidth] = useState<number | string>('100%');
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const dottingRef = useRef<DottingRef>(null);
    const { setData, undo, redo } = useDotting(dottingRef);
    const { addDataChangeListener, removeDataChangeListener } = useHandlers(dottingRef);

    const charPixelWidth = data.size.x * CHAR_PIXEL_SIZE;
    const charPixelHeight = data.size.y * CHAR_PIXEL_SIZE;

    const characters = data.characters || [];

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case CommonCommands.UNDO.id:
                undo();
                break;
            case CommonCommands.REDO.id:
                redo();
                break;
        }
    };

    const removeTrailingNullsAndZeroesFromArray = (arr: any[]): any[] | null => {
        if (arr === null) {
            return arr;
        }

        let toDelete = 0;
        for (let c = (arr?.length || 0) - 1; c >= 0; c--) {
            if (arr[c] === null || arr[c] === 0) {
                toDelete++;
            } else {
                break;
            }
        }
        arr?.splice(arr.length - toDelete, toDelete);

        return arr?.length ? arr : null;
    };

    const optimizeFontData = (fontData: FontData): FontData => {
        // @ts-ignore
        fontData.characters = fontData.characters === null ? null :
            removeTrailingNullsAndZeroesFromArray(fontData.characters.map(character =>
                character === null ? null :
                    removeTrailingNullsAndZeroesFromArray(character.map(line =>
                        removeTrailingNullsAndZeroesFromArray(line)
                    ))));

        return fontData;
    };

    const updateFontData = (partialFontData: Partial<FontData>): void => {
        updateData(
            optimizeFontData({
                ...data,
                ...partialFontData,
            })
        );
    };

    const setCurrentCharacterData = (character: number[][]): void => {
        const updatedCharacters = [...(data.characters || [])];
        updatedCharacters[currentCharacterIndex] = character;
        updateFontData({ characters: updatedCharacters });
    };

    const setSection = (section: DataSection): void => {
        updateFontData({ section });
    };

    const setCompression = (compression: ImageCompressionType): void => {
        updateFontData({ compression });
    };

    const setCharSize = (size?: Size, variableSize?: VariableSize): void => {
        updateFontData({
            size: size ?? data.size,
            variableSize: variableSize ?? data.variableSize,
        });
    };

    const setCharacterCount = (characterCount: number): void => {
        const partialFontPage: Partial<FontData> = { characterCount };
        const maxPageSize = characterCount;
        if (data.pageSize > maxPageSize) {
            partialFontPage.pageSize = maxPageSize;
        }

        updateFontData(partialFontPage);
    };

    const setOffset = (offset: number): void => {
        updateFontData({ offset });
    };

    const setPageSize = (pageSize: number): void => {
        updateFontData({ pageSize });
    };

    const setCharacters = (updatedCharacters: number[][][]): void => {
        updateFontData({ characters: updatedCharacters });
    };

    const fill = (char: number[][], x: number, y: number, oldColor: number, newColor: number): number[][] => {
        const charColor = char && char[y] ? char[y][x] ?? 0 : 0;
        if (x >= 0 && y >= 0
            && x < charPixelWidth
            && y < charPixelHeight
            && charColor === oldColor) {
            if (!char[y]) {
                char[y] = [];
            }
            char[y][x] = newColor;
            char = fill(char, x, y + 1, oldColor, newColor);
            char = fill(char, x, y - 1, oldColor, newColor);
            char = fill(char, x + 1, y, oldColor, newColor);
            char = fill(char, x - 1, y, oldColor, newColor);
        }

        return char;
    };

    const getCurrentCharacterDottingData = (): PixelModifyItem[][] => {
        const currentCharacterData = characters[currentCharacterIndex] ?? [];
        const dottingData: PixelModifyItem[][] = [];
        const effectiveHeight = data.variableSize.enabled ? data.variableSize.y : charPixelHeight;
        [...Array(charPixelHeight)].forEach((j, y) => {
            const newRow: PixelModifyItem[] = [];
            const effectiveWidth = data.variableSize.enabled ? data.variableSize.x[currentCharacterIndex] ?? charPixelWidth : charPixelWidth;
            [...Array(charPixelWidth)].forEach((i, x) => {
                const paletteColor = PALETTE_COLORS[ColorMode.Default][currentCharacterData[y] !== undefined &&
                    currentCharacterData[y] !== null &&
                    currentCharacterData[y][x] !== undefined &&
                    currentCharacterData[y][x] !== null
                    ? currentCharacterData[y][x] : 0];
                const color = x > (effectiveWidth - 1) || y > (effectiveHeight - 1)
                    ? '#333'
                    : paletteColor;
                newRow.push({
                    rowIndex: y,
                    columnIndex: x,
                    color,
                });
            });
            dottingData.push(newRow);
        });
        return dottingData;
    };

    const applyPixelChanges = (modifiedPixels: PixelModifyItem[]): void => {
        const updatedCharacter = [...(characters[currentCharacterIndex] ?? [])];
        modifiedPixels.forEach(mp => {
            if (updatedCharacter[mp.rowIndex] === null || updatedCharacter[mp.rowIndex] === undefined) {
                updatedCharacter[mp.rowIndex] = [];
            }
            updatedCharacter[mp.rowIndex][mp.columnIndex] = PALETTE_INDICES[0][mp.color];
        });
        setCurrentCharacterData(updatedCharacter);
    };

    const dataChangeHandler: CanvasDataChangeHandler = ({ delta }) => {
        if (delta?.modifiedPixels?.length) {
            applyPixelChanges(delta.modifiedPixels);
        }
    };

    useEffect(() => {
        setData(getCurrentCharacterDottingData());
    }, [
        currentCharacterIndex,
        data.size,
        data.variableSize,
    ]);

    useEffect(() => {
        addDataChangeListener(dataChangeHandler);
        return () => {
            removeDataChangeListener(dataChangeHandler);
        };
    }, [
        currentCharacterIndex,
        data,
        addDataChangeListener,
        removeDataChangeListener,
    ]);

    useEffect(() => {
        enableCommands([
            ...Object.values(FontEditorCommands).map(c => c.id),
            ...Object.values(PixelEditorCommands).map(c => c.id),
        ]);
    }, []);

    useEffect(() => {
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, []);

    useEffect(() => {
        if (!canvasContainerRef.current) {
            return;
        }
        const resizeObserver = new ResizeObserver(() => {
            setCanvasWidth(canvasContainerRef.current?.clientWidth ?? canvasHeight);
            setCanvasHeight(canvasContainerRef.current?.clientHeight ?? canvasWidth);
        });
        resizeObserver.observe(canvasContainerRef.current);
        return () => resizeObserver.disconnect();
    }, [
        canvasContainerRef
    ]);

    return <div
        tabIndex={0}
        className={`font-editor width-${charPixelWidth} height-${charPixelHeight}`}
    >
        <div
            ref={canvasContainerRef}
            style={{
                display: 'flex',
                alignItems: 'center',
                inset: 0,
                justifyContent: 'center',
                overflow: 'hidden',
                padding: 0,
                position: 'absolute',
            }}
        >
            <Dotting
                backgroundColor='transparent'
                brushColor={PALETTE_COLORS[ColorMode.Default][primaryColorIndex]}
                defaultPixelColor={PALETTE_COLORS[ColorMode.Default][0]}
                gridStrokeColor="#222"
                height={canvasHeight}
                initLayers={[{
                    id: 'layer1',
                    data: getCurrentCharacterDottingData(),
                }]}
                initAutoScale={true}
                isGridFixed={true}
                isGridVisible={true}
                isPanZoomable={true}
                maxScale={10}
                minScale={0.05}
                ref={dottingRef}
                width={canvasWidth}
            />
        </div>
        <HContainer
            alignItems='start'
            grow={1}
            justifyContent='space-between'
            overflow='hidden'
        >
            <VContainer
                gap={10}
                overflow='hidden'
                style={{
                    maxHeight: 'calc(100% - 32px)',
                    width: 82,
                    zIndex: 102,
                }}
            >
                <PaletteSelect
                    primaryColorIndex={primaryColorIndex}
                    setPrimaryColorIndex={setPrimaryColorIndex}
                    secondaryColorIndex={secondaryColorIndex}
                    setSecondaryColorIndex={setSecondaryColorIndex}
                    includeTransparent={false}
                    dottingRef={dottingRef}
                />
                <VContainer gap={10} overflow='auto'>
                    <PixelEditorTools
                        dottingRef={dottingRef}
                    />
                    <PixelEditorCurrentToolSettings
                        dottingRef={dottingRef}
                    />
                    <Actions
                        currentCharData={characters[currentCharacterIndex]}
                        dottingRef={dottingRef}
                        applyPixelChanges={applyPixelChanges}
                        setCharacters={setCharacters}
                    />
                    <ImportExportTools
                        characters={data.characters}
                        charPixelHeight={charPixelHeight}
                        charPixelWidth={charPixelWidth}
                        offset={data.offset}
                        characterCount={data.characterCount}
                        updateFontData={updateFontData}
                    />
                </VContainer>
            </VContainer>
            <EditorSidebar>
                <VContainer gap={15} overflow='hidden'>
                    <HContainer justifyContent='space-between'>
                        <CharSettings
                            currentCharacter={currentCharacterIndex}
                            charHeight={charPixelHeight}
                            charWidth={charPixelWidth}
                            variableSize={data.variableSize}
                            setCharSize={setCharSize}
                        />
                        <CurrentCharInfo
                            currentCharacterIndex={currentCharacterIndex}
                            currentCharacterHoverIndex={currentCharacterHoverIndex}
                        />
                    </HContainer>
                    <VContainer grow={1} overflow='hidden'>
                        <label>
                            {nls.localize('vuengine/editors/font/alphabet', 'Alphabet')}{' '}
                            <span className="secondaryText">
                                ({nls.localize('vuengine/editors/font/alphabetNavigationDescription', 'Arrow Keys To Navigate')})
                            </span>
                        </label>
                        <Alphabet
                            charsData={data.characters || []}
                            offset={data.offset}
                            charCount={data.characterCount}
                            charHeight={charPixelHeight}
                            charWidth={charPixelWidth}
                            variableSize={data.variableSize}
                            currentCharacterIndex={currentCharacterIndex}
                            setCurrentCharacterIndex={setCurrentCharacterIndex}
                            setCurrentCharacterHoverIndex={setCurrentCharacterHoverIndex}
                        />
                    </VContainer>
                    <AlphabetSettings
                        charCount={data.characterCount}
                        setCharCount={setCharacterCount}
                        offset={data.offset}
                        setOffset={setOffset}
                        pageSize={data.pageSize}
                        setPageSize={setPageSize}
                        sizeX={data.size.x}
                        sizeY={data.size.y}
                    />
                </VContainer>
                <HContainer gap={15} justifyContent="space-between">
                    <VContainer>
                        <InfoLabel
                            label={nls.localize('vuengine/editors/actor/compression', 'Compression')}
                            tooltip={nls.localize(
                                'vuengine/editors/actor/compressionDescription',
                                'Image data can be stored in a compressed format to save ROM space. \
Comes at the cost of a slightly higher CPU load when loading data into memory. \
Will be skipped if compressed data is not smaller than source data.'
                            )}
                            tooltipPosition='bottom'
                        />
                        <RadioSelect
                            options={[{
                                label: nls.localize('vuengine/editors/actor/compressionType/none', 'None'),
                                value: ImageCompressionType.NONE,
                            }, {
                                label: 'RLE',
                                value: ImageCompressionType.RLE,
                            }]}
                            defaultValue={data.compression}
                            onChange={options => setCompression(options[0].value as ImageCompressionType)}
                        />
                    </VContainer>
                    <SectionSelect
                        value={data.section}
                        setValue={setSection}
                    />
                </HContainer>
            </EditorSidebar>
        </HContainer>
        <PixelEditorStatus
            gridSize={1}
            setGridSize={() => { }}
            dottingRef={dottingRef}
        />
    </div>;
}
