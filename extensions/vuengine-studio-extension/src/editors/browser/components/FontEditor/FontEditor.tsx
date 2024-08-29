/* eslint-disable no-null/no-null */
import { nls } from '@theia/core';
import { CanvasDataChangeHandler, Dotting, DottingRef, PixelModifyItem, useDotting, useHandlers } from 'dotting';
import React, { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { ColorMode, PALETTE_COLORS, PALETTE_INDICES } from '../../../../core/browser/ves-common-types';
import { ImageCompressionType } from '../../../../images/browser/ves-images-types';
import { EDITORS_COMMANDS } from '../../ves-editors-commands';
import { EDITORS_COMMAND_EXECUTED_EVENT_NAME } from '../../ves-editors-types';
import { DataSection } from '../Common/CommonTypes';
import HContainer from '../Common/HContainer';
import InfoLabel from '../Common/InfoLabel';
import RadioSelect from '../Common/RadioSelect';
import SectionSelect from '../Common/SectionSelect';
import VContainer from '../Common/VContainer';
import PaletteSelect from '../SpriteEditor/PaletteSelect';
import SpriteEditorCurrentToolSettings from '../SpriteEditor/SpriteEditorCurrentToolSettings';
import SpriteEditorStatus from '../SpriteEditor/SpriteEditorStatus';
import SpriteEditorTools from '../SpriteEditor/SpriteEditorTools';
import SpriteEditorUndoRedo from '../SpriteEditor/SpriteEditorUndoRedo';
import Alphabet from './Alphabet/Alphabet';
import AlphabetSettings from './Alphabet/AlphabetSettings';
import CharSettings from './Alphabet/CharSettings';
import {
    CHAR_PIXEL_SIZE,
    FontData,
    Size,
    VariableSize
} from './FontEditorTypes';
import Actions from './Tools/Actions';
import CurrentCharInfo from './Tools/CurrentCharInfo';

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
  z-index: 100;

  body.light-vuengine & {
    background-color: rgba(236, 236, 236, .9);
  }
`;

export default function FontEditor(props: FontEditorProps): React.JSX.Element {
    const { data, updateData } = props;
    const [primaryColorIndex, setPrimaryColorIndex] = useState<number>(3);
    const [secondaryColorIndex, setSecondaryColorIndex] = useState<number>(0);
    const [currentCharacterIndex, setCurrentCharacterIndex] = useState<number>(data.offset);
    const [currentCharacterHoverIndex, setCurrentCharacterHoverIndex] = useState<number>(data.offset);
    const [canvasHeight, setCanvasHeight] = useState<number | string>('100%');
    const [canvasWidth, setCanvasWidth] = useState<number | string>('100%');
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const dottingRef = useRef<DottingRef>(null);
    const { setData } = useDotting(dottingRef);
    const { addDataChangeListener, removeDataChangeListener } = useHandlers(dottingRef);

    const charPixelWidth = data.size.x * CHAR_PIXEL_SIZE;
    const charPixelHeight = data.size.y * CHAR_PIXEL_SIZE;

    const characters = data.characters || [];

    const commandListener = (e: CustomEvent): void => {
        switch (e.detail) {
            case EDITORS_COMMANDS.FontEditor.commands.alphabetNavigateLineDown.id:
                setCurrentCharacterIndex(currentCharacterIndex + 16 < data.offset + data.characterCount
                    ? currentCharacterIndex + 16
                    : currentCharacterIndex);
                break;
            case EDITORS_COMMANDS.FontEditor.commands.alphabetNavigatePrevChar.id:
                setCurrentCharacterIndex(currentCharacterIndex > data.offset
                    ? currentCharacterIndex - 1
                    : currentCharacterIndex);
                break;
            case EDITORS_COMMANDS.FontEditor.commands.alphabetNavigateNextChar.id:
                setCurrentCharacterIndex(currentCharacterIndex + 1 < data.offset + data.characterCount
                    ? currentCharacterIndex + 1
                    : currentCharacterIndex);
                break;
            case EDITORS_COMMANDS.FontEditor.commands.alphabetNavigateLineUp.id:
                setCurrentCharacterIndex(currentCharacterIndex - 16 >= data.offset
                    ? currentCharacterIndex - 16
                    : currentCharacterIndex);
                break;
            case EDITORS_COMMANDS.FontEditor.commands.swapColors.id:
                const secColorIndex = secondaryColorIndex;
                setSecondaryColorIndex(primaryColorIndex);
                setPrimaryColorIndex(secColorIndex);
                break;
            case EDITORS_COMMANDS.FontEditor.commands.paletteSelectIndex1.id:
                setPrimaryColorIndex(0);
                break;
            case EDITORS_COMMANDS.FontEditor.commands.paletteSelectIndex2.id:
                setPrimaryColorIndex(1);
                break;
            case EDITORS_COMMANDS.FontEditor.commands.paletteSelectIndex3.id:
                setPrimaryColorIndex(2);
                break;
            case EDITORS_COMMANDS.FontEditor.commands.paletteSelectIndex4.id:
                setPrimaryColorIndex(3);
                break;
        }
    };

    const removeTrailingNullsAndZeroesFromArray = (arr: any[]): any[] | null => {
        if (arr === null) {
            return arr;
        }

        let toDelete = 0;
        for (let c = arr.length - 1; c >= 0; c--) {
            if (arr[c] === null || arr[c] === 0) {
                toDelete++;
            } else {
                break;
            }
        }
        arr.splice(arr.length - toDelete, toDelete);

        return arr.length ? arr : null;
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
            updatedCharacter[mp.rowIndex][mp.columnIndex] = PALETTE_INDICES[mp.color];
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
        document.addEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        return () => {
            document.removeEventListener(EDITORS_COMMAND_EXECUTED_EVENT_NAME, commandListener);
        };
    }, [
        currentCharacterIndex,
        primaryColorIndex,
        secondaryColorIndex,
    ]);

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
                backgroundImage: 'radial-gradient(rgba(0, 0, 0, .3) 1px, transparent 0)',
                backgroundSize: '16px 16px',
                display: 'flex',
                alignItems: 'center',
                inset: 0,
                justifyContent: 'center',
                overflow: 'hidden',
                padding: 0,
                position: 'absolute',
            }}
        >
            <SpriteEditorStatus
                dottingRef={dottingRef}
                style={{
                    bottom: 'var(--padding)',
                    left: 'var(--padding)',
                    position: 'absolute',
                    zIndex: 100,
                }}
            />
            <Dotting
                backgroundColor='transparent'
                brushColor={PALETTE_COLORS[ColorMode.Default][primaryColorIndex]}
                defaultPixelColor={PALETTE_COLORS[ColorMode.Default][0]}
                gridStrokeColor={'#333'}
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
                    zIndex: 100,
                }}
            >
                <PaletteSelect
                    primaryColor={primaryColorIndex}
                    setPrimaryColor={setPrimaryColorIndex}
                    secondaryColor={secondaryColorIndex}
                    setSecondaryColor={setSecondaryColorIndex}
                    dottingRef={dottingRef}
                />
                <SpriteEditorUndoRedo
                    dottingRef={dottingRef}
                />

                <VContainer gap={10} overflow='auto'>
                    <SpriteEditorTools
                        dottingRef={dottingRef}
                    />
                    <SpriteEditorCurrentToolSettings
                        dottingRef={dottingRef}
                    />
                    <Actions
                        offset={data.offset}
                        characterCount={data.characterCount}
                        charPixelHeight={charPixelHeight}
                        charPixelWidth={charPixelWidth}
                        currentCharData={characters[currentCharacterIndex]}
                        setCurrentCharData={setCurrentCharacterData}
                        dottingRef={dottingRef}
                        applyPixelChanges={applyPixelChanges}
                        setCharacters={setCharacters}
                    />
                </VContainer>
            </VContainer>
            <EditorSidebar>
                <VContainer overflow='hidden'>
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
                    <Alphabet
                        charsData={data.characters || []}
                        offset={data.offset}
                        charCount={data.characterCount}
                        charHeight={charPixelHeight}
                        charWidth={charPixelWidth}
                        currentCharacterIndex={currentCharacterIndex}
                        setCurrentCharacterIndex={setCurrentCharacterIndex}
                        variableSize={data.variableSize}
                        setCurrentCharacterHoverIndex={setCurrentCharacterHoverIndex}
                    />
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
                            label={nls.localize('vuengine/entityEditor/compression', 'Compression')}
                            tooltip={nls.localize(
                                'vuengine/entityEditor/compressionDescription',
                                // eslint-disable-next-line max-len
                                'Image data can be stored in a compressed format to save ROM space. Comes at the cost of a slightly higher CPU load when loading data into memory.'
                            )}
                            tooltipPosition='bottom'
                        />
                        <RadioSelect
                            options={[{
                                label: nls.localize('vuengine/entityEditor/none', 'None'),
                                value: ImageCompressionType.NONE,
                            }, {
                                label: nls.localize('vuengine/entityEditor/rle', 'RLE'),
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
        </HContainer >
    </div >;
}
