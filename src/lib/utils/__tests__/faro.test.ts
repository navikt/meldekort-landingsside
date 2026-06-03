import { beforeEach, describe, expect, it, vi } from 'vitest';

const initializeFaroMock = vi.fn();

vi.mock('@grafana/faro-web-sdk', () => ({
  getWebInstrumentations: vi.fn(() => []),
  initializeFaro: initializeFaroMock,
}));

vi.mock('@grafana/faro-web-tracing', () => ({
  TracingInstrumentation: class TracingInstrumentation {},
}));

vi.mock('../env', () => ({
  getEnv: vi.fn((key: string) => {
    if (key === 'FARO_URL') return 'https://faro.example.com/collect';
    if (key === 'GITHUB_SHA') return 'test-sha';
    if (key === 'IS_LOCALHOST') return 'false';
    return '';
  }),
}));

describe('faro beforeSend', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  async function getBeforeSend() {
    let beforeSend: ((item: { meta?: { page?: { url?: string } } }) => unknown) | undefined;

    initializeFaroMock.mockImplementation((config: { beforeSend?: typeof beforeSend }) => {
      beforeSend = config.beforeSend;
      return {};
    });

    const { getFaro } = await import('../faro');
    getFaro();

    expect(beforeSend).toBeDefined();
    return beforeSend as (item: { meta?: { page?: { url?: string } } }) => unknown;
  }

  it('fjerner query-parametre fra item.meta.page.url', async () => {
    const beforeSend = await getBeforeSend();
    const item = {
      meta: {
        page: {
          url: 'https://www.nav.no/dagpenger/meldekort?foo=bar&token=secret#del',
        },
      },
    };

    beforeSend(item);

    expect(item.meta.page.url).toBe('https://www.nav.no/dagpenger/meldekort#del');
  });

  it('kaster ikke feil for ugyldig URL', async () => {
    const beforeSend = await getBeforeSend();
    const item = {
      meta: {
        page: {
          url: 'ikke-en-url',
        },
      },
    };

    expect(() => beforeSend(item)).not.toThrow();
    expect(item.meta.page.url).toBe('ikke-en-url');
  });
});