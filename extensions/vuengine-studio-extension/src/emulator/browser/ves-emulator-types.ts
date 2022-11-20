import { nls } from '@theia/core';

export interface RomHeader {
  name: string
  maker: string
  code: string
  version: number
};

export interface EmulatorConfig {
  name: string
  path: string
  args: string
};

export const DEFAULT_EMULATOR: EmulatorConfig = {
  name: nls.localize('vuengine/emulator/builtIn', 'Built-In'),
  path: '',
  args: '',
};

export const EMULATION_STEREO_MODES = {
  '2d-black-red': nls.localize('vuengine/emulator/stereoModes/2dBlackRed', '2D (Red/Black)'),
  '2d-black-white': nls.localize('vuengine/emulator/stereoModes/2dBlackWhite', '2D (White/Black)'),
  '2d-black-blue': nls.localize('vuengine/emulator/stereoModes/2dBlackBlue', '2D (Blue/Black)'),
  '2d-black-cyan': nls.localize('vuengine/emulator/stereoModes/2dBlackCyan', '2D (Cyan/Black)'),
  '2d-black-electric-cyan': nls.localize('vuengine/emulator/stereoModes/2dBlackElectricCyan', '2D (El.Cyan/Black)'),
  '2d-black-green': nls.localize('vuengine/emulator/stereoModes/2dBlackGreen', '2D (Green/Black)'),
  '2d-black-magenta': nls.localize('vuengine/emulator/stereoModes/2dBlackMagenta', '2D (Magenta/Black)'),
  '2d-black-yellow': nls.localize('vuengine/emulator/stereoModes/2dBlackYellow', '2D (Yellow/Black)'),
  'anaglyph-red-blue': nls.localize('vuengine/emulator/stereoModes/anaglyphRedBlue', 'Anaglyph (Red/Blue)'),
  'anaglyph-red-cyan': nls.localize('vuengine/emulator/stereoModes/anaglyphRedCyan', 'Anaglyph (Red/Cyan)'),
  'anaglyph-red-electric-cyan': nls.localize('vuengine/emulator/stereoModes/anaglyph-redElectricCyan', 'Anaglyph (Red/El.Cyan)'),
  'anaglyph-green-magenta': nls.localize('vuengine/emulator/stereoModes/anaglyphGreenMagenta', 'Anaglyph (Red/Green)'),
  'anaglyph-yellow-blue': nls.localize('vuengine/emulator/stereoModes/anaglyphYellowBlue', 'Anaglyph (Yellow/Blue)'),
  'side-by-side': nls.localize('vuengine/emulator/stereoModes/sideBySide', 'Side By Side'),
  'cyberscope': nls.localize('vuengine/emulator/stereoModes/cyberscope', 'CyberScope'),
  'hli': nls.localize('vuengine/emulator/stereoModes/hli', 'Horizontal Line Interlaced'),
  'vli': nls.localize('vuengine/emulator/stereoModes/vli', 'Vertical Line Interlaced'),
};

export const EMULATION_MODES = {
  accurate: nls.localize('vuengine/emulator/emulationModes/accurate', 'Accurate'),
  fast: nls.localize('vuengine/emulator/emulationModes/fast', 'Fast'),
};

export const EMULATION_SCALES = {
  auto: nls.localize('vuengine/emulator/scales/auto', 'Auto'),
  x1: '×1',
  x2: '×2',
  x3: '×3',
  full: nls.localize('vuengine/emulator/scales/stretch', 'Stretch'),
};

export enum EmulatorGamePadKeyCode {
  A = 'KeyM',
  B = 'KeyN',
  Start = 'KeyB',
  Select = 'KeyV',
  LUp = 'KeyE',
  LRight = 'KeyF',
  LDown = 'KeyD',
  LLeft = 'KeyA', // KeyS is blocked by non-remappable low power toggle
  RUp = 'KeyI',
  RRight = 'KeyL',
  RDown = 'KeyK',
  RLeft = 'KeyJ',
  LT = 'KeyG',
  RT = 'KeyH',
}

export enum EmulatorFunctionKeyCode {
  Fullscreen = 'KeyO',
  ToggleControlsOverlay = 'KeyP',
  SaveState = 'F4',
  LoadState = 'F5',
  StateSlotDecrease = 'F6',
  StateSlotIncrease = 'F7',
  ToggleFastForward = 'ArrowRight',
  PauseToggle = 'Space',
  ToggleSlowmotion = 'ArrowDown',
  ToggleLowPower = 'KeyS',
  Rewind = 'ArrowLeft',
  FrameAdvance = 'ArrowUp',
  Reset = 'F10',
  AudioMute = 'KeyQ',
  Screenshot = 'F9',
}
