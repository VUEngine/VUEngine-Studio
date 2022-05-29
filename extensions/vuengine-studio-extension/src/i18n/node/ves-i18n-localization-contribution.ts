import { injectable } from '@theia/core/shared/inversify';
import { LocalizationContribution, LocalizationRegistry } from '@theia/core/lib/node/i18n/localization-contribution';

@injectable()
export class VesLocalizationContribution implements LocalizationContribution {
  async registerLocalizations(registry: LocalizationRegistry): Promise<void> {
    registry.registerLocalizationFromRequire('cs', require('../../../i18n/nls.cs.json'));
    registry.registerLocalizationFromRequire('de', require('../../../i18n/nls.de.json'));
    registry.registerLocalizationFromRequire('en', require('../../../i18n/nls.json'));
    registry.registerLocalizationFromRequire('es', require('../../../i18n/nls.es.json'));
    registry.registerLocalizationFromRequire('fr', require('../../../i18n/nls.fr.json'));
    registry.registerLocalizationFromRequire('hu', require('../../../i18n/nls.hu.json'));
    registry.registerLocalizationFromRequire('it', require('../../../i18n/nls.it.json'));
    registry.registerLocalizationFromRequire('ja', require('../../../i18n/nls.ja.json'));
    registry.registerLocalizationFromRequire('pl', require('../../../i18n/nls.pl.json'));
    registry.registerLocalizationFromRequire('pt-br', require('../../../i18n/nls.pt-br.json'));
    registry.registerLocalizationFromRequire('pt-pt', require('../../../i18n/nls.pt-pt.json'));
    registry.registerLocalizationFromRequire('ru', require('../../../i18n/nls.ru.json'));
    registry.registerLocalizationFromRequire('zh-cn', require('../../../i18n/nls.zh-cn.json'));
  }
}
