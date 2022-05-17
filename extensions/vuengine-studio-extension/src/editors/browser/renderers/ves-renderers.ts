import VesMeshesControl from './meshes/ves-meshes-control';
import VesMeshesControlTester from './meshes/ves-meshes-control-tester';
import vesPaletteControl from './palette/ves-palette-control';
import vesPaletteControlTester from './palette/ves-palette-control-tester';
import VesRatingControl from './starRating/ves-rating-control';
import VesRatingControlTester from './starRating/ves-rating-control-tester';

export const VES_RENDERERS = [
    { tester: VesMeshesControlTester, renderer: VesMeshesControl },
    { tester: vesPaletteControlTester, renderer: vesPaletteControl },
    { tester: VesRatingControlTester, renderer: VesRatingControl },
];
