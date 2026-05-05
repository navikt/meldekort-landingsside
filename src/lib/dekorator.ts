import {
  type DecoratorElements,
  type DecoratorEnvProps,
  type DecoratorFetchProps,
  type DecoratorLocale,
  fetchDecoratorHtml,
} from '@navikt/nav-dekoratoren-moduler/ssr';
import { logger } from './utils/logger';

interface DecoratorParams {
  context?: 'privatperson' | 'arbeidsgiver';
  simple?: boolean;
  language?: DecoratorLocale;
  availableLanguages?: Array<{
    locale: DecoratorLocale;
    url: string;
    handleInApp?: boolean;
  }>;
}

/**
 * Henter dekoratør HTML fra NAV dekoratøren.
 * Følger samme pattern som meldekort-frontend.
 */
export async function getDecoratorHTML(params: DecoratorParams = {}): Promise<DecoratorElements> {
  const { context = 'privatperson', simple = false, language = 'nb', availableLanguages } = params;

  // Hvis DEKORATOR_MILJO er satt (i NAIS), bruk den, ellers 'localhost' (lokal utvikling)
  const decoratorEnv = (process.env.DEKORATOR_MILJO ||
    import.meta.env.DEKORATOR_MILJO ||
    'localhost') as DecoratorEnvProps['env'];

  // Bygg config basert på miljø
  const config: DecoratorFetchProps =
    decoratorEnv === 'localhost'
      ? {
          env: 'localhost',
          localUrl: 'https://dekoratoren.ekstern.dev.nav.no',
          params: {
            context,
            simple,
            language,
            ...(availableLanguages && { availableLanguages }),
          },
        }
      : {
          env: decoratorEnv,
          // serviceDiscovery er kritisk for at dekoratøren skal kunne
          // kommunisere med Wonderwall/IDporten for innloggingsstatus
          serviceDiscovery: true,
          params: {
            context,
            simple,
            language,
            ...(availableLanguages && { availableLanguages }),
          },
        };

  try {
    // fetchDecoratorHtml returnerer allerede DecoratorElements med riktige feltnavn
    return await fetchDecoratorHtml(config);
  } catch (error) {
    logger.error('Error fetching decorator', { error, config });
    return {
      DECORATOR_HEAD_ASSETS: '',
      DECORATOR_HEADER: '',
      DECORATOR_FOOTER: '',
      DECORATOR_SCRIPTS: '',
    };
  }
}
