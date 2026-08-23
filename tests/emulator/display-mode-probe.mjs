// Replays the fragment shader from ves-vb-renderer.ts in plain JS and asserts
// each rendering mode lands on the right source pixel and the right eye, and
// that a brightness resolves to the right palette colour. This validates the
// algorithms, not the compiled GLSL.
const W = 384, H = 224;
const OVERLAY = 0, SIDE_BY_SIDE = 1, CYBERSCOPE = 2, HLI = 3, VLI = 4;
const LEFT = 0, RIGHT = 1, BOTH = 2;      // VbEyes
const CYBERSCOPE_HALF = 256;
// VB_LEVEL_STOPS, see scripts/brightness-probe.mjs for where they come from.
const STOPS = [0, 105 / 255, 162 / 255, 250 / 255];

// Mirrors the shader: px/py are integer pixel coords with the origin top left.
// In OVERLAY the eye comes from the mode (uEyes), elsewhere from the position.
function map(layout, outW, outH, px, py, eyes = BOTH) {
    let src, eye;
    if (layout === OVERLAY) {
        src = [px, py]; eye = eyes;
    } else if (layout === SIDE_BY_SIDE) {
        eye = px >= W ? 1 : 0;
        src = [px - eye * W, py];
    } else if (layout === CYBERSCOPE) {
        eye = px >= CYBERSCOPE_HALF ? 1 : 0;
        src = [(px - eye * CYBERSCOPE_HALF) * (W / CYBERSCOPE_HALF), py];
    } else if (layout === HLI) {
        eye = py % 2;
        src = [px, Math.floor(py * 0.5)];
    } else {
        eye = px % 2;
        src = [Math.floor(px * 0.5), py];
    }
    return { src: [Math.floor(src[0]), Math.floor(src[1])], eye };
}

let failures = 0;
function check(label, actual, expected) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (!ok) failures++;
    console.log(`${ok ? 'ok  ' : 'FAIL'}  ${label}  ${JSON.stringify(actual)}${ok ? '' : ' expected ' + JSON.stringify(expected)}`);
}

console.log('=== OVERLAY (384x224) ===');
check('left eye only takes the left eye everywhere', map(OVERLAY, W, H, 0, 0, LEFT), { src: [0, 0], eye: LEFT });
check('right eye only takes the right eye everywhere', map(OVERLAY, W, H, 0, 0, RIGHT), { src: [0, 0], eye: RIGHT });
check('anaglyph takes both at one pixel', map(OVERLAY, W, H, 0, 0, BOTH), { src: [0, 0], eye: BOTH });
check('bottom-right maps to last source pixel', map(OVERLAY, W, H, 383, 223, LEFT), { src: [383, 223], eye: LEFT });

console.log('\n=== SIDE_BY_SIDE (768x224) ===');
check('left half is the left eye', map(SIDE_BY_SIDE, W * 2, H, 0, 0), { src: [0, 0], eye: 0 });
check('last column of left half', map(SIDE_BY_SIDE, W * 2, H, 383, 0), { src: [383, 0], eye: 0 });
check('right half restarts on the right eye', map(SIDE_BY_SIDE, W * 2, H, 384, 0), { src: [0, 0], eye: 1 });
check('last column of right half', map(SIDE_BY_SIDE, W * 2, H, 767, 223), { src: [383, 223], eye: 1 });

console.log('\n=== CYBERSCOPE (512x224, each eye squeezed to 256) ===');
check('left eye starts at source 0', map(CYBERSCOPE, 512, H, 0, 0), { src: [0, 0], eye: 0 });
check('left eye ends near source 383', map(CYBERSCOPE, 512, H, 255, 0), { src: [382, 0], eye: 0 });
check('right eye restarts at source 0', map(CYBERSCOPE, 512, H, 256, 0), { src: [0, 0], eye: 1 });
check('right eye ends near source 383', map(CYBERSCOPE, 512, H, 511, 0), { src: [382, 0], eye: 1 });

console.log('\n=== HLI (384x448, alternating rows) ===');
check('row 0 is the left eye, source row 0', map(HLI, W, H * 2, 0, 0), { src: [0, 0], eye: 0 });
check('row 1 is the right eye, same source row', map(HLI, W, H * 2, 0, 1), { src: [0, 0], eye: 1 });
check('row 2 advances the source row', map(HLI, W, H * 2, 0, 2), { src: [0, 1], eye: 0 });
check('last row is the right eye, source row 223', map(HLI, W, H * 2, 383, 447), { src: [383, 223], eye: 1 });

console.log('\n=== VLI (768x224, alternating columns) ===');
check('column 0 is the left eye, source column 0', map(VLI, W * 2, H, 0, 0), { src: [0, 0], eye: 0 });
check('column 1 is the right eye, same source column', map(VLI, W * 2, H, 1, 0), { src: [0, 0], eye: 1 });
check('column 2 advances the source column', map(VLI, W * 2, H, 2, 0), { src: [1, 0], eye: 0 });
check('last column is the right eye, source column 383', map(VLI, W * 2, H, 767, 223), { src: [383, 223], eye: 1 });

console.log('\n=== Y flip (shader computes py = outputHeight - gl_FragCoord.y) ===');
const pyTop = Math.floor(H - (H - 0.5));      // top row of the output
const pyBottom = Math.floor(H - 0.5);         // bottom row of the output
check('top output row reads source row 0', pyTop, 0);
check('bottom output row reads source row 223', pyBottom, H - 1);

// Mirrors the shader's shade(): the palette's colour for a brightness, exact at
// the stops and interpolated in between.
function shade(palette, brightness) {
    const mix = (a, b, t) => Math.round(a + (b - a) * t);
    if (brightness <= STOPS[1]) {
        return mix(palette[0], palette[1], brightness / STOPS[1]);
    }
    if (brightness <= STOPS[2]) {
        return mix(palette[1], palette[2], (brightness - STOPS[1]) / (STOPS[2] - STOPS[1]));
    }
    return mix(palette[2], palette[3], Math.min((brightness - STOPS[2]) / (STOPS[3] - STOPS[2]), 1));
}

console.log('\n=== Palette shading (one channel of a four-colour palette) ===');
const palette = [0x00, 0x55, 0xaa, 0xff];
check('unlit pixels are the first colour', shade(palette, 0), 0x00);
check('level 1 is exactly the second colour', shade(palette, STOPS[1]), 0x55);
check('level 2 is exactly the third colour', shade(palette, STOPS[2]), 0xaa);
check('level 3 is exactly the fourth colour', shade(palette, STOPS[3]), 0xff);
check('a fully saturated pixel holds at the fourth colour', shade(palette, 1), 0xff);
// A dimmed display, measured by brightness-probe.mjs at BRTA/B/C of 24/48/24.
check('a dimmed level 3 sits between the third and fourth colours', shade(palette, 209 / 255), 0xd7);
check('a dimmed level 1 sits between the first and second colours', shade(palette, 88 / 255), 0x47);

console.log(`\n${failures === 0 ? 'All rendering mode mappings correct.' : failures + ' FAILURES'}`);
process.exit(failures === 0 ? 0 : 1);
