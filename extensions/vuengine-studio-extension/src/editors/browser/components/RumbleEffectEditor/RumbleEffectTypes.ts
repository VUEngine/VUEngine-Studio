import { nls } from '@theia/core';

export type RumbleEffectFrequency = 160 | 240 | 320 | 400 | 50 | 95 | 130;

export interface RumbleEffectData {
    effect: number
    frequency: RumbleEffectFrequency
    sustainPositive: number
    sustainNegative: number
    overdrive: number
    break: number
    stopBeforeStarting: boolean
}

export const RUMBLE_EFFECT_FREQUENCIES = [50, 95, 130, 160, 240, 320, 400];
export const DEFAULT_RUMBLE_EFFECT_FREQUENCY = 160;

export const BUILT_IN_RUMBLE_EFFECTS = [
    `1) ${nls.localize('vuengine/editors/rumbleEffect/effects/strongClick', 'Strong Click')} - 100 %`,
    `2) ${nls.localize('vuengine/editors/rumbleEffect/effects/strongClick', 'Strong Click')} - 60 % `,
    `3) ${nls.localize('vuengine/editors/rumbleEffect/effects/strongClick', 'Strong Click')} - 30 % `,
    `4) ${nls.localize('vuengine/editors/rumbleEffect/effects/sharpClick', 'Sharp Click')} - 100 % `,
    `5) ${nls.localize('vuengine/editors/rumbleEffect/effects/sharpClick', 'Sharp Click')} - 60 % `,
    `6) ${nls.localize('vuengine/editors/rumbleEffect/effects/sharpClick', 'Sharp Click')} - 30 % `,
    `7) ${nls.localize('vuengine/editors/rumbleEffect/effects/softBump', 'Soft Bump')} - 100 % `,
    `8) ${nls.localize('vuengine/editors/rumbleEffect/effects/softBump', 'Soft Bump')} - 60 % `,
    `9) ${nls.localize('vuengine/editors/rumbleEffect/effects/softBump', 'Soft Bump')} - 30 % `,
    `10) ${nls.localize('vuengine/editors/rumbleEffect/effects/doubleClick', 'Double Click')} - 100 % `,
    `11) ${nls.localize('vuengine/editors/rumbleEffect/effects/doubleClick', 'Double Click')} - 60 % `,
    `12) ${nls.localize('vuengine/editors/rumbleEffect/effects/tripleClick', 'Triple Click')} - 100 % `,
    `13) ${nls.localize('vuengine/editors/rumbleEffect/effects/softFuzz', 'Soft Fuzz')} - 60 % `,
    `14) ${nls.localize('vuengine/editors/rumbleEffect/effects/strongBuzz', 'Strong Buzz')} - 100 % `,
    `15) ${nls.localize('vuengine/editors/rumbleEffect/effects/750MsAlert', '750 ms Alert')} 100 % `,
    `16) ${nls.localize('vuengine/editors/rumbleEffect/effects/1000MsAlert', '1000 ms Alert')} 100 % `,
    `17) ${nls.localize('vuengine/editors/rumbleEffect/effects/strongClick', 'Strong Click')} 1 - 100 % `,
    `18) ${nls.localize('vuengine/editors/rumbleEffect/effects/strongClick', 'Strong Click')} 2 - 80 % `,
    `19) ${nls.localize('vuengine/editors/rumbleEffect/effects/strongClick', 'Strong Click')} 3 - 60 % `,
    `20) ${nls.localize('vuengine/editors/rumbleEffect/effects/strongClick', 'Strong Click')} 4 - 30 % `,
    `21) ${nls.localize('vuengine/editors/rumbleEffect/effects/mediumClick', 'Medium Click')} 1 - 100 % `,
    `22) ${nls.localize('vuengine/editors/rumbleEffect/effects/mediumClick', 'Medium Click')} 2 - 80 % `,
    `23) ${nls.localize('vuengine/editors/rumbleEffect/effects/mediumClick', 'Medium Click')} 3 - 60 % `,
    `24) ${nls.localize('vuengine/editors/rumbleEffect/effects/sharpTick', 'Sharp Tick')} 1 - 100 % `,
    `25) ${nls.localize('vuengine/editors/rumbleEffect/effects/sharpTick', 'Sharp Tick')} 2 - 80 % `,
    `26) ${nls.localize('vuengine/editors/rumbleEffect/effects/sharpTick', 'Sharp Tick')} 3 – 60 % `,
    `27) ${nls.localize('vuengine/editors/rumbleEffect/effects/shortDoubleClickStrong', 'Short Double Click Strong')} 1 – 100 % `,
    `28) ${nls.localize('vuengine/editors/rumbleEffect/effects/shortDoubleClickStrong', 'Short Double Click Strong')} 2 – 80 % `,
    `29) ${nls.localize('vuengine/editors/rumbleEffect/effects/shortDoubleClickStrong', 'Short Double Click Strong')} 3 – 60 % `,
    `30) ${nls.localize('vuengine/editors/rumbleEffect/effects/shortDoubleClickStrong', 'Short Double Click Strong')} 4 – 30 % `,
    `31) ${nls.localize('vuengine/editors/rumbleEffect/effects/shortDoubleClickMedium', 'Short Double Click Medium')} 1 – 100 % `,
    `32) ${nls.localize('vuengine/editors/rumbleEffect/effects/shortDoubleClickMedium', 'Short Double Click Medium')} 2 – 80 % `,
    `33) ${nls.localize('vuengine/editors/rumbleEffect/effects/shortDoubleClickMedium', 'Short Double Click Medium')} 3 – 60 % `,
    `34) ${nls.localize('vuengine/editors/rumbleEffect/effects/shortDoubleSharpTick', 'Short Double Sharp Tick')} 1 – 100 % `,
    `35) ${nls.localize('vuengine/editors/rumbleEffect/effects/shortDoubleSharpTick', 'Short Double Sharp Tick')} 2 – 80 % `,
    `36) ${nls.localize('vuengine/editors/rumbleEffect/effects/shortDoubleSharpTick', 'Short Double Sharp Tick')} 3 – 60 % `,
    `37) ${nls.localize('vuengine/editors/rumbleEffect/effects/longDoubleSharpClickStrong', 'Long Double Sharp Click Strong')} 1 – 100 % `,
    `38) ${nls.localize('vuengine/editors/rumbleEffect/effects/longDoubleSharpClickStrong', 'Long Double Sharp Click Strong')} 2 – 80 % `,
    `39) ${nls.localize('vuengine/editors/rumbleEffect/effects/longDoubleSharpClickStrong', 'Long Double Sharp Click Strong')} 3 – 60 % `,
    `40) ${nls.localize('vuengine/editors/rumbleEffect/effects/longDoubleSharpClickStrong', 'Long Double Sharp Click Strong')} 4 – 30 % `,
    `41) ${nls.localize('vuengine/editors/rumbleEffect/effects/longDoubleSharpClickMedium', 'Long Double Sharp Click Medium')} 1 – 100 % `,
    `42) ${nls.localize('vuengine/editors/rumbleEffect/effects/longDoubleSharpClickMedium', 'Long Double Sharp Click Medium')} 2 – 80 % `,
    `43) ${nls.localize('vuengine/editors/rumbleEffect/effects/longDoubleSharpClickMedium', 'Long Double Sharp Click Medium')} 3 – 60 % `,
    `44) ${nls.localize('vuengine/editors/rumbleEffect/effects/longDoubleSharpTick', 'Long Double Sharp Tick')} 1 – 100 % `,
    `45) ${nls.localize('vuengine/editors/rumbleEffect/effects/longDoubleSharpTick', 'Long Double Sharp Tick')} 2 – 80 % `,
    `46) ${nls.localize('vuengine/editors/rumbleEffect/effects/longDoubleSharpTick', 'Long Double Sharp Tick')} 3 – 60 % `,
    `47) ${nls.localize('vuengine/editors/rumbleEffect/effects/buzz', 'Buzz')} 1 – 100 % `,
    `48) ${nls.localize('vuengine/editors/rumbleEffect/effects/buzz', 'Buzz')} 2 – 80 % `,
    `49) ${nls.localize('vuengine/editors/rumbleEffect/effects/buzz', 'Buzz')} 3 – 60 % `,
    `50) ${nls.localize('vuengine/editors/rumbleEffect/effects/buzz', 'Buzz')} 4 – 40 % `,
    `51) ${nls.localize('vuengine/editors/rumbleEffect/effects/buzz', 'Buzz')} 5 – 20 % `,
    `52) ${nls.localize('vuengine/editors/rumbleEffect/effects/pulsingStrong', 'Pulsing Strong')} 1 – 100 % `,
    `53) ${nls.localize('vuengine/editors/rumbleEffect/effects/pulsingStrong', 'Pulsing Strong')} 2 – 60 % `,
    `54) ${nls.localize('vuengine/editors/rumbleEffect/effects/pulsingMedium', 'Pulsing Medium')} 1 – 100 % `,
    `55) ${nls.localize('vuengine/editors/rumbleEffect/effects/pulsingMedium', 'Pulsing Medium')} 2 – 60 % `,
    `56) ${nls.localize('vuengine/editors/rumbleEffect/effects/pulsingSharp', 'Pulsing Sharp')} 1 – 100 % `,
    `57) ${nls.localize('vuengine/editors/rumbleEffect/effects/pulsingSharp', 'Pulsing Sharp')} 2 – 60 % `,
    `58) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionClick', 'Transition Click')} 1 – 100 % `,
    `59) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionClick', 'Transition Click')} 2 – 80 % `,
    `60) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionClick', 'Transition Click')} 3 – 60 % `,
    `61) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionClick', 'Transition Click')} 4 – 40 % `,
    `62) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionClick', 'Transition Click')} 5 – 20 % `,
    `63) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionClick', 'Transition Click')} 6 – 10 % `,
    `64) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionHum', 'Transition Hum')} 1 – 100 % `,
    `65) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionHum', 'Transition Hum')} 2 – 80 % `,
    `66) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionHum', 'Transition Hum')} 3 – 60 % `,
    `67) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionHum', 'Transition Hum')} 4 – 40 % `,
    `68) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionHum', 'Transition Hum')} 5 – 20 % `,
    `69) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionHum', 'Transition Hum')} 6 – 10 % `,
    `70) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownLongSmooth', 'Transition Ramp Down Long Smooth')} 1 – 100 to 0 % `,
    `71) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownLongSmooth', 'Transition Ramp Down Long Smooth')} 2 – 100 to 0 % `,
    `72) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownMediumSmooth', 'Transition Ramp Down Medium Smooth')} 1 – 100 to 0 % `,
    `73) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownMediumSmooth', 'Transition Ramp Down Medium Smooth')} 2 – 100 to 0 % `,
    `74) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownShortSmooth', 'Transition Ramp Down Short Smooth')} 1 – 100 to 0 % `,
    `75) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownShortSmooth', 'Transition Ramp Down Short Smooth')} 2 – 100 to 0 % `,
    `76) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownLongSharp', 'Transition Ramp Down Long Sharp')} 1 – 100 to 0 % `,
    `77) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownLongSharp', 'Transition Ramp Down Long Sharp')} 2 – 100 to 0 % `,
    `78) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownMediumSharp', 'Transition Ramp Down Medium Sharp')} 1 – 100 to 0 % `,
    `79) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownMediumSharp', 'Transition Ramp Down Medium Sharp')} 2 – 100 to 0 % `,
    `80) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownShortSharp', 'Transition Ramp Down Short Sharp')} 1 – 100 to 0 % `,
    `81) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownShortSharp', 'Transition Ramp Down Short Sharp')} 2 – 100 to 0 % `,
    `82) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpLongSmooth', 'Transition Ramp Up Long Smooth')} 1 – 0 to 100 % `,
    `83) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpLongSmooth', 'Transition Ramp Up Long Smooth')} 2 – 0 to 100 % `,
    `84) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpMediumSmooth', 'Transition Ramp Up Medium Smooth')} 1 – 0 to 100 % `,
    `85) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpMediumSmooth', 'Transition Ramp Up Medium Smooth')} 2 – 0 to 100 % `,
    `86) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpShortSmooth', 'Transition Ramp Up Short Smooth')} 1 – 0 to 100 % `,
    `87) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpShortSmooth', 'Transition Ramp Up Short Smooth')} 2 – 0 to 100 % `,
    `88) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpLongSharp', 'Transition Ramp Up Long Sharp')} 1 – 0 to 100 % `,
    `89) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpLongSharp', 'Transition Ramp Up Long Sharp')} 2 – 0 to 100 % `,
    `90) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpMediumSharp', 'Transition Ramp Up Medium Sharp')} 1 – 0 to 100 % `,
    `91) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpMediumSharp', 'Transition Ramp Up Medium Sharp')} 2 – 0 to 100 % `,
    `92) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpShortSharp', 'Transition Ramp Up Short Sharp')} 1 – 0 to 100 % `,
    `93) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpShortSharp', 'Transition Ramp Up Short Sharp')} 2 – 0 to 100 % `,
    `94) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownLongSmooth', 'Transition Ramp Down Long Smooth')} 1 – 50 to 0 % `,
    `95) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownLongSmooth', 'Transition Ramp Down Long Smooth')} 2 – 50 to 0 % `,
    `96) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownMediumSmooth', 'Transition Ramp Down Medium Smooth')} 1 – 50 to 0 % `,
    `97) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownMediumSmooth', 'Transition Ramp Down Medium Smooth')} 2 – 50 to 0 % `,
    `98) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownShortSmooth', 'Transition Ramp Down Short Smooth')} 1 – 50 to 0 % `,
    `99) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownShortSmooth', 'Transition Ramp Down Short Smooth')} 2 – 50 to 0 % `,
    `100) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownLongSharp', 'Transition Ramp Down Long Sharp')} 1 – 50 to 0 % `,
    `101) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownLongSharp', 'Transition Ramp Down Long Sharp')} 2 – 50 to 0 % `,
    `102) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownMediumSharp', 'Transition Ramp Down Medium Sharp')} 1 – 50 to 0 % `,
    `103) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownMediumSharp', 'Transition Ramp Down Medium Sharp')} 2 – 50 to 0 % `,
    `104) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownShortSharp', 'Transition Ramp Down Short Sharp')} 1 – 50 to 0 % `,
    `105) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampDownShortSharp', 'Transition Ramp Down Short Sharp')} 2 – 50 to 0 % `,
    `106) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpLongSmooth', 'Transition Ramp Up Long Smooth')} 1 – 0 to 50 % `,
    `107) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpLongSmooth', 'Transition Ramp Up Long Smooth')} 2 – 0 to 50 % `,
    `108) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpMediumSmooth', 'Transition Ramp Up Medium Smooth')} 1 – 0 to 50 % `,
    `109) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpMediumSmooth', 'Transition Ramp Up Medium Smooth')} 2 – 0 to 50 % `,
    `110) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpShortSmooth', 'Transition Ramp Up Short Smooth')} 1 – 0 to 50 % `,
    `111) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpShortSmooth', 'Transition Ramp Up Short Smooth')} 2 – 0 to 50 % `,
    `112) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpLongSharp', 'Transition Ramp Up Long Sharp')} 1 – 0 to 50 % `,
    `113) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpLongSharp', 'Transition Ramp Up Long Sharp')} 2 – 0 to 50 % `,
    `114) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpMediumSharp', 'Transition Ramp Up Medium Sharp')} 1 – 0 to 50 % `,
    `115) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpMediumSharp', 'Transition Ramp Up Medium Sharp')} 2 – 0 to 50 % `,
    `116) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpShortSharp', 'Transition Ramp Up Short Sharp')} 1 – 0 to 50 % `,
    `117) ${nls.localize('vuengine/editors/rumbleEffect/effects/transitionRampUpShortSharp', 'Transition Ramp Up Short Sharp')} 2 – 0 to 50 % `,
    `118) ${nls.localize('vuengine/editors/rumbleEffect/effects/longBuzzForProgrammaticStopping', 'Long buzz for programmatic stopping')} – 100 % `,
    `119) ${nls.localize('vuengine/editors/rumbleEffect/effects/smoothHum', 'Smooth Hum {0} (No kick or brake pulse)', 1)} – 50 % `,
    `120) ${nls.localize('vuengine/editors/rumbleEffect/effects/smoothHum', 'Smooth Hum {0} (No kick or brake pulse)', 2)} – 40 % `,
    `121) ${nls.localize('vuengine/editors/rumbleEffect/effects/smoothHum', 'Smooth Hum {0} (No kick or brake pulse)', 3)} – 30 % `,
    `122) ${nls.localize('vuengine/editors/rumbleEffect/effects/smoothHum', 'Smooth Hum {0} (No kick or brake pulse)', 4)} – 20 % `,
    `123) ${nls.localize('vuengine/editors/rumbleEffect/effects/smoothHum', 'Smooth Hum {0} (No kick or brake pulse)', 5)} – 10 % `,
];
export const DEFAULT_RUMBLE_EFFECT = 1;

export const MIN_RUMBLE_EFFECT_BREAK = 0;
export const MAX_RUMBLE_EFFECT_BREAK = 255;
export const DEFAULT_RUMBLE_EFFECT_BREAK = MAX_RUMBLE_EFFECT_BREAK;
export const MIN_RUMBLE_EFFECT_OVERDRIVE = 0;
export const MAX_RUMBLE_EFFECT_OVERDRIVE = 126;
export const DEFAULT_RUMBLE_EFFECT_OVERDRIVE = MAX_RUMBLE_EFFECT_OVERDRIVE;
export const MIN_RUMBLE_EFFECT_SUSTAIN_NEGATIVE = 0;
export const MAX_RUMBLE_EFFECT_SUSTAIN_NEGATIVE = 255;
export const DEFAULT_RUMBLE_EFFECT_SUSTAIN_NEGATIVE = MAX_RUMBLE_EFFECT_SUSTAIN_NEGATIVE;
export const MIN_RUMBLE_EFFECT_SUSTAIN_POSITIVE = 0;
export const MAX_RUMBLE_EFFECT_SUSTAIN_POSITIVE = 255;
export const DEFAULT_RUMBLE_EFFECT_SUSTAIN_POSITIVE = MAX_RUMBLE_EFFECT_SUSTAIN_POSITIVE;
