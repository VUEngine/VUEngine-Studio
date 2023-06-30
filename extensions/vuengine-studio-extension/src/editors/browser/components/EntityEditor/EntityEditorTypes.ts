import React from 'react';

// @ts-ignore
export const EntityEditorContext = React.createContext<EntityEditorContextType>({});

export interface EntityEditorContextType {
    state: EntityEditorState
    setState: (state: Partial<EntityEditorState>) => void
    entityData: EntityData
    setEntityData: (songData: Partial<EntityData>) => void
}

export const EntityEditorLayoutStorageName = 'ves-editors-entityEditor-layout';

export interface EntityData {
    name: string
    extraInfo: string
    pixelSize: {
        x: number,
        y: number,
        z: number,
    },
    collisions: {
        inGameType: string,
        shapes: {
            type: string,
            pixelSize: {
                x: number,
                y: number,
                z: number,
            },
            displacement: {
                x: number,
                y: number,
                z: number,
                parallax: number,
            },
            rotation: {
                x: number,
                y: number,
                z: number,
            },
            scale: {
                x: number,
                y: number,
                z: number,
            },
            checkForCollisions: boolean,
            layers: string,
            layersToIgnore: string,
        }[],
    },
    meshes: {
        meshes: {
            wireframe: {
                allocator: string,
                displacement: {
                    x: number,
                    y: number,
                    z: number,
                },
                color: number,
                transparent: number,
                interlaced: boolean,
            },
            segments: {
                fromVertex: {
                    x: number,
                    y: number,
                    z: number,
                    parallax: number,
                },
                toVertex: {
                    x: number,
                    y: number,
                    z: number,
                    parallax: number,
                },
            }[],
        }[],
    },
    physics: {
        enabled: boolean,
        mass: number,
        friction: number,
        bounciness: number,
        maximumSpeed: number,
        maximumVelocity: {
            x: number,
            y: number,
            z: number,
        },
    },
    sprites: {
        type: string,
        useZDisplacementInProjection: boolean,
        sprites: {
            name: string,
            class: string,
            bgmapMode: string,
            displayMode: string,
            transparency: string,
            displacement: {
                x: number,
                y: number,
                z: number,
                parallax: number,
            },
            manipulationFunction: string,
            texture: {
                charset: {
                    type: string,
                },
                image: {
                    name: string,
                    chars: boolean,
                },
                padding: {
                    x: number,
                    y: number,
                },
                palette: number,
                recycleable: boolean,
                size: {
                    x: number,
                    y: number,
                },
            },
        }[],
    },
}

export interface EntityEditorState {
}
