import { AboutDialog } from '@theia/core/lib/browser/about-dialog';
import { ContainerModule } from '@theia/core/shared/inversify';
import '../../../src/about/browser/style/index.css';
import { VesAboutDialog } from './ves-about-dialog';

export default new ContainerModule((bind, unbind, isBound, rebind) => {
    // about dialog
    if (isBound(AboutDialog)) {
        rebind(AboutDialog).to(VesAboutDialog).inSingletonScope();
    } else {
        bind(AboutDialog).to(VesAboutDialog).inSingletonScope();
    }
});
