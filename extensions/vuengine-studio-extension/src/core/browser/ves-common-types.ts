export interface ImageData {
  height: number
  width: number
  colorType: number
  pixelData: number[][]
};

export enum ColorMode {
  Default = 0,
  FrameBlend = 1, // aka "HiColor"
}

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

export const PALETTE_R_VALUES: number[][] = [
  [0, 85, 170, 255],
  [0, 42, 85, 127, 170, 212, 255],
];

export const PALETTE_BIT_INDEX_MAP: { [key: string]: number } = {
  '00': 0,
  '01': 1,
  '10': 2,
  '11': 3,
};

export const PALETTE_VALUE_INDEX_MAP: { [value: number]: number }[] = [
  // default
  {
    0: 0,
    85: 1,
    170: 2,
    255: 3,
  },
  // frameblend odd frames
  {
    0: 0,
    42: 1,
    85: 1,
    127: 2,
    170: 2,
    212: 3,
    255: 3,
  },
  // frameblend even frames
  {
    0: 0,
    42: 0,
    85: 1,
    127: 1,
    170: 2,
    212: 2,
    255: 3,
  }];

export const WINDOWS_EXECUTABLE_EXTENSIONS = [
  'bat',
  'bin',
  'cmd',
  'com',
  'exe',
  'ps1',
];
