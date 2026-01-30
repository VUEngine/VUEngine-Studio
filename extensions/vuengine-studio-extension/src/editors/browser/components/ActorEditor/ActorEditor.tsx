import { deepClone, isBoolean, isNumber, nls } from '@theia/core';
import { ConfirmDialog } from '@theia/core/lib/browser';
import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import {
    ConversionResult
} from '../../../../images/browser/ves-images-types';
import { ActorType } from '../../../../project/browser/types/Actor';
import { EditorsContext, EditorsContextType } from '../../ves-editors-types';
import HContainer from '../Common/Base/HContainer';
import PopUpDialog from '../Common/Base/PopUpDialog';
import VContainer from '../Common/Base/VContainer';
import { CommonEditorCommands } from '../Common/Editor/CommonEditorCommands';
import Sidebar from '../Common/Editor/Sidebar';
import { showItemSelection } from '../Common/Utils';
import ActorMeta from './Actor/ActorMeta';
import ActorSettings from './Actor/ActorSettings';
import { ActorEditorCommands } from './ActorEditorCommands';
import {
    ActorData,
    ActorEditorContext,
    ComponentData,
    ComponentKey,
    HIDEABLE_COMPONENT_TYPES,
    LocalStorageActorEditorState,
    MAX_PREVIEW_SPRITE_ZOOM,
    MIN_PREVIEW_SPRITE_ZOOM,
    SpriteImageData,
} from './ActorEditorTypes';
import AddComponent from './Components/AddComponent';
import ComponentTree from './Components/ComponentTree';
import CurrentComponent from './Components/CurrentComponent';
import Preview from './Preview/Preview';
import ImageProcessingSettingsForm, { ImageProcessingSettingsFormProps } from './Sprites/ImageProcessingSettingsForm';

export const ShowTreeButton = styled.button`
  left: var(--padding);
  position: absolute;
  top: calc(var(--padding) + 4px);
  transition: all .1s;
  width: 32px;
  z-index: 100;
`;

export const HideTreeButton = styled.button`
  padding: 0;
  position: absolute;
  right: 3px;
  top: 3px;
  width: 32px;
  z-index: 100;
`;

interface ActorEditorProps {
    data: ActorData;
    updateData: (actorData: ActorData) => void;
}

export interface ActorEditorSaveDataOptions {
    appendImageData?: boolean
}

const getMostFilesOnASprite = (actorData: ActorData): number =>
    Math.max(...actorData.components?.sprites.map(s => s.texture.files.length));

export default function ActorEditor(props: ActorEditorProps): React.JSX.Element {
    const { data, updateData } = props;
    const {
        fileUri,
        isGenerating,
        setIsGenerating,
        setGeneratingProgress,
        enableCommands,
        setCommands,
        focusEditor,
        onCommandExecute,
        services
    } = useContext(EditorsContext) as EditorsContextType;

    const [currentComponent, setCurrentComponent] = useState<string>('');
    const [isAnimationPlaying, setIsAnimationPlaying] = useState<boolean>(true);
    const [currentAnimationStep, setCurrentAnimationStep] = useState<number>(0);
    const [leftSidebarOpen, setLeftSidebarOpen] = useState<boolean>(true);
    const [previewAnaglyph, setPreviewAnaglyph] = useState<boolean>(false);
    const [previewProjectionDepth, setPreviewProjectionDepth] = useState<number>(99999/* 128 */);
    const [previewBackgroundColor, setPreviewBackgroundColor] = useState<number>(-1);
    const [previewCurrentMeshSegment, setPreviewCurrentMeshSegment] = useState<number>(-1);
    const [previewScreenFrame, setPreviewScreenFrame] = useState<boolean>(false);
    const [previewPalettes, setPreviewPalettes] = useState<string[]>(['11100100', '11100000', '11010000', '11100100']);
    const [previewShowChildren, setPreviewShowChildren] = useState<boolean>(true);
    const [previewShowColliders, setPreviewShowColliders] = useState<boolean>(true);
    const [previewShowSprites, setPreviewShowSprites] = useState<boolean>(true);
    const [previewShowWireframes, setPreviewShowWireframes] = useState<boolean>(true);
    const [previewZoom, setPreviewZoom] = useState<number>(2);
    const [spriteProcessingDialog, setSpriteProcessingDialog] = useState<boolean | ImageProcessingSettingsFormProps>(false);
    const [addComponentDialogOpen, setAddComponentDialogOpen] = useState<boolean>(false);

    const mostFilesOnASprite = getMostFilesOnASprite(data);
    const isMultiFileAnimation = mostFilesOnASprite > 1;
    const hasAnyComponent = Object.values(data.components).filter(c => c.length > 0).length > 0;

    const getStateLocalStorageId = (): string =>
        `ves-editors-Actor-state/${fileUri.path.fsPath()}`;

    const savePreviewState = async (): Promise<void> =>
        services.localStorageService.setData<LocalStorageActorEditorState>(getStateLocalStorageId(), {
            previewAnaglyph,
            previewBackgroundColor,
            previewScreenFrame,
            previewShowChildren,
            previewShowColliders,
            previewShowSprites,
            previewShowWireframes,
            previewZoom,
        });

    const restorePreviewState = async (): Promise<void> => {
        // Beware! This can cause hard to track unwanted side effects with outdated states in storage. Apply values with caution.
        const savedState = await services.localStorageService.getData<LocalStorageActorEditorState>(getStateLocalStorageId());
        if (!savedState) {
            return;
        }

        if (isBoolean(savedState.previewAnaglyph)) {
            setPreviewAnaglyph(savedState.previewAnaglyph);
        }
        if (isNumber(savedState.previewBackgroundColor) &&
            savedState.previewBackgroundColor < 3 &&
            savedState.previewBackgroundColor > -1) {
            setPreviewBackgroundColor(savedState.previewBackgroundColor);
        }
        if (isBoolean(savedState.previewScreenFrame)) {
            setPreviewScreenFrame(savedState.previewScreenFrame);
        }
        if (isBoolean(savedState.previewShowChildren)) {
            setPreviewShowChildren(savedState.previewShowChildren);
        }
        if (isBoolean(savedState.previewShowColliders)) {
            setPreviewShowColliders(savedState.previewShowColliders);
        }
        if (isBoolean(savedState.previewShowSprites)) {
            setPreviewShowSprites(savedState.previewShowSprites);
        }
        if (isBoolean(savedState.previewShowWireframes)) {
            setPreviewShowWireframes(savedState.previewShowWireframes);
        }
        if (isNumber(savedState.previewZoom) &&
            savedState.previewZoom <= MAX_PREVIEW_SPRITE_ZOOM &&
            savedState.previewZoom >= MIN_PREVIEW_SPRITE_ZOOM) {
            setPreviewZoom(savedState.previewZoom);
        }
    };

    const setData = async (actorData: Partial<ActorData>, options?: ActorEditorSaveDataOptions): Promise<void> => {
        if (!isGenerating) {
            const updatedData = postProcessData({ ...data, ...actorData });
            if (options?.appendImageData) {
                setIsGenerating(true);
                appendImageData(updatedData).then(d => {
                    updateData(d);
                    setIsGenerating(false);
                });
            } else {
                updateData(updatedData);
            }
        }
    };

    const postProcessData = (actorData: ActorData): ActorData => {
        if (!actorData.components?.animations.length) {
            // set total frames to 1 when disabling animations
            actorData.animations.totalFrames = 1;
        } else {
            // total frames to most images on sprite, if multi file animation
            const actorMostFilesOnASprite = getMostFilesOnASprite(actorData);
            const actorIsMultiFileAnimation = actorMostFilesOnASprite > 1;
            if (actorIsMultiFileAnimation) {
                actorData.animations.totalFrames = mostFilesOnASprite;
            }
        }

        return actorData;
    };

    const compressImageDataAsJson = async (imageData: Partial<ConversionResult>): Promise<ConversionResult> => {
        if (imageData.tiles) {
            let frameOffsets = {};
            if (imageData.tiles.frameOffsets) {
                frameOffsets = {
                    frameOffsets: await services.vesCommonService.compressJson(imageData.tiles.frameOffsets),
                };
            }
            imageData = {
                ...imageData,
                tiles: {
                    ...imageData.tiles,
                    data: await services.vesCommonService.compressJson(imageData.tiles.data),
                    ...frameOffsets,
                },
            };
        }

        if (imageData.maps) {
            imageData = {
                ...imageData,
                maps: await Promise.all(imageData.maps.map(async m => ({
                    ...m,
                    data: await services.vesCommonService.compressJson(m.data),
                }))),
            };
        }

        return imageData as ConversionResult;
    };

    const appendImageData = async (actorData: ActorData): Promise<ActorData> => {
        const actorMostFilesOnASprite = getMostFilesOnASprite(actorData);
        const actorIsMultiFileAnimation = actorData.components?.animations.length > 0 && actorMostFilesOnASprite > 1;
        const totalSprites = actorData.components?.sprites?.length ?? 0;

        for (let i = 0; i < totalSprites; i++) {
            const sprite = actorData.components?.sprites[i];
            const optimizeTiles = (actorData.components?.animations.length === 0 && sprite.optimizeTiles)
                || (actorData.components?.animations.length > 0 && actorIsMultiFileAnimation);
            if (sprite.texture?.files?.length) {
                // possible scenarios:
                // 1) mono image: files.length = 1
                // 2) stereo image: files.length = 1 && files2.length = 1
                // 3) mono video: files.length = n
                // 4) stereo video: files.length = n && files2.length = n
                let files = [
                    sprite.texture?.files || [],
                    sprite.texture?.files2 || [],
                ];
                const isStereoSprite = sprite.texture?.files?.length === 1 && sprite.texture?.files2?.length === 1;
                if (isStereoSprite) {
                    files = [[sprite.texture.files[0], sprite.texture.files2[0]]];
                }
                sprite._imageData = {
                    images: [],
                };
                await Promise.all(files.map(async (f, j) => {
                    if (!f?.length) {
                        return;
                    }

                    const name = services.vesCommonService.cleanSpecName(fileUri.parent.resolve(f[0]).path.name);
                    const nameSuffix = files.length === 2 ? j ? 'R' : 'L' : '';
                    const newImageData = await services.vesImagesService.convertImage(fileUri, {
                        name: name + nameSuffix,
                        section: sprite.section,
                        animation: {
                            frames: actorIsMultiFileAnimation ? mostFilesOnASprite : actorData.animations.totalFrames,
                            individualFiles: actorIsMultiFileAnimation,
                            isAnimation: actorData.components?.animations.length > 0
                        },
                        map: {
                            compression: sprite.compression,
                            generate: true,
                            reduce: {
                                flipped: optimizeTiles,
                                unique: optimizeTiles,
                            },
                        },
                        tileset: {
                            compression: sprite.compression,
                            shared: isStereoSprite,
                        },
                        files: f,
                        imageProcessingSettings: sprite.imageProcessingSettings,
                        colorMode: sprite.colorMode,
                    });
                    setGeneratingProgress((i + 1) * 2 - 1, totalSprites * 2);
                    const compressedImageData = await compressImageDataAsJson(newImageData);
                    (sprite._imageData! as SpriteImageData).images[j] = {
                        ...compressedImageData,
                    };
                }));
            } else {
                sprite._imageData = undefined;
            }
            setGeneratingProgress((i + 1) * 2, totalSprites * 2);
        }

        return actorData;
    };

    const addComponent = async (): Promise<void> => {
        setAddComponentDialogOpen(true);
    };

    const doAddComponent = async (t: string): Promise<void> => {
        switch (t) {
            case 'animations':
                return addComponentByType(t, nls.localize('vuengine/editors/actor/animation', 'Animation'));
            case 'bodies':
                return addComponentByType(t, nls.localize('vuengine/editors/actor/body', 'Body'));
            case 'children':
                return addPositionedActor();
            case 'colliders':
                return addComponentByType(t, nls.localize('vuengine/editors/actor/collider', 'Collider'));
            case 'mutators':
                return addComponentByType(t, nls.localize('vuengine/editors/actor/mutation', 'Mutation'));
            case 'sounds':
                return addSound();
            case 'sprites':
                return addComponentByType(t, nls.localize('vuengine/editors/actor/sprite', 'Sprite'));
            case 'wireframes':
                return addComponentByType(t, nls.localize('vuengine/editors/actor/wireframe', 'Wireframe'));
        }
    };

    const addComponentByType = async (componentKey: ComponentKey, name: string): Promise<void> => {
        const schema = await window.electronVesCore.dereferenceJsonSchema(ActorType.schema);
        if (!schema?.properties?.components?.properties || !schema?.properties?.components?.properties[componentKey]) {
            return;
        }
        const newComponentData = services.vesProjectService.generateDataFromJsonSchema(schema?.properties?.components?.properties[componentKey].items);
        if (!newComponentData) {
            return;
        }

        setData({
            components: {
                ...data.components,
                [componentKey]: [
                    ...(data.components && data.components[componentKey] ? deepClone(data.components[componentKey]) : []),
                    {
                        ...newComponentData,
                        name,
                    },
                ],
            }
        });

        setCurrentComponent(`${componentKey}-${(data.components[componentKey] ?? []).length}`);
    };

    const addPositionedActor = async (): Promise<void> => {
        const itemToAdd = await showItemSelection(
            'Actor',
            services.quickPickService,
            services.messageService,
            services.vesProjectService,
            [data._id]
        );
        if (itemToAdd !== undefined) {
            const updatedChildren = deepClone(data.components?.children || []);
            updatedChildren.push({
                itemId: itemToAdd.id!,
                onScreenPosition: {
                    x: 0,
                    y: 0,
                    z: 0,
                },
                onScreenRotation: {
                    x: 0,
                    y: 0,
                    z: 0,
                },
                onScreenScale: {
                    x: 0,
                    y: 0,
                    z: 0,
                },
                name: '',
                children: [],
                extraInfo: '',
                loadRegardlessOfPosition: false,
            });

            setData({
                components: {
                    ...data.components,
                    children: updatedChildren,
                }
            });

            setCurrentComponent(`children-${updatedChildren.length - 1}`);
        }
    };

    const addSound = async (): Promise<void> => {
        const itemToAdd = await showItemSelection(
            'Sound',
            services.quickPickService,
            services.messageService,
            services.vesProjectService,
            [data._id]
        );
        if (itemToAdd !== undefined) {
            const updatedSounds = deepClone(data.components?.sounds || []);
            updatedSounds.push({
                itemId: itemToAdd.id!,
            });

            setData({
                components: {
                    ...data.components,
                    sounds: updatedSounds,
                }
            });

            setCurrentComponent(`sounds-${updatedSounds.length - 1}`);
        }
    };

    const removeComponent = async (key: ComponentKey | 'bodies', index: number) => {
        const dialog = new ConfirmDialog({
            title: nls.localize('vuengine/editors/actor/removeComponent', 'Remove Component'),
            msg: nls.localize('vuengine/editors/actor/areYouSureYouWantToRemoveComponent', 'Are you sure you want to remove this component?'),
        });
        const confirmed = await dialog.open();
        if (confirmed) {
            setCurrentComponent('');
            doRemoveComponent(key, index);
        }
    };

    const doRemoveComponent = async (key: ComponentKey, index: number): Promise<void> => {
        setData({
            components: {
                ...data.components,
                [key]: [
                    ...data.components[key as ComponentKey].slice(0, index),
                    ...data.components[key as ComponentKey].slice(index + 1)
                ],
            }
        });
    };

    const updateComponent = (key: ComponentKey, index: number, partialData: Partial<ComponentData>, options?: ActorEditorSaveDataOptions): void => {
        const componentsArray = deepClone(data.components[key]);
        // @ts-ignore
        componentsArray[index] = {
            ...componentsArray[index],
            ...partialData,
        };

        setData({
            components: {
                ...data.components,
                [key]: componentsArray,
            }
        }, options);
    };

    const setCurrentComponentDisplacement = (displacements: { axis: 'x' | 'y' | 'z' | 'parallax', offset: number }[]): void => {
        const [type, indexString] = currentComponent.split('-');
        const index = parseInt(indexString || '-1');
        if (index > -1 && HIDEABLE_COMPONENT_TYPES.includes(type)) {
            // @ts-ignore
            const currentDisplacement = data.components[type as ComponentKey][index].displacement;
            if (currentDisplacement) {
                const displacement = {
                    ...currentDisplacement,
                };
                if (displacements.length) {
                    displacements.map(d => displacement[d.axis] = currentDisplacement[d.axis] + d.offset);
                } else {
                    displacement.x = 0;
                    displacement.y = 0;
                    displacement.z = 0;
                    displacement.parallax = 0;
                }

                updateComponent(type as ComponentKey, index, { displacement });
            }
        }
    };

    const commandListener = (commandId: string): void => {
        switch (commandId) {
            case ActorEditorCommands.ADD_COMPONENT.id:
                addComponent();
                break;
            case ActorEditorCommands.CENTER_CURRENT_COMPONENT.id:
                setCurrentComponentDisplacement([]);
                break;
            case ActorEditorCommands.DELETE_CURRENT_COMPONENT.id:
                const [type, indexString] = currentComponent.split('-');
                removeComponent(type as ComponentKey, parseInt(indexString));
                break;
            case ActorEditorCommands.DESELECT_CURRENT_COMPONENT.id:
                setCurrentComponent('');
                break;
            case ActorEditorCommands.MOVE_COMPONENT_DOWN.id:
                setCurrentComponentDisplacement([{ axis: 'y', offset: 1 }]);
                break;
            case ActorEditorCommands.MOVE_COMPONENT_UP.id:
                setCurrentComponentDisplacement([{ axis: 'y', offset: -1 }]);
                break;
            case ActorEditorCommands.MOVE_COMPONENT_LEFT.id:
                setCurrentComponentDisplacement([{ axis: 'x', offset: -1 }]);
                break;
            case ActorEditorCommands.MOVE_COMPONENT_RIGHT.id:
                setCurrentComponentDisplacement([{ axis: 'x', offset: 1 }]);
                break;
            case ActorEditorCommands.INCREASE_COMPONENT_Z_DISPLACEMENT.id:
                setCurrentComponentDisplacement([{ axis: 'z', offset: 1 }]);
                break;
            case ActorEditorCommands.DECREASE_COMPONENT_Z_DISPLACEMENT.id:
                setCurrentComponentDisplacement([{ axis: 'z', offset: -1 }]);
                break;
            case ActorEditorCommands.INCREASE_COMPONENT_PARALLAX.id:
                setCurrentComponentDisplacement([{ axis: 'parallax', offset: 1 }]);
                break;
            case ActorEditorCommands.DECREASE_COMPONENT_PARALLAX.id:
                setCurrentComponentDisplacement([{ axis: 'parallax', offset: -1 }]);
                break;
            case CommonEditorCommands.CENTER.id:
                setCurrentComponentDisplacement([{ axis: 'parallax', offset: -1 }]);
                break;
        }
    };

    useEffect(() => {
        setCommands([
            ...Object.values({
                ...CommonEditorCommands,
                ...ActorEditorCommands,
            }).map(c => c.id)
        ]);
    }, []);

    useEffect(() => {
        const disp = onCommandExecute(commandListener);
        return () => disp.dispose();
    }, [
        currentComponent,
        data.components,
    ]);

    useEffect(() => {
        restorePreviewState();
    }, []);

    useEffect(() => {
        savePreviewState();
    }, [
        previewAnaglyph,
        previewBackgroundColor,
        previewShowChildren,
        previewShowColliders,
        previewShowSprites,
        previewShowWireframes,
        previewZoom,
    ]);

    return (
        <div
            className="actorEditor"
            tabIndex={0}
        >
            <ActorEditorContext.Provider
                value={{
                    data,
                    setData: setData,
                    addComponent: doAddComponent,
                    removeComponent: removeComponent,
                    currentComponent: currentComponent,
                    setCurrentComponent: setCurrentComponent,
                    isAnimationPlaying: isAnimationPlaying,
                    setIsAnimationPlaying: setIsAnimationPlaying,
                    currentAnimationStep: currentAnimationStep,
                    setCurrentAnimationStep: setCurrentAnimationStep,
                    previewAnaglyph: previewAnaglyph,
                    setPreviewAnaglyph: setPreviewAnaglyph,
                    previewBackgroundColor: previewBackgroundColor,
                    setPreviewBackgroundColor: setPreviewBackgroundColor,
                    previewCurrentMeshSegment: previewCurrentMeshSegment,
                    setPreviewCurrentMeshSegment: setPreviewCurrentMeshSegment,
                    previewScreenFrame: previewScreenFrame,
                    setPreviewScreenFrame: setPreviewScreenFrame,
                    previewPalettes: previewPalettes,
                    setPreviewPalettes: setPreviewPalettes,
                    previewProjectionDepth: previewProjectionDepth,
                    setPreviewProjectionDepth: setPreviewProjectionDepth,
                    previewShowChildren: previewShowChildren,
                    setPreviewShowChildren: setPreviewShowChildren,
                    previewShowColliders: previewShowColliders,
                    setPreviewShowColliders: setPreviewShowColliders,
                    previewShowSprites: previewShowSprites,
                    setPreviewShowSprites: setPreviewShowSprites,
                    previewShowWireframes: previewShowWireframes,
                    setPreviewShowWireframes: setPreviewShowWireframes,
                    previewZoom: previewZoom,
                    setPreviewZoom: setPreviewZoom,
                }}
            >
                <ActorEditorContext.Consumer>
                    {context => <>
                        <Preview
                            hasAnyComponent={hasAnyComponent}
                            updateComponent={updateComponent}
                            setCurrentComponentDisplacement={setCurrentComponentDisplacement}
                        />
                        {hasAnyComponent &&
                            <HContainer
                                alignItems='start'
                                grow={1}
                                justifyContent='space-between'
                                overflow='hidden'
                            >
                                <Sidebar
                                    open={leftSidebarOpen}
                                    side='left'
                                    width={320}
                                >
                                    <HideTreeButton
                                        className="theia-button secondary"
                                        title={nls.localize('vuengine/editors/actor/hideComponentsTree', 'Hide Components Tree')}
                                        onClick={() => setLeftSidebarOpen(false)}
                                    >
                                        <i className="codicon codicon-chevron-left" />
                                    </HideTreeButton>
                                    <VContainer gap={10} style={{
                                        padding: 'var(--padding) 0',
                                    }}>
                                        <ActorMeta />
                                        <ActorSettings />
                                        <ComponentTree />
                                    </VContainer>
                                </Sidebar>
                                {!leftSidebarOpen &&
                                    <ShowTreeButton
                                        style={{
                                            opacity: leftSidebarOpen ? 0 : 1,
                                        }}
                                        className="theia-button secondary"
                                        title={nls.localize('vuengine/editors/actor/showComponentsTree', 'Show Components Tree')}
                                        onClick={() => setLeftSidebarOpen(true)}
                                    >
                                        <i className="codicon codicon-list-tree" />
                                    </ShowTreeButton>
                                }
                                <Sidebar
                                    open={currentComponent.includes('-') || ['animations', 'colliders', 'extraProperties', 'logic', 'sprites'].includes(currentComponent)}
                                    side='right'
                                    width={320}
                                >
                                    <CurrentComponent
                                        isMultiFileAnimation={isMultiFileAnimation}
                                        updateComponent={updateComponent}
                                        spriteProcessingDialog={spriteProcessingDialog}
                                        setSpriteProcessingDialog={setSpriteProcessingDialog}
                                    />
                                </Sidebar>
                                {spriteProcessingDialog !== false && (
                                    <PopUpDialog
                                        open={true}
                                        onClose={() => {
                                            setSpriteProcessingDialog(false);
                                            enableCommands();
                                            focusEditor();
                                        }}
                                        onOk={() => {
                                            setSpriteProcessingDialog(false);
                                            enableCommands();
                                            focusEditor();
                                        }}
                                        title={nls.localize('vuengine/editors/general/imageProcessingSettings', 'Image Processing Settings')}
                                        height='100%'
                                        width='100%'
                                    >
                                        <ImageProcessingSettingsForm
                                            image={(spriteProcessingDialog as ImageProcessingSettingsFormProps).image}
                                            setFiles={(spriteProcessingDialog as ImageProcessingSettingsFormProps).setFiles}
                                            imageData={(spriteProcessingDialog as ImageProcessingSettingsFormProps).imageData}
                                            processingSettings={(spriteProcessingDialog as ImageProcessingSettingsFormProps).processingSettings}
                                            updateProcessingSettings={(spriteProcessingDialog as ImageProcessingSettingsFormProps).updateProcessingSettings}
                                            colorMode={(spriteProcessingDialog as ImageProcessingSettingsFormProps).colorMode}
                                            updateColorMode={(spriteProcessingDialog as ImageProcessingSettingsFormProps).updateColorMode}
                                            allowFrameBlendMode={(spriteProcessingDialog as ImageProcessingSettingsFormProps).allowFrameBlendMode}
                                            compression={(spriteProcessingDialog as ImageProcessingSettingsFormProps).compression}
                                            convertImage={(spriteProcessingDialog as ImageProcessingSettingsFormProps).convertImage}
                                        />
                                    </PopUpDialog>
                                )}
                            </HContainer>
                        }
                        {addComponentDialogOpen &&
                            <PopUpDialog
                                open={addComponentDialogOpen}
                                onClose={() => {
                                    setAddComponentDialogOpen(false);
                                    enableCommands();
                                    focusEditor();
                                }}
                                onOk={() => {
                                    setAddComponentDialogOpen(false);
                                    enableCommands();
                                    focusEditor();
                                }}
                                title={nls.localize('vuengine/editors/sound/addComponent', 'Add Component')}
                                height='400px'
                                width='588px'
                                cancelButton={true}
                                okButton={false}
                            >
                                <AddComponent
                                    data={data}
                                    setAddComponentDialogOpen={setAddComponentDialogOpen}
                                    addComponent={doAddComponent}
                                />
                            </PopUpDialog>
                        }
                    </>}
                </ActorEditorContext.Consumer>
            </ActorEditorContext.Provider>
        </div>
    );
}
