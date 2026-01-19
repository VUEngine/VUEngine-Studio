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
  '#000',
  '#2a0000',
  '#500',
  '#7f0000',
  '#a00',
  '#d40000',
  '#f00',
]];

export const PALETTE_INDICES: { [rgb: string]: number }[] = [{
  '#000': 0,
  '#000000': 0,
  '#500': 1,
  '#550000': 1,
  '#a00': 2,
  '#aa0000': 2,
  '#f00': 3,
  '#ff0000': 3,
}, {
  '#000': 0,
  '#000000': 0,
  '#2a0000': 1,
  '#500': 2,
  '#550000': 2,
  '#7f0000': 3,
  '#a00': 4,
  '#aa0000': 4,
  '#d40000': 5,
  '#f00': 6,
  '#ff0000': 6,
}];

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

export const PALETTE_VALUE_INVERSION_MAP: { [value: number]: number }[] = [{
  0: 255,
  85: 170,
  170: 85,
  255: 0,
}, {
  0: 255,
  42: 212,
  85: 170,
  127: 127,
  170: 85,
  212: 42,
  255: 0,
}];

export const WINDOWS_EXECUTABLE_EXTENSIONS = [
  'bat',
  'bin',
  'cmd',
  'com',
  'exe',
  'ps1',
];

export const VES_VERSION = '0.7.0';
