export interface ImageData {
  height: number
  width: number
  colorType: number
  pixelData: number[][]
};

export const PALETTE_INDEX_MAPPING: { [key: string]: number } = {
  '00': 0,
  '01': 1,
  '10': 2,
  '11': 3,
};
export const PALETTE_COLORS = ['#000', '#500', '#a00', '#f00'];
