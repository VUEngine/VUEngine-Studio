import vesImagesControl from './images/ves-images-control';
import vesImagesControlTester from './images/ves-images-control-tester';
import vesInputControl from './input/ves-input-control';
import vesInputControlTester from './input/ves-input-control-tester';
import vesIntroControl from './intro/ves-intro-control';
import vesIntroControlTester from './intro/ves-intro-control-tester';
import vesMeshesControl from './meshes/ves-meshes-control';
import vesMeshesControlTester from './meshes/ves-meshes-control-tester';
import vesPaletteControl from './palette/ves-palette-control';
import vesPaletteControlTester from './palette/ves-palette-control-tester';
import vesRatingControl from './starRating/ves-rating-control';
import vesRatingControlTester from './starRating/ves-rating-control-tester';

export const VES_RENDERERS = [
    { tester: vesImagesControlTester, renderer: vesImagesControl },
    { tester: vesIntroControlTester, renderer: vesIntroControl },
    { tester: vesInputControlTester, renderer: vesInputControl },
    { tester: vesMeshesControlTester, renderer: vesMeshesControl },
    { tester: vesPaletteControlTester, renderer: vesPaletteControl },
    { tester: vesRatingControlTester, renderer: vesRatingControl },
];