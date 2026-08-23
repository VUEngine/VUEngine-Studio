// Checks the ESSound command decoder against the examples in the hardware
// documentation (ESSound_01.pdf), and the file naming against its id ranges.
//
// The implementation under test is the shipped
// lib/emulator/common/ves-emulator-essound.js, so this exercises the real one.
//
// Usage: node scripts/essound-probe.mjs
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const es = require('../../extensions/vuengine-studio-extension/lib/emulator/common/ves-emulator-essound.js');

let failures = 0;

function check(label, actual, expected) {
    if (!Object.is(actual, expected)) {
        failures++;
        console.log(`  FAIL ${label}: got ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`);
    }
}

function section(name) {
    console.log(`\n${name}`);
}

// --- The examples the documentation gives -----------------------------------

section("The documentation's own examples");
{
    // 0xFFFF = ESSound Start
    check('0xFFFF is init', es.decodeEsSoundMessage(0xffff).kind, 'init');
    // 0x0000 = stops all currently playing audio
    check('0x0000 is stop all', es.decodeEsSoundMessage(0x0000).kind, 'stopAll');

    // 0x0573 = SET VOLUME 50% for track 5
    const volume = es.decodeEsSoundMessage(0x0573);
    check('track', volume.track, 5);
    check('command', volume.command, es.EsSoundCommand.SET_VOLUME);
    check('value', volume.value, 0x7);
    check('is about half', Math.round(es.esSoundVolume(volume.value) * 100), 47);

    // 0x0501 = PLAY track 5
    const play = es.decodeEsSoundMessage(0x0501);
    check('play track', play.track, 5);
    check('play command', play.command, es.EsSoundCommand.PLAY);

    // 0x0500 = STOP track 5
    check('stop command', es.decodeEsSoundMessage(0x0500).command, es.EsSoundCommand.STOP);
    check('stop track', es.decodeEsSoundMessage(0x0500).track, 5);

    // 0x0202 = PLAY LOOP track 2
    check('loop command', es.decodeEsSoundMessage(0x0202).command, es.EsSoundCommand.PLAY_LOOP);
    check('loop track', es.decodeEsSoundMessage(0x0202).track, 2);

    // 0x01F4 = Track 1 SET BALANCE 100% to the L channel
    const balance = es.decodeEsSoundMessage(0x01f4);
    check('balance track', balance.track, 1);
    check('balance command', balance.command, es.EsSoundCommand.SET_BALANCE);
    check('balance value', balance.value, 0xf);
    check('0xF is hard left', es.esSoundBalance(0xf), -1);

    // From the VUEngine Studio examples in the same document:
    // 0x0101 plays 1.mp3, 0x6502 plays 101.wav in loop.
    const mp3 = es.decodeEsSoundMessage(0x0101);
    check('1.mp3 track', mp3.track, 1);
    check('1.mp3 command', mp3.command, es.EsSoundCommand.PLAY);
    check('1.mp3 file', es.esSoundFileName(mp3.track), '1.mp3');
    const wav = es.decodeEsSoundMessage(0x6502);
    check('101.wav track', wav.track, 101);
    check('101.wav command', wav.command, es.EsSoundCommand.PLAY_LOOP);
    check('101.wav file', es.esSoundFileName(wav.track), '101.wav');
}

// --- Levels -----------------------------------------------------------------

section('Volume and balance');
{
    check('0x0 is silent', es.esSoundVolume(0x0), 0);
    check('0xF is full', es.esSoundVolume(0xf), 1);
    check('0x0 is hard right', es.esSoundBalance(0x0), 1);
    check('0x7 is very nearly centre', Math.abs(es.esSoundBalance(0x7)) < 0.07, true);
    check('0xF is hard left', es.esSoundBalance(0xf), -1);
    check('out of range clamps', es.esSoundVolume(99), 1);
}

// --- Files ------------------------------------------------------------------

section('Track ids and file names');
{
    check('the first mp3', es.esSoundFileName(1), '1.mp3');
    check('the last mp3', es.esSoundFileName(100), '100.mp3');
    check('the first wav', es.esSoundFileName(101), '101.wav');
    check('the last wav', es.esSoundFileName(254), '254.wav');
    // 0 and 255 name nothing, per the documentation.
    check('0 is not a track', es.esSoundFileName(0), undefined);
    check('255 is not a track', es.esSoundFileName(255), undefined);
    check('kind of an mp3 id', es.esSoundKindOf(50), 'mp3');
    check('kind of a wav id', es.esSoundKindOf(200), 'wav');

    check('a file name reads back', es.esSoundTrackOf('42.mp3'), 42);
    check('and a wav one', es.esSoundTrackOf('101.wav'), 101);
    check('upper case too', es.esSoundTrackOf('101.WAV'), 101);
    // An id in the wrong range for its extension is not a track.
    check('an mp3 in the wav range', es.esSoundTrackOf('101.mp3'), undefined);
    check('a wav in the mp3 range', es.esSoundTrackOf('1.wav'), undefined);
    check('something else entirely', es.esSoundTrackOf('output.vb'), undefined);
    check('no leading zeroes', es.esSoundTrackOf('001.mp3'), undefined);
}

// --- History lines ----------------------------------------------------------

section('Describing a command');
{
    const describe = raw => es.describeEsSoundMessage(es.decodeEsSoundMessage(raw));
    check('init', describe(0xffff), 'Init');
    check('stop all', describe(0x0000), 'Stop All');
    check('play', describe(0x0101), 'Play — 1.mp3');
    check('play loop', describe(0x6502), 'Play Loop — 101.wav');
    check('stop', describe(0x0500), 'Stop — 5.mp3');
    check('set balance', describe(0x01f4), 'Set Balance 100% L — 1.mp3');
    check('a track with no file', describe(0xff01), 'Play — track 255');
}

console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
