export interface SpriteLayerData {
    id: string
    name: string
    data: number[][]
}

export interface SpriteData {
    name: string
    layers: SpriteLayerData[]
}
