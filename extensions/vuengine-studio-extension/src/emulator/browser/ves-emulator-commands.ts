import { Command } from '@theia/core';

export namespace VesEmulatorCommands {
  export const CATEGORY = 'Emulator';

  export const RUN: Command = {
    id: 'VesRun.commands.run',
    label: 'Run on Emulator',
    category: CATEGORY,
    iconClass: 'fa fa-play',
  };

  export const SELECT: Command = {
    id: 'VesRun.commands.selectEmulator',
    label: 'Set Default Emulator Config...',
    category: CATEGORY,
  };

  export const INPUT_L_UP: Command = {
    id: 'VesRun.commands.emulatorInputLUpCommand',
    label: 'Left D-Pad Up',
    category: 'Emulator Game Pad',
  };

  export const INPUT_L_RIGHT: Command = {
    id: 'VesRun.commands.emulatorInputLRightCommand',
    label: 'Left D-Pad Right',
    category: 'Emulator Game Pad',
  };

  export const INPUT_L_DOWN: Command = {
    id: 'VesRun.commands.emulatorInputLDownCommand',
    label: 'Left D-Pad Down',
    category: 'Emulator Game Pad',
  };

  export const INPUT_L_LEFT: Command = {
    id: 'VesRun.commands.emulatorInputLLeftCommand',
    label: 'Left D-Pad Left',
    category: 'Emulator Game Pad',
  };

  export const INPUT_START: Command = {
    id: 'VesRun.commands.emulatorInputStartCommand',
    label: 'Start',
    category: 'Emulator Game Pad',
  };

  export const INPUT_SELECT: Command = {
    id: 'VesRun.commands.emulatorInputSelectCommand',
    label: 'Select',
    category: 'Emulator Game Pad',
  };

  export const INPUT_L_TRIGGER: Command = {
    id: 'VesRun.commands.emulatorInputLTriggerCommand',
    label: 'Left Trigger',
    category: 'Emulator Game Pad',
  };

  export const INPUT_R_UP: Command = {
    id: 'VesRun.commands.emulatorInputRUpCommand',
    label: 'Right D-Pad Up',
    category: 'Emulator Game Pad',
  };

  export const INPUT_R_RIGHT: Command = {
    id: 'VesRun.commands.emulatorInputRRightCommand',
    label: 'Right D-Pad Right',
    category: 'Emulator Game Pad',
  };

  export const INPUT_R_DOWN: Command = {
    id: 'VesRun.commands.emulatorInputRDownCommand',
    label: 'Right D-Pad Down',
    category: 'Emulator Game Pad',
  };

  export const INPUT_R_LEFT: Command = {
    id: 'VesRun.commands.emulatorInputRLeftCommand',
    label: 'Right D-Pad Left',
    category: 'Emulator Game Pad',
  };

  export const INPUT_B: Command = {
    id: 'VesRun.commands.emulatorInputBCommand',
    label: 'B',
    category: 'Emulator Game Pad',
  };

  export const INPUT_A: Command = {
    id: 'VesRun.commands.emulatorInputACommand',
    label: 'A',
    category: 'Emulator Game Pad',
  };

  export const INPUT_R_TRIGGER: Command = {
    id: 'VesRun.commands.emulatorInputRTriggerCommand',
    label: 'Right Trigger',
    category: 'Emulator Game Pad',
  };

  export const INPUT_SAVE_STATE: Command = {
    id: 'VesRun.commands.emulatorInputSaveStateCommand',
    label: 'Save State',
    category: CATEGORY,
  };

  export const INPUT_LOAD_STATE: Command = {
    id: 'VesRun.commands.emulatorInputLoadStateCommand',
    label: 'Load State',
    category: CATEGORY,
  };

  export const INPUT_STATE_SLOT_DECREASE: Command = {
    id: 'VesRun.commands.emulatorInputStateSlotDecreaseCommand',
    label: 'Decrease Save State Slot',
    category: CATEGORY,
  };

  export const INPUT_STATE_SLOT_INCREASE: Command = {
    id: 'VesRun.commands.emulatorInputStateSlotIncreaseCommand',
    label: 'Increase Save State Slot',
    category: CATEGORY,
  };

  export const INPUT_TOGGLE_FAST_FORWARD: Command = {
    id: 'VesRun.commands.emulatorInputToggleFastForwardCommand',
    label: 'Toggle Fast Forward',
    category: CATEGORY,
  };

  export const INPUT_PAUSE_TOGGLE: Command = {
    id: 'VesRun.commands.emulatorInputPauseToggleCommand',
    label: 'Toggle Pause',
    category: CATEGORY,
  };

  export const INPUT_TOGGLE_SLOWMOTION: Command = {
    id: 'VesRun.commands.emulatorInputToggleSlowmotionCommand',
    label: 'Toggle Slow Motion',
    category: CATEGORY,
  };

  export const INPUT_TOGGLE_LOW_POWER: Command = {
    id: 'VesRun.commands.emulatorInputToggleLowPower',
    label: 'Toggle Low Power Signal',
    category: CATEGORY,
  };

  export const INPUT_REWIND: Command = {
    id: 'VesRun.commands.emulatorInputRewindCommand',
    label: 'Rewind',
    category: CATEGORY,
  };

  export const INPUT_FRAME_ADVANCE: Command = {
    id: 'VesRun.commands.emulatorInputFrameAdvanceCommand',
    label: 'Frame Advance',
    category: CATEGORY,
  };

  export const INPUT_RESET: Command = {
    id: 'VesRun.commands.emulatorInputResetCommand',
    label: 'Reset',
    category: CATEGORY,
  };

  export const INPUT_AUDIO_MUTE: Command = {
    id: 'VesRun.commands.emulatorInputAudioMuteCommand',
    label: 'Audio Mute',
    category: CATEGORY,
  };

  export const INPUT_TOGGLE_FULLSCREEN: Command = {
    id: 'VesRun.commands.emulatorInputToggleFullscreenCommand',
    label: 'Toggle Fullscreen',
    category: CATEGORY,
  };

  export const INPUT_TOGGLE_CONTROLS_OVERLAY: Command = {
    id: 'VesRun.commands.emulatorInputToggleControlsOverlayCommand',
    label: 'Toggle Controls Overlay',
    category: CATEGORY,
  };
};
