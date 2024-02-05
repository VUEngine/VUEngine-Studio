export interface ImageData {
  height: number
  width: number
  colorType: number
  pixelData: number[][]
};

export enum ColorMode {
  Default = 0,
  HiColor = 1,
}

export const PALETTE_INDEX_MAPPING: { [key: string]: number } = {
  '00': 0,
  '01': 1,
  '10': 2,
  '11': 3,
};

export const PALETTE_COLORS: string[][] = [[
  '#000',
  '#500',
  '#a00',
  '#f00',
], [
  '#000000',
  '#2a0000',
  '#550000',
  '#7f0000',
  '#aa0000',
  '#d40000',
  '#ff0000',
]];

export const WINDOWS_EXECUTABLE_EXTENSIONS = [
  'bat',
  'bin',
  'cmd',
  'com',
  'exe',
  'ps1',
];
