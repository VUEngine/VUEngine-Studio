export type EmulatorConfig = {
  name: string;
  path: string;
  args: string;
};

export const DEFAULT_EMULATOR: EmulatorConfig = {
  name: "Built-In",
  path: "",
  args: "",
};

/* Note: Mednafen's red/green anaglyph option does not exist in Beetle VB */
export enum StereoMode {
  "2d-black-red" = "2D (Red/Black)",
  "2d-black-white" = "2D (White/Black)",
  "2d-black-blue" = "2D (Blue/Black)",
  "2d-black-cyan" = "2D (Cyan/Black)",
  "2d-black-electric-cyan" = "2D (El.Cyan/Black)",
  "2d-black-green" = "2D (Green/Black)",
  "2d-black-magenta" = "2D (Magenta/Black)",
  "2d-black-yellow" = "2D (Yellow/Black)",
  "anaglyph-red-blue" = "Anaglyph (Red/Blue)",
  "anaglyph-red-cyan" = "Anaglyph (Red/Cyan)",
  "anaglyph-red-electric-cyan" = "Anaglyph (Red/El.Cyan)",
  "anaglyph-green-magenta" = "Anaglyph (Green/Magenta)",
  "anaglyph-yellow-blue" = "Anaglyph (Yellow/Blue)",
  "side-by-side" = "Side By Side",
  "cyberscope" = "CyberScope",
  "hli" = "Horizontal Line Interlaced",
  "vli" = "Vertical Line Interlaced",
}

export enum EmulationMode {
  accurate = "Accurate",
  fast = "Fast",
}

export enum EmulatorScale {
  auto = "Auto scale",
  x1 = "×1",
  x2 = "×2",
  x3 = "×3",
  full = "Full size",
}
