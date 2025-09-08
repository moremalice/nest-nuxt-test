import { I18nOptions } from 'nestjs-i18n';
import * as path from 'path';
import { HeaderResolver, AcceptLanguageResolver } from 'nestjs-i18n';
import { CustomLanguageResolver } from '../common/i18n/custom-language.resolver';

export const i18nConfigs = {
  default: {
    factory: (): I18nOptions => ({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '..', 'common', 'i18n'),
        watch: true,
      },
    }),
    resolvers: [
      new CustomLanguageResolver(),
      new HeaderResolver(['x-custom-lang']),
      new AcceptLanguageResolver(),
    ],
  },
};
