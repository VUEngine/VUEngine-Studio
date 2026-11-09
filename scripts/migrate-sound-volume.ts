/********************************************************************************
 * Converts instruments in .sound files from stereo levels to volume and panning.
 *
 * Instruments used to store `volume` as `{ left, right }` stereo levels, which,
 * together with the envelope's initial value, determined the output level.
 * They now store `volume` as a percentage of the maximum output level and
 * `panning` as a percentage from -100 (left) to 100 (right). The conversion
 * mirrors getVolumeAndPanningFromStereoLevels in
 * extensions/vuengine-studio-extension/src/editors/browser/components/SoundEditor/Other/volume.ts.
 *
 * It also adds the sound's master `volume` (100%) and its global `events` where they are missing,
 * taking over intermediate `masterVolume` and `masterVolumeEvents` fields, and replaces the `speed`
 * map with a single `tempo` value, which is the speed at the sound's start. Sounds without a timer
 * resolution get the default one, with their tempos rounded to multiples of it.
 *
 * With --from-levels, it instead converts instruments from the intermediate format, which
 * stored `volume` as the output level (0-29) and `panning` from -15 to 15. Volume and
 * panning events in patterns are left untouched, they were percentages from the start.
 *
 * Usage: yarn ts-node scripts/migrate-sound-volume.ts [--dry-run] [--from-levels] <directory|file>...
 ********************************************************************************/

// the formatter the editors use to write files, which is a dependency of the extension
// eslint-disable-next-line import/no-extraneous-dependencies
import { EolStyle, Formatter, FracturedJsonOptions, NumberListAlignment } from 'fracturedjsonjs';
import * as fs from 'fs';
import * as path from 'path';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

const STEREO_LEVEL_DEFAULT = 11;
const ENVELOPE_INITIAL_VALUE_DEFAULT = 11;
const ENVELOPE_INITIAL_VALUE_MAX = 15;
const ENVELOPE_DIRECTION_GROW = 1;
const OUTPUT_LEVEL_MAX = 29;
const VOLUME_MAX = 100;
const PANNING_MAX = 100;
const PANNING_STEPS = 30;
const LEVELS_PANNING_MAX = 15;
const MASTER_VOLUME_DEFAULT = 100;
const TEMPO_DEFAULT = 65;
const TIMER_RESOLUTION_DEFAULT = 5;
const TEMPO_MIN = 5;
const TEMPO_MAX = 250;
const SKIPPED_DIRECTORIES = ['.git', 'build', 'node_modules'];

const argv = yargs(hideBin(process.argv))
    .usage('$0 [--dry-run] [--from-levels] <directory|file>...')
    .option('dry-run', {
        type: 'boolean',
        default: false,
        description: 'Only report what would be converted, do not write any files',
    })
    .option('from-levels', {
        type: 'boolean',
        default: false,
        description: 'Convert from the intermediate format with volume 0-29 and panning -15..15 instead of stereo levels',
    })
    .demandCommand(1, 'Specify at least one directory or .sound file')
    .version(false)
    .wrap(120)
    .parseSync();

execute();

function execute(): void {
    const files = argv._.flatMap(input => findSoundFiles(path.resolve(input.toString())));
    let migratedFiles = 0;

    files.forEach(file => {
        try {
            const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
            if (argv.fromLevels && !isInLevelsFormat(data)) {
                console.log(`Skipping ${file}, which has values outside of the intermediate format's ranges and thus seems to be converted already.`);
                return;
            }

            const changes = [
                ...(argv.fromLevels ? migrateInstrumentsFromLevels(data) : migrateInstruments(data)),
                ...migrateSoundSettings(data),
            ];
            if (!changes.length) {
                return;
            }

            console.log(`${argv.dryRun ? '[dry run] ' : ''}${file}`);
            changes.forEach(line => console.log(`    ${line}`));
            if (!argv.dryRun) {
                fs.writeFileSync(file, stringify(sortKeys(data)));
            }
            migratedFiles++;
        } catch (error) {
            console.error(`ERROR: Could not migrate ${file}: ${error}`);
            process.exitCode = 1;
        }
    });

    console.log(`\n${argv.dryRun ? 'Would migrate' : 'Migrated'} ${migratedFiles} of ${files.length} .sound files.`);
}

function findSoundFiles(input: string): string[] {
    if (!fs.existsSync(input)) {
        console.error(`ERROR: ${input} does not exist.`);
        process.exitCode = 1;
        return [];
    }

    if (fs.statSync(input).isFile()) {
        return input.endsWith('.sound') ? [input] : [];
    }

    return fs.readdirSync(input, { withFileTypes: true }).flatMap(entry => {
        if (entry.isDirectory()) {
            return SKIPPED_DIRECTORIES.includes(entry.name) ? [] : findSoundFiles(path.join(input, entry.name));
        }
        return entry.name.endsWith('.sound') ? [path.join(input, entry.name)] : [];
    });
}

// returns a description for every converted instrument
function migrateInstruments(data: any): string[] {
    return Object.entries(data.instruments ?? {}).flatMap(([id, instrument]: [string, any]) => {
        if (instrument.volume === null || typeof instrument.volume !== 'object') {
            return [];
        }

        const left = instrument.volume.left ?? STEREO_LEVEL_DEFAULT;
        const right = instrument.volume.right ?? STEREO_LEVEL_DEFAULT;
        const envelope = instrument.envelope ?? {};
        const initialValue = envelope.initialValue ?? ENVELOPE_INITIAL_VALUE_DEFAULT;
        const envelopeValue = envelope.enabled && envelope.direction === ENVELOPE_DIRECTION_GROW
            ? ENVELOPE_INITIAL_VALUE_MAX
            : initialValue;
        const { volume, panning } = getVolumeAndPanning(left, right, envelopeValue);
        setVolumeAndPanning(data, id, volume, panning);

        return [`${instrument.name || '(unnamed)'}: L${left} R${right} E${initialValue} -> volume ${volume}%, panning ${panning}%`];
    });
}

// instruments of the intermediate format can not be told apart from converted ones with certainty,
// but values outside of its ranges prove a file to be converted already
function isInLevelsFormat(data: any): boolean {
    return Object.values(data.instruments ?? {}).every((instrument: any) =>
        (typeof instrument.volume !== 'number' || instrument.volume <= OUTPUT_LEVEL_MAX) &&
        (typeof instrument.panning !== 'number' || Math.abs(instrument.panning) <= LEVELS_PANNING_MAX)
    );
}

// returns a description for every converted instrument
function migrateInstrumentsFromLevels(data: any): string[] {
    return Object.entries(data.instruments ?? {}).flatMap(([id, instrument]: [string, any]) => {
        if (typeof instrument.volume !== 'number') {
            return [];
        }

        const volume = outputLevelToVolume(instrument.volume);
        const panning = snapPanning((instrument.panning ?? 0) * PANNING_MAX / LEVELS_PANNING_MAX);
        setVolumeAndPanning(data, id, volume, panning);

        return [`${instrument.name || '(unnamed)'}: volume ${instrument.volume}, panning ${instrument.panning ?? 0} -> volume ${volume}%, panning ${panning}%`];
    });
}

// returns a description for every added or converted sound setting
function migrateSoundSettings(data: any): string[] {
    const changes: string[] = [];

    if (data.volume === undefined) {
        data.volume = data.masterVolume ?? MASTER_VOLUME_DEFAULT;
        changes.push(`sound: volume ${data.volume}%`);
    }
    if (data.events === undefined) {
        data.events = Object.fromEntries(
            Object.entries(data.masterVolumeEvents ?? {}).map(([step, value]) => [step, { masterVolume: value }])
        );
        changes.push(`sound: ${Object.keys(data.events).length} global events`);
    }
    if (data.tempo === undefined) {
        data.tempo = data.speed?.[0] ?? TEMPO_DEFAULT;
        changes.push(`sound: tempo ${data.tempo} ms per 1/16 note`);
    }
    if (data.timerResolution === undefined) {
        data.timerResolution = TIMER_RESOLUTION_DEFAULT;
        changes.push(`sound: timer resolution ${data.timerResolution} ms`);
        const snapTempo = (tempo: number) => Math.min(Math.max(
            Math.round(tempo / TIMER_RESOLUTION_DEFAULT) * TIMER_RESOLUTION_DEFAULT,
            TEMPO_MIN
        ), TEMPO_MAX);
        if (data.tempo !== snapTempo(data.tempo)) {
            changes.push(`sound: tempo ${data.tempo} -> ${snapTempo(data.tempo)} ms per 1/16 note`);
            data.tempo = snapTempo(data.tempo);
        }
        Object.values(data.events ?? {}).forEach((events: any) => {
            if (events.tempo !== undefined) {
                events.tempo = snapTempo(events.tempo);
            }
        });
    }
    ['masterVolume', 'masterVolumeEvents', 'speed'].forEach(key => {
        if (data[key] !== undefined) {
            delete data[key];
            changes.push(`sound: removed ${key}`);
        }
    });

    return changes;
}

// keep keys sorted like the editor does, which only touches the top level and the given instrument for a minimal diff
function sortKeys(object: any): any {
    return Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.toLowerCase().localeCompare(b.toLowerCase())));
}

function setVolumeAndPanning(data: any, instrumentId: string, volume: number, panning: number): void {
    data.instruments[instrumentId] = sortKeys({ ...data.instruments[instrumentId], volume, panning });
}

function outputLevelToVolume(outputLevel: number): number {
    return Math.round(outputLevel * VOLUME_MAX / OUTPUT_LEVEL_MAX);
}

function snapPanning(panning: number): number {
    return Math.round(Math.round(panning * PANNING_STEPS / PANNING_MAX) * PANNING_MAX / PANNING_STEPS);
}

function getVsuOutputLevel(stereoLevel: number, envelopeValue: number): number {
    return ((stereoLevel * envelopeValue) >> 3) + (stereoLevel !== 0 && envelopeValue !== 0 ? 1 : 0);
}

function getVolumeAndPanning(leftLevel: number, rightLevel: number, envelopeValue: number): { volume: number, panning: number } {
    const left = getVsuOutputLevel(leftLevel, envelopeValue);
    const right = getVsuOutputLevel(rightLevel, envelopeValue);
    const louder = Math.max(left, right);
    if (louder === 0) {
        return { volume: 0, panning: 0 };
    }

    const panning = snapPanning(PANNING_MAX * (1 - Math.min(left, right) / louder));

    return {
        volume: outputLevelToVolume(louder),
        panning: panning === 0
            ? 0
            : left > right ? -panning : panning,
    };
}

// same output format as the editors' stringify in Common/Utils.ts
function stringify(input: any): string {
    const options = new FracturedJsonOptions();
    options.AllowTrailingCommas = false;
    options.CommaPadding = false;
    options.JsonEolStyle = EolStyle.Lf;
    options.MaxCompactArrayComplexity = 1;
    options.MaxInlineComplexity = 0;
    options.MaxInlineLength = Number.MAX_SAFE_INTEGER;
    options.MaxTableRowComplexity = -1;
    options.MaxTotalLineLength = Number.MAX_SAFE_INTEGER;
    options.MinCompactArrayRowItems = 1;
    options.NumberListAlignment = NumberListAlignment.Left;
    options.OmitTrailingWhitespace = true;
    options.UseTabToIndent = true;

    const formatter = new Formatter();
    formatter.Options = options;

    return (formatter.Serialize(input) ?? '')
        .replace(/(\s+),/g, ',');
}
