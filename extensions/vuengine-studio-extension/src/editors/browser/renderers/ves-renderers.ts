import vesBrightnessRepeatEditorControl from './brightness-repeat-editor/ves-brightness-repeat-editor-control';
import vesBrightnessRepeatEditorControlTester from './brightness-repeat-editor/ves-brightness-repeat-editor-control-tester';
import vesColumnTableEditorControl from './column-table-editor/ves-column-table-editor-control';
import vesColumnTableEditorControlTester from './column-table-editor/ves-column-table-editor-control-tester';
import vesEntityEditorControl from './entity-editor/ves-entity-editor-control';
import vesEntityEditorControlTester from './entity-editor/ves-entity-editor-control-tester';
import vesFontEditorControl from './font-editor/ves-font-editor-control';
import vesFontEditorControlTester from './font-editor/ves-font-editor-control-tester';
import vesImageConvEditorControl from './image-conv-editor/ves-image-conv-editor-control';
import vesImageConvEditorControlTester from './image-conv-editor/ves-image-conv-editor-control-tester';
import vesMeshesControl from './meshes/ves-meshes-control';
import vesMeshesControlTester from './meshes/ves-meshes-control-tester';
import vesMusicEditorControl from './music-editor/ves-music-editor-control';
import vesMusicEditorControlTester from './music-editor/ves-music-editor-control-tester';
import vesPaletteControl from './palette/ves-palette-control';
import vesPaletteControlTester from './palette/ves-palette-control-tester';
import vesPcmEditorControl from './pcm-editor/ves-pcm-editor-control';
import vesPcmEditorControlTester from './pcm-editor/ves-pcm-editor-control-tester';
import vesRumbleEffectEditorControl from './rumble-effect-editor/ves-rumble-effect-editor-control';
import vesRumbleEffectEditorControlTester from './rumble-effect-editor/ves-rumble-effect-editor-control-tester';
import vesTranslationsEditorControl from './translations-editor/ves-translations-editor-control';
import vesTranslationsEditorControlTester from './translations-editor/ves-translations-editor-control-tester';

export const VES_RENDERERS = [
    { tester: vesBrightnessRepeatEditorControlTester, renderer: vesBrightnessRepeatEditorControl },
    { tester: vesColumnTableEditorControlTester, renderer: vesColumnTableEditorControl },
    { tester: vesEntityEditorControlTester, renderer: vesEntityEditorControl },
    { tester: vesFontEditorControlTester, renderer: vesFontEditorControl },
    { tester: vesImageConvEditorControlTester, renderer: vesImageConvEditorControl },
    { tester: vesMusicEditorControlTester, renderer: vesMusicEditorControl },
    { tester: vesMeshesControlTester, renderer: vesMeshesControl },
    { tester: vesPaletteControlTester, renderer: vesPaletteControl },
    { tester: vesPcmEditorControlTester, renderer: vesPcmEditorControl },
    { tester: vesRumbleEffectEditorControlTester, renderer: vesRumbleEffectEditorControl },
    { tester: vesTranslationsEditorControlTester, renderer: vesTranslationsEditorControl },
];
