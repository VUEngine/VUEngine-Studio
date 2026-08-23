/**
 * Physical controller input.
 *
 * Reads every connected gamepad through the Gamepad API and folds them into one
 * Virtual Boy key mask, so a second controller acts as a second pair of hands
 * on the same machine rather than doing nothing.
 *
 * The Virtual Boy's two D-pads have no direct equivalent on a modern
 * controller, so the left stick and D-pad both drive the left pad and the right
 * stick drives the right pad. A and B follow the Virtual Boy's physical
 * arrangement, where A is the rightmost of the two face buttons.
 */

import { VbKey } from '../common/ves-vb-constants';

/** Indices are the Gamepad API's "standard" layout. */
const BUTTON_TO_VB_KEY: Record<number, VbKey> = {
    0: VbKey.B,     // bottom face button
    1: VbKey.A,     // right face button
    4: VbKey.LT,    // left shoulder
    5: VbKey.RT,    // right shoulder
    6: VbKey.LT,    // left trigger
    7: VbKey.RT,    // right trigger
    8: VbKey.SEL,
    9: VbKey.STA,
    12: VbKey.LU,
    13: VbKey.LD,
    14: VbKey.LL,
    15: VbKey.LR,
};

/** Axis pairs, and the keys their negative and positive ends map to. */
const AXIS_TO_VB_KEYS: { axis: number, negative: VbKey, positive: VbKey }[] = [
    { axis: 0, negative: VbKey.LL, positive: VbKey.LR },
    { axis: 1, negative: VbKey.LU, positive: VbKey.LD },
    { axis: 2, negative: VbKey.RL, positive: VbKey.RR },
    { axis: 3, negative: VbKey.RU, positive: VbKey.RD },
];

/**
 * Deflection at which a stick counts as pressed. Generous, because the D-pad it
 * stands in for is a digital control and partial presses have no meaning.
 */
const AXIS_THRESHOLD = 0.5;

/** Buttons that report as analogue still need a digital answer. */
const BUTTON_THRESHOLD = 0.5;

export function readGamepadKeys(): number {
    // Not every environment exposes the API, and Electron returns a sparse
    // array with holes for disconnected slots.
    const gamepads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];

    let keys = 0;
    for (const gamepad of gamepads) {
        if (!gamepad) {
            continue;
        }

        for (const [index, key] of Object.entries(BUTTON_TO_VB_KEY)) {
            const button = gamepad.buttons[Number(index)];
            if (button && (button.pressed || button.value > BUTTON_THRESHOLD)) {
                keys |= key;
            }
        }

        for (const { axis, negative, positive } of AXIS_TO_VB_KEYS) {
            const value = gamepad.axes[axis];
            if (value === undefined) {
                continue;
            }
            if (value <= -AXIS_THRESHOLD) {
                keys |= negative;
            } else if (value >= AXIS_THRESHOLD) {
                keys |= positive;
            }
        }
    }

    return keys;
}
