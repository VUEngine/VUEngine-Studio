// Checks the VIP inspector's decoders against independently encoded data, and
// then against a real game's live VRAM.
//
// The decoders under test come from the shipped
// lib/emulator/browser/panels/ves-emulator-vip-memory.js, so this exercises the
// real implementation. The encoding side here is written from the hardware
// headers in applications/electron/vb/libgccvb/source/ rather than from the
// decoder, so agreement means both agree with the hardware documentation.
//
// Usage: node scripts/vip-decode-probe.mjs [path/to/rom.vb]
import fs from 'fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const vip = require('../../extensions/vuengine-studio-extension/lib/emulator/browser/panels/ves-emulator-vip-memory.js');

let failures = 0;

function check(label, actual, expected) {
    const ok = Object.is(actual, expected);
    if (!ok) {
        failures++;
        console.log(`  FAIL ${label}: got ${actual}, expected ${expected}`);
    }
    return ok;
}

function section(name) {
    console.log(`\n${name}`);
}

// --- Constants from libgccvb ------------------------------------------------

// world.h
const WRLD_LON = 0x8000, WRLD_RON = 0x4000, WRLD_HBIAS = 0x1000;
const WRLD_OBJ = 0x3000, WRLD_AFFINE = 0x2000;
const WRLD_1x1 = 0x0000, WRLD_1x2 = 0x0100, WRLD_2x1 = 0x0400, WRLD_2x2 = 0x0500;
const WRLD_2x4 = 0x0600, WRLD_4x1 = 0x0800, WRLD_8x1 = 0x0c00;
const WRLD_OVR = 0x0080, WRLD_END = 0x0040;
// bgmap.h
const BGM_PAL2 = 0x8000, BGM_HFLIP = 0x2000, BGM_VFLIP = 0x1000;
// object.h
const JLON = 0x8000, JRON = 0x4000;

// --- Worlds -----------------------------------------------------------------

section('World attributes');
{
    const buffer = new ArrayBuffer(vip.VIP_WORLD_BYTES);
    const view = new DataView(buffer);
    const put = (halfword, value) => view.setUint16(halfword * 2, value & 0xffff, true);

    put(0, WRLD_LON | WRLD_RON | WRLD_HBIAS | WRLD_2x4 | WRLD_OVR | WRLD_END | 5);
    put(1, -100);   // gx, off the left edge
    put(2, 3);      // gp
    put(3, 50);     // gy
    put(4, 8);      // mx
    put(5, -2);     // mp
    put(6, 16);     // my
    put(7, 383);    // w, which the hardware reads as 384 wide
    put(8, 223);
    put(9, 0x0120); // param
    put(10, 0x0007); // overplane cell

    const world = vip.decodeVipWorld(view, 7);
    check('index', world.index, 7);
    check('lon', world.lon, true);
    check('ron', world.ron, true);
    check('mode', world.mode, 1);          // HBIAS
    check('scx', world.scx, 2);            // WRLD_2x4 is 2 across
    check('scy', world.scy, 4);            // and 4 down
    check('overplane', world.overplane, true);
    check('end', world.end, true);
    check('bgMap', world.bgMap, 5);
    check('gx sign-extended', world.gx, -100);
    check('gp', world.gp, 3);
    check('gy', world.gy, 50);
    check('mx', world.mx, 8);
    check('mp sign-extended', world.mp, -2);
    check('my', world.my, 16);
    check('w', world.w, 383);
    check('h', world.h, 223);
    check('param', world.param, 0x0120);
    check('overplaneCell', world.overplaneCell, 0x0007);

    // A cleared entry is the common case and must not read as enabled.
    const blank = vip.decodeVipWorld(new DataView(new ArrayBuffer(vip.VIP_WORLD_BYTES)), 0);
    check('blank lon', blank.lon, false);
    check('blank ron', blank.ron, false);
    check('blank mode', blank.mode, 0);
    check('blank scx', blank.scx, 1);
}

section('World addresses');
check('world 0', vip.vipWorldAddress(0), 0x0003d800);
check('world 31', vip.vipWorldAddress(31), 0x0003d800 + 31 * 0x20);

/** One decoded world, from the halfwords world.h lays out. */
function makeWorld(fields = {}, index = 31) {
    const { head = 0, gx = 0, gp = 0, gy = 0, mx = 0, mp = 0, my = 0, w = 0, h = 0, param = 0, ovr = 0 } = fields;
    const view = new DataView(new ArrayBuffer(vip.VIP_WORLD_BYTES));
    const put = (halfword, value) => view.setUint16(halfword * 2, value & 0xffff, true);
    [head, gx, gp, gy, mx, mp, my, w, h, param, ovr].forEach((value, halfword) => put(halfword, value));
    return vip.decodeVipWorld(view, index);
}

section('World head encoding');
{
    // The panel writes an edited world back through this, so it has to produce
    // exactly the header world.h describes.
    const head = WRLD_LON | WRLD_RON | WRLD_HBIAS | WRLD_2x4 | WRLD_OVR | WRLD_END | 5;
    check('round trip', vip.encodeVipWorldHead(makeWorld({ head })), head);
    check('blank round trip', vip.encodeVipWorldHead(makeWorld({})), 0);
    check('1x1', vip.encodeVipWorldHead(makeWorld({ head: WRLD_1x1 })), WRLD_1x1);
    check('8x1', vip.encodeVipWorldHead(makeWorld({ head: WRLD_8x1 })), WRLD_8x1);
    check('affine', vip.encodeVipWorldHead(makeWorld({ head: WRLD_AFFINE })), WRLD_AFFINE);
    check('object', vip.encodeVipWorldHead(makeWorld({ head: WRLD_OBJ })), WRLD_OBJ);
    check('map 15', vip.encodeVipWorldHead(makeWorld({ head: 0x000f })), 0x000f);
    // Bits 5 and 4 belong to no documented field and are written as zero.
    check('undocumented bits dropped', vip.encodeVipWorldHead(makeWorld({ head: 0x0030 })), 0);
}

// --- Param tables -----------------------------------------------------------

section('Param tables');
{
    // WORLD_PARAM stores (address - 0x20000) >> 1, so this is its inverse.
    check('param 0', vip.vipParamTableAddress(0), 0x00020000);
    check('param 0x1000', vip.vipParamTableAddress(0x1000), 0x00022000);

    // An H-bias entry is one halfword per eye; an affine entry is 8 halfwords,
    // of which affine.c writes XSrc, Prlx, YSrc and XScl.
    const params = new DataView(new ArrayBuffer(2 * vip.VIP_AFFINE_ENTRY_BYTES));
    const put = (halfword, value) => params.setUint16(halfword * 2, value & 0xffff, true);
    put(0, -3); put(1, 5);
    check('hbias left', vip.decodeVipHBias(params, 0).left, -3);
    check('hbias right', vip.decodeVipHBias(params, 0).right, 5);
    check('hbias row 1 is four bytes on', vip.decodeVipHBias(params, 1).left, 0);
    check('hbias stride', vip.VIP_HBIAS_ENTRY_BYTES, 4);

    [8, 16, 24, 32, 40].forEach((value, halfword) => put(halfword, value));
    const affine = vip.decodeVipAffine(params, 0);
    check('affine mx', affine.mx, 8);
    check('affine mp', affine.mp, 16);
    check('affine my', affine.my, 24);
    check('affine dx', affine.dx, 32);
    check('affine dy', affine.dy, 40);
    check('affine stride', vip.VIP_AFFINE_ENTRY_BYTES, 16);
    // ParamTableManager allocates rows * 16 bytes for affine, rows * 4 for hbias.
    check('affine row 1', vip.decodeVipAffine(params, 1).mx, 0);

    // One row per row of the world, but never more than a screen's worth.
    check('bgmap worlds have no table', vip.vipParamRows(makeWorld({ h: 100 })), 0);
    check('hbias rows', vip.vipParamRows(makeWorld({ head: WRLD_HBIAS, h: 23 })), 24);
    check('rows cap at the screen', vip.vipParamRows(makeWorld({ head: WRLD_HBIAS, h: 0xffff })), 224);
    check('hbias bytes', vip.vipParamTableBytes(makeWorld({ head: WRLD_HBIAS, h: 23 })), 24 * 4);
    check('affine bytes', vip.vipParamTableBytes(makeWorld({ head: WRLD_AFFINE, h: 23 })), 24 * 16);
    // A table pointed past BGMap memory is clamped rather than read out of it.
    check('clamped at the end of BGMap memory',
        vip.vipParamTableBytes(makeWorld({ head: WRLD_HBIAS, h: 223, param: 0xfff0 })), 0);
}

// --- BGMap cells ------------------------------------------------------------

section('BGMap cells');
{
    const cell = vip.decodeVipBgMapCell(BGM_PAL2 | BGM_HFLIP | 0x123);
    check('char', cell.char, 0x123);
    check('palette', cell.palette, 2);
    check('hFlip', cell.hFlip, true);
    check('vFlip', cell.vFlip, false);

    const flipped = vip.decodeVipBgMapCell(BGM_VFLIP | 0x7ff);
    check('vFlip', flipped.vFlip, true);
    check('hFlip', flipped.hFlip, false);
    check('max char', flipped.char, 0x7ff);
    // Bit 11 is not part of the character number.
    check('bit 11 ignored', vip.decodeVipBgMapCell(0x0800).char, 0);

    // encodeVipBgMapCell is the inverse, used to write an edited cell back.
    check('encode', vip.encodeVipBgMapCell(cell), BGM_PAL2 | BGM_HFLIP | 0x123);
    check('encode round-trips through decode', vip.decodeVipBgMapCell(vip.encodeVipBgMapCell(flipped)).char, flipped.char);
    // Bit 11 is written as zero rather than preserved.
    check('encode zeroes bit 11', vip.encodeVipBgMapCell({ char: 0x7ff, palette: 3, hFlip: true, vFlip: true }) & 0x0800, 0);
}

section('BGMap addresses');
check('segment 0', vip.vipBgMapAddress(0), 0x00020000);
check('segment 13', vip.vipBgMapAddress(13), 0x00020000 + 13 * 0x2000);

section('BGMap segment use');
{
    /** A full world table, with the given worlds patched into it. */
    const table = patches => Array.from({ length: vip.VIP_WORLD_COUNT }, (unused, index) =>
        makeWorld(index in patches ? { head: WRLD_LON | WRLD_RON, ...patches[index] } : {}, index));

    // Drawing runs 31 downwards and stops at END, which is not drawn either.
    let worlds = table({ 31: {}, 30: { head: WRLD_RON }, 29: { head: 0 }, 28: { head: WRLD_END }, 27: {} });
    check('drawn worlds', vip.vipDrawnWorlds(worlds).map(w => w.index).join(), '31,30');
    // The rest of the table is blank entries, which decode as 1x1 BGMap worlds
    // on segment 0 and must not be counted as using it.
    check('blank worlds do not use segment 0', vip.vipBgMapSegmentUses(worlds)[0].worlds.join(), '31,30');

    worlds = table({ 31: { head: WRLD_LON | WRLD_RON | WRLD_2x2 | 3 }, 30: { head: WRLD_END } });
    let uses = vip.vipBgMapSegmentUses(worlds);
    check('2x2 spans four segments', uses.map(u => (u.worlds.length ? 1 : 0)).join(''), '00011110000000');

    worlds = table({ 31: { head: WRLD_LON | WRLD_OBJ | 5 }, 30: { head: WRLD_END } });
    check('object worlds have no map', vip.vipBgMapSegmentUses(worlds)[5].worlds.length, 0);

    // Segment numbers are four bits, so a world running off the end wraps; 14
    // and 15 are world attribute and object memory rather than map data.
    worlds = table({ 31: { head: WRLD_LON | WRLD_4x1 | 13 }, 30: { head: WRLD_END } });
    uses = vip.vipBgMapSegmentUses(worlds);
    check('segments listed', uses.length, vip.VIP_BGMAP_COUNT);
    check('the real segment', uses[13].worlds.join(), '31');
    check('and the wrapped one', uses[0].worlds.join(), '31');

    // An H-bias table of 224 rows fits inside one segment; an affine one of the
    // same height is four times the size and straddles two.
    worlds = table({ 31: { head: WRLD_LON | WRLD_HBIAS, h: 223, param: 0x1000 }, 30: { head: WRLD_END } });
    uses = vip.vipBgMapSegmentUses(worlds);
    check('hbias table segment', uses[1].params.join(), '31');
    check('and no further', uses[2].params.length, 0);
    check('a param table is not a map', uses[1].worlds.length, 0);

    worlds = table({ 31: { head: WRLD_LON | WRLD_AFFINE, h: 223, param: 0x1f80 }, 30: { head: WRLD_END } });
    uses = vip.vipBgMapSegmentUses(worlds);
    check('affine table starts in segment 1', uses[1].params.join(), '31');
    check('and ends in segment 2', uses[2].params.join(), '31');
    check('but not segment 3', uses[3].params.length, 0);
}

// --- Objects ----------------------------------------------------------------

section('Objects');
{
    const buffer = new ArrayBuffer(vip.VIP_OBJECT_BYTES);
    const view = new DataView(buffer);
    const put = (halfword, value) => view.setUint16(halfword * 2, value & 0xffff, true);

    put(0, -5);                       // jx, 10 bits signed
    put(1, JLON | (-300 & 0x3fff));   // jp, 14 bits signed, left eye only
    put(2, 200);                      // jy
    put(3, (3 << 14) | 0x2000 | 0x2ab); // palette 3, hflip, char

    const object = vip.decodeVipObject(view, 12);
    check('index', object.index, 12);
    check('jx sign-extended', object.jx, -5);
    check('jp sign-extended', object.jp, -300);
    check('jy', object.jy, 200);
    check('char', object.char, 0x2ab);
    check('palette', object.palette, 3);
    check('hFlip', object.hFlip, true);
    check('vFlip', object.vFlip, false);
    check('lon', object.lon, true);
    check('ron', object.ron, false);
    check('visible', vip.isVipObjectVisible(object), true);

    put(1, JRON);
    const right = vip.decodeVipObject(view, 0);
    check('ron only', right.ron && !right.lon, true);

    put(1, 0);
    check('neither eye is invisible', vip.isVipObjectVisible(vip.decodeVipObject(view, 0)), false);
}

section('Object encoding');
{
    // The panel writes an edited object back through this, so it has to
    // produce exactly the four halfwords object.h describes.
    const buffer = new ArrayBuffer(vip.VIP_OBJECT_BYTES);
    const view = new DataView(buffer);
    const put = (halfword, value) => view.setUint16(halfword * 2, value & 0xffff, true);
    put(0, -5);
    put(1, JLON | JRON | (-300 & 0x3fff));
    put(2, 200);
    put(3, (3 << 14) | 0x2000 | 0x1000 | 0x2ab);

    const object = vip.decodeVipObject(view, 12);
    const encoded = vip.encodeVipObject(object);
    check('jx round trip', encoded[0], -5 & 0x03ff);
    check('jp and eyes round trip', encoded[1], (JLON | JRON | (-300 & 0x3fff)) & 0xffff);
    check('jy round trip', encoded[2], 200);
    check('character round trip', encoded[3], (3 << 14) | 0x2000 | 0x1000 | 0x2ab);
    // Re-decoding an encoded object gives back what it started as.
    encoded.forEach((halfword, index) => put(index, halfword));
    const again = vip.decodeVipObject(view, 12);
    check('jx', again.jx, object.jx);
    check('jp', again.jp, object.jp);
    check('jy', again.jy, object.jy);
    check('char', again.char, object.char);
    check('palette', again.palette, object.palette);
    check('flips', `${again.hFlip}${again.vFlip}`, `${object.hFlip}${object.vFlip}`);
    check('eyes', `${again.lon}${again.ron}`, `${object.lon}${object.ron}`);

    // The bits no field accounts for are written as zero rather than kept.
    put(0, 0xfc00); put(2, 0xff00); put(3, 0x0800);
    const spare = vip.encodeVipObject(vip.decodeVipObject(view, 0));
    check('spare jx bits dropped', spare[0], 0);
    check('spare jy bits dropped', spare[2], 0);
    check('spare character bit dropped', spare[3] & 0x0800, 0);
}

// --- Characters -------------------------------------------------------------

section('Character pixels');
{
    // One 8x8 character whose top row counts 0,1,2,3,0,1,2,3 left to right.
    const segment = new Uint8Array(vip.VIP_CHAR_SEGMENT_BYTES);
    let row = 0;
    for (let x = 0; x < 8; x++) {
        row |= (x & 3) << (x * 2);
    }
    segment[0] = row & 0xff;
    segment[1] = (row >> 8) & 0xff;

    const characters = new vip.VipCharacters([segment, undefined, undefined, undefined]);
    for (let x = 0; x < 8; x++) {
        check(`pixel ${x}`, characters.pixel(0, x, 0), x & 3);
    }
    check('untouched row', characters.pixel(0, 0, 1), 0);
    check('missing segment reads blank', characters.pixel(1024, 0, 0), 0);

    // Characters are indexed across segments, 512 to a segment.
    const second = new Uint8Array(vip.VIP_CHAR_SEGMENT_BYTES);
    second[0] = 0x03; // character 512, top-left pixel is 3
    const across = new vip.VipCharacters([segment, second, undefined, undefined]);
    check('segment 1 char 512', across.pixel(512, 0, 0), 3);
    check('segment 0 unaffected', across.pixel(0, 1, 0), 1);
}

section('Character addresses');
check('segment 0', vip.vipCharSegmentAddress(0), 0x00006000);
check('segment 1', vip.vipCharSegmentAddress(1), 0x0000e000);
check('segment 2', vip.vipCharSegmentAddress(2), 0x00016000);
check('segment 3', vip.vipCharSegmentAddress(3), 0x0001e000);

// Real hardware does not fully decode VIP addresses, so each 0x2000-byte
// character table also repeats starting at 0x00078000.
check('mirror 0', vip.vipCharMirrorAddress(0), 0x00078000);
check('mirror 1', vip.vipCharMirrorAddress(1), 0x0007a000);
check('mirror 2', vip.vipCharMirrorAddress(2), 0x0007c000);
check('mirror 3', vip.vipCharMirrorAddress(3), 0x0007e000);
// Character 67 sits at segment 0, offset 67*16 = 0x430 into it.
check('char 67 address', vip.vipCharSegmentAddress(0) + 67 * vip.VIP_CHAR_BYTES, 0x00006430);
check('char 67 mirror', vip.vipCharMirrorAddress(0) + 67 * vip.VIP_CHAR_BYTES, 0x00078430);

// --- World maps and drawing --------------------------------------------------

/** Character memory holding three characters the checks below can tell apart. */
function makeCharacters() {
    const segment = new Uint8Array(vip.VIP_CHAR_SEGMENT_BYTES);
    const setPixel = (char, x, y, value) => {
        const offset = char * vip.VIP_CHAR_BYTES + y * 2;
        const row = (segment[offset] | (segment[offset + 1] << 8)) | (value << (x * 2));
        segment[offset] = row & 0xff;
        segment[offset + 1] = row >> 8;
    };
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            setPixel(1, x, y, 3);   // character 1 is solid
        }
    }
    setPixel(2, 0, 0, 1);           // character 2 marks its top left
    setPixel(3, 7, 0, 2);           // character 3 marks its top right
    return new vip.VipCharacters([segment, undefined, undefined, undefined]);
}

/** One 8 KB segment, from a list of [cell index, cell halfword] pairs. */
function makeSegment(cells) {
    const bytes = new Uint8Array(vip.VIP_BGMAP_BYTES);
    const view = new DataView(bytes.buffer);
    for (const [index, value] of cells) {
        view.setUint16(index * 2, value & 0xffff, true);
    }
    return bytes;
}

const RAMP = [[0, 85, 170, 255], [0, 85, 170, 255], [0, 85, 170, 255], [0, 85, 170, 255]];

section('World maps');
{
    const characters = makeCharacters();
    // Cell 0 is character 2, cell 1 is character 3 flipped horizontally.
    const first = makeSegment([[0, 2], [1, BGM_HFLIP | 3]]);
    // A second segment of nothing but the solid character.
    const solid = makeSegment(Array.from({ length: vip.VIP_BGMAP_CELLS ** 2 }, (unused, i) => [i, 1]));
    const map = (fields = {}) => new vip.VipWorldMap(
        makeWorld({ head: WRLD_LON | WRLD_RON, ...fields }), [first, solid], characters
    );

    let sample = map();
    check('character pixel', sample.intensity(0, 0, RAMP), 85);
    check('blank pixel', sample.intensity(1, 0, RAMP), 0);
    check('flipped cell', sample.intensity(8, 0, RAMP), 170);
    check('flipped cell, other end', sample.intensity(15, 0, RAMP), 0);
    // A 1x1 map is 512 pixels square and repeats outside that, in both
    // directions — a world scrolled past its origin reads negative.
    check('wraps right', sample.intensity(512, 0, RAMP), 85);
    check('wraps down', sample.intensity(0, 512, RAMP), 85);
    check('wraps left', sample.intensity(-512, 0, RAMP), 85);
    check('wraps onto the flipped cell', sample.intensity(-504, -512, RAMP), 170);

    check('second segment across', map({ head: WRLD_2x1 }).intensity(512, 0, RAMP), 255);
    check('and wraps after both', map({ head: WRLD_2x1 }).intensity(1024, 0, RAMP), 85);
    check('second segment down', map({ head: WRLD_1x2 }).intensity(0, 512, RAMP), 255);

    // With the overplane flag, outside the map is one repeated cell instead.
    sample = map({ head: WRLD_LON | WRLD_OVR, ovr: 2 });
    check('inside the map is unaffected', sample.intensity(0, 0, RAMP), 85);
    check('outside draws the overplane cell', sample.intensity(512, 0, RAMP), 85);
    check('which is one character, not a map', sample.intensity(513, 0, RAMP), 0);
    check('on the negative side too', sample.intensity(-8, 0, RAMP), 85);

    // A segment the caller has not read is blank rather than an error.
    check('unread segment', new vip.VipWorldMap(makeWorld({ head: 7 }), [first], characters).intensity(0, 0, RAMP), 0);
}

section('World drawing');
{
    const characters = makeCharacters();
    const solid = makeSegment(Array.from({ length: vip.VIP_BGMAP_CELLS ** 2 }, (unused, i) => [i, 1]));
    const W = vip.VIP_FRAME_BUFFER_WIDTH, H = vip.VIP_FRAME_BUFFER_HEIGHT;
    /** Draw one world and return an accessor for the red channel. */
    const draw = (world, eye = 'left', params, segments = [solid]) => {
        const pixels = new Uint8ClampedArray(W * H * 4);
        vip.drawVipWorld(pixels, W, H, world, new vip.VipWorldMap(world, segments, characters), RAMP, eye, params);
        return (x, y) => pixels[(y * W + x) * 4];
    };

    // W and H are sizes minus one, so a 16x8 world at (100, 50) covers
    // 100-115 by 50-57 — and vipWorldExtents, which draws the preview's
    // outline, has to agree with that to the pixel.
    let world = makeWorld({ head: WRLD_LON | WRLD_RON, gx: 100, gy: 50, w: 15, h: 7 });
    let at = draw(world);
    const extents = vip.vipWorldExtents(world, 'left');
    check('extents x', extents.x, 100);
    check('extents width', extents.width, 16);
    check('extents height', extents.height, 8);
    check('first pixel drawn', at(extents.x, extents.y), 255);
    check('last pixel drawn', at(extents.x + extents.width - 1, extents.y + extents.height - 1), 255);
    check('one pixel left is not', at(99, 50), 0);
    check('one pixel right is not', at(116, 50), 0);
    check('one row below is not', at(100, 58), 0);

    // Parallax moves the two eyes in opposite directions.
    world = makeWorld({ head: WRLD_LON | WRLD_RON, gx: 100, gp: 8, gy: 50, w: 15, h: 7 });
    check('left eye shifts left', draw(world, 'left')(92, 50), 255);
    check('left eye is not to the right', draw(world, 'left')(108, 50), 0);
    check('right eye shifts right', draw(world, 'right')(108, 50), 255);
    check('right extents', vip.vipWorldExtents(world, 'right').x, 108);

    // Clipping: partly off screen draws what fits, wholly off draws nothing,
    // and a garbage size is bounded by the screen rather than by W and H.
    at = draw(makeWorld({ head: WRLD_LON, gx: -10, w: 19 }));
    check('the visible half', at(0, 0), 255);
    check('up to the world edge', at(9, 0), 255);
    check('and no further', at(10, 0), 0);
    check('off the right edge', draw(makeWorld({ head: WRLD_LON, gx: 400, w: 15, h: 7 }))(383, 0), 0);
    check('below the screen', draw(makeWorld({ head: WRLD_LON, gy: 300, w: 15, h: 7 }))(0, 223), 0);
    const started = Date.now();
    check('an oversized world fills the screen',
        draw(makeWorld({ head: WRLD_LON, w: 0xffff, h: 0xffff }))(383, 223), 255);
    check('bounded by the screen', Date.now() - started < 500, true);

    // H-bias shifts each row's source, per eye. Against a map with one drawn
    // cell, a shift of 8 moves the row off it.
    const sparse = makeSegment([[0, 1]]);
    const hbias = new DataView(new ArrayBuffer(2 * vip.VIP_HBIAS_ENTRY_BYTES));
    hbias.setInt16(0, 0, true); hbias.setInt16(2, 8, true);   // row 0: left 0, right +8
    hbias.setInt16(4, 8, true); hbias.setInt16(6, 0, true);   // row 1: left +8, right 0
    world = makeWorld({ head: WRLD_LON | WRLD_RON | WRLD_HBIAS, w: 7, h: 1 });
    at = draw(world, 'left', hbias, [sparse]);
    check('left eye, unshifted row', at(0, 0), 255);
    check('left eye, shifted row', at(0, 1), 0);
    at = draw(world, 'right', hbias, [sparse]);
    check('right eye, shifted row', at(0, 0), 0);
    check('right eye, unshifted row', at(0, 1), 255);

    // An affine row brings its own source origin, in 13.3 fixed point, and its
    // own step along the row in 7.9 — the world's own MX/MY are not used.
    const affine = new DataView(new ArrayBuffer(2 * vip.VIP_AFFINE_ENTRY_BYTES));
    affine.setInt16(0, 0, true); affine.setInt16(6, 1 << 9, true);          // row 0: origin 0, dx 1.0
    affine.setInt16(16, 8 << 3, true); affine.setInt16(22, 1 << 9, true);   // row 1: origin x 8
    world = makeWorld({ head: WRLD_LON | WRLD_AFFINE, mx: 1000, my: 1000, w: 7, h: 1 });
    at = draw(world, 'left', affine, [sparse]);
    check('affine ignores MX/MY', at(0, 0), 255);
    check('and steps along the row', at(7, 0), 255);
    check('a row starting past the cell', at(0, 1), 0);

    // An object world's pixels come from OAM, so there is nothing to draw here.
    check('object world', draw(makeWorld({ head: WRLD_LON | WRLD_OBJ, w: 15, h: 7 }))(0, 0), 0);
}

section('Object drawing');
{
    const characters = makeCharacters();
    const W = vip.VIP_FRAME_BUFFER_WIDTH, H = vip.VIP_FRAME_BUFFER_HEIGHT;
    const RAMP_ONE = [0, 85, 170, 255];
    /** Draw one object and return an accessor for the red channel. */
    const draw = (fields, eye = 'left') => {
        const pixels = new Uint8ClampedArray(W * H * 4);
        const object = { index: 0, jx: 0, jp: 0, jy: 0, char: 1, palette: 0, hFlip: false, vFlip: false, lon: true, ron: true, ...fields };
        vip.drawVipObject(pixels, W, H, object, characters, RAMP_ONE, eye);
        return (x, y) => pixels[(y * W + x) * 4];
    };

    // Character 1 is solid, so its eight by eight lands whole at the position.
    let at = draw({ jx: 100, jy: 50 });
    check('top left', at(100, 50), 255);
    check('bottom right', at(107, 57), 255);
    check('one pixel left is untouched', at(99, 50), 0);
    check('one row below is untouched', at(100, 58), 0);

    // Parallax moves the two eyes in opposite directions.
    check('left eye', draw({ jx: 100, jp: 8, jy: 50 }, 'left')(92, 50), 255);
    check('right eye', draw({ jx: 100, jp: 8, jy: 50 }, 'right')(108, 50), 255);

    // Clipping: an object hanging off an edge draws only the part on screen,
    // and one entirely off it draws nothing without running past the buffer.
    at = draw({ jx: -4, jy: 0 });
    check('half off the left edge', at(0, 0), 255);
    check('and nothing wrapped to the right edge', at(W - 1, 0), 0);
    check('off the right edge', draw({ jx: W - 2, jy: 0 })(W - 1, 0), 255);
    check('past the right edge', draw({ jx: W + 8, jy: 0 })(0, 0), 0);
    check('past the bottom', draw({ jx: 0, jy: H + 1 })(0, H - 1), 0);

    // Character 3 marks its top right pixel, so a flip is visible.
    check('unflipped', draw({ char: 3, jx: 0, jy: 0 })(7, 0), 170);
    check('h-flipped', draw({ char: 3, jx: 0, jy: 0, hFlip: true })(0, 0), 170);
    check('v-flipped moves it down', draw({ char: 3, jx: 0, jy: 0, vFlip: true })(7, 7), 170);
}

// --- Frame buffers ------------------------------------------------------------

section('Frame buffer pixels');
{
    const bytes = new Uint8Array(vip.VIP_FRAME_BUFFER_BYTES);
    // Column 5, rows 0-3 packed into its first byte: values 0,1,2,3 low to high.
    const byteOffset = 5 * vip.VIP_FRAME_BUFFER_BYTES_PER_COLUMN;
    bytes[byteOffset] = 0b11100100;
    const fb = new vip.VipFrameBuffer(bytes);
    check('row 0', fb.pixel(5, 0), 0);
    check('row 1', fb.pixel(5, 1), 1);
    check('row 2', fb.pixel(5, 2), 2);
    check('row 3', fb.pixel(5, 3), 3);
    check('next byte, row 4', fb.pixel(5, 4), 0);
    check('other column untouched', fb.pixel(4, 0), 0);
    check('missing buffer reads blank', new vip.VipFrameBuffer(undefined).pixel(0, 0), 0);
    check('last pixel in bounds', fb.pixel(vip.VIP_FRAME_BUFFER_WIDTH - 1, vip.VIP_FRAME_BUFFER_HEIGHT - 1), 0);
}

section('Frame buffer addresses');
check('size', vip.VIP_FRAME_BUFFER_BYTES, 0x6000);
check('left 0', vip.vipFrameBufferAddress('left', 0), 0x00000000);
check('left 1', vip.vipFrameBufferAddress('left', 1), 0x00008000);
check('right 0', vip.vipFrameBufferAddress('right', 0), 0x00010000);
check('right 1', vip.vipFrameBufferAddress('right', 1), 0x00018000);

// --- Palettes ---------------------------------------------------------------

section('Palettes and brightness');
{
    const levels = vip.vipBrightnessLevels(32, 64, 32);
    check('level 0 is black', levels[0], 0);
    check('level 1 is BRTA', levels[1], 32);
    check('level 2 is BRTB', levels[2], 64);
    check('level 3 is the sum', levels[3], 128);
    check('levels clamp at 255', vip.vipBrightnessLevels(200, 200, 200)[3], 255);

    // 0xE4 is 11 10 01 00: each pixel value selects its own level.
    const identity = vip.vipPaletteIntensities(0xe4, levels);
    check('value 0', identity[0], 0);
    check('value 1', identity[1], 32);
    check('value 2', identity[2], 64);
    check('value 3', identity[3], 128);

    // Pixel value 0 reads the unused low bits, so it is black whatever is there.
    check('value 0 is always black', vip.vipPaletteIntensities(0xff, levels)[0], 0);
    // A palette can map several values to one level.
    check('collapsed palette', vip.vipPaletteIntensities(0x00, levels)[3], 0);
}

// --- Live VRAM --------------------------------------------------------------

const romPath = process.argv[2];
if (romPath) {
    section(`Live VRAM (${romPath})`);

    const corePath = new URL(
        '../applications/electron/binaries/vuengine-studio-tools/web/shrooms-vb-core/core.wasm',
        import.meta.url
    );
    const { instance } = await WebAssembly.instantiate(fs.readFileSync(corePath), {
        env: { emscripten_notify_memory_growth: () => { } }
    });
    const E = instance.exports;
    E._initialize();

    const rom = fs.readFileSync(romPath);
    const romPtr = E.Realloc(0, rom.length);
    new Uint8Array(E.memory.buffer, romPtr, rom.length).set(rom);

    const sim = E.CreateSim();
    if (E.vbSetCartROM(sim, romPtr, rom.length) !== 0) {
        throw new Error('Core rejected the ROM');
    }
    const ramPtr = E.Realloc(0, 8192);
    new Uint8Array(E.memory.buffer, ramPtr, 8192).fill(0);
    E.vbSetCartRAM(sim, ramPtr, 8192);

    // Run long enough for a game to have set up its display.
    const simsPtr = E.Realloc(0, 4);
    new Uint32Array(E.memory.buffer, simsPtr, 1)[0] = sim;
    for (let frame = 0; frame < 600; frame++) {
        E.Emulate(simsPtr, 1, 400000);
    }

    const U8 = 1;
    const read = (address, length) => {
        const out = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            out[i] = E.vbRead(sim, (address + i) >>> 0, U8) & 0xff;
        }
        return out;
    };
    const asView = bytes => new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

    const registers = asView(read(vip.VIP_REGISTER_BASE, vip.VIP_REGISTER_BLOCK_BYTES));
    const brta = registers.getUint16(vip.VipRegister.BRTA, true) & 0xff;
    const brtb = registers.getUint16(vip.VipRegister.BRTB, true) & 0xff;
    const brtc = registers.getUint16(vip.VipRegister.BRTC, true) & 0xff;
    console.log(`  BRTA/BRTB/BRTC = ${brta}/${brtb}/${brtc}`);
    check('brightness is configured', brta + brtb + brtc > 0, true);

    const worldBytes = asView(read(vip.VIP_WORLD_BASE, vip.VIP_WORLD_BLOCK_BYTES));
    const worlds = [];
    for (let i = 0; i < vip.VIP_WORLD_COUNT; i++) {
        worlds.push(vip.decodeVipWorld(worldBytes, i, i * vip.VIP_WORLD_BYTES));
    }
    const enabled = worlds.filter(w => w.lon || w.ron);
    console.log(`  ${enabled.length} of 32 worlds drawn, ${worlds.filter(w => w.end).length} with END set`);
    check('at least one world is drawn', enabled.length > 0, true);
    // Drawing walks worlds downwards and stops at END, so one must be set or
    // the VIP would run off the end of the table.
    check('drawing terminates', worlds.some(w => w.end), true);
    for (const world of enabled) {
        check(`world ${world.index} bgMap in range`, world.bgMap < vip.VIP_BGMAP_COUNT, true);
    }

    const segments = [0, 1, 2, 3].map(i =>
        read(vip.vipCharSegmentAddress(i), vip.VIP_CHAR_SEGMENT_BYTES)
    );
    const characters = new vip.VipCharacters(segments);
    let nonBlank = 0;
    for (let char = 0; char < vip.VIP_CHAR_COUNT; char++) {
        for (let y = 0; y < 8 && !(nonBlank & (1 << 31)); y++) {
            for (let x = 0; x < 8; x++) {
                if (characters.pixel(char, x, y) !== 0) {
                    nonBlank++;
                    y = 8;
                    break;
                }
            }
        }
    }
    console.log(`  ${nonBlank} of ${vip.VIP_CHAR_COUNT} characters have pixels`);
    check('character memory is populated', nonBlank > 0, true);

    const oam = asView(read(vip.VIP_OAM_BASE, vip.VIP_OAM_BLOCK_BYTES));
    let drawnObjects = 0;
    for (let i = 0; i < vip.VIP_OBJECT_COUNT; i++) {
        const object = vip.decodeVipObject(oam, i, i * vip.VIP_OBJECT_BYTES);
        if (vip.isVipObjectVisible(object)) {
            drawnObjects++;
            check(`object ${i} char in range`, object.char < vip.VIP_CHAR_COUNT, true);
            check(`object ${i} jx in range`, object.jx >= -512 && object.jx < 512, true);
        }
    }
    console.log(`  ${drawnObjects} of 1024 objects drawn`);
} else {
    console.log('\nLive VRAM: skipped, pass a ROM path to include it.');
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
