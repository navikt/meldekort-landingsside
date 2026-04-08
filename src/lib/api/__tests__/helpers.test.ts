import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  shouldUseMockData,
  fetchMeldekortFromApi,
  hentMeldekortData,
  validerMeldekortData,
  validerArenaMeldekortData,
} from '../helpers';
import type { MeldekortData, ArenaMeldekortData } from '../../types/meldekort';
import type { requestTokenxOboToken } from '@navikt/oasis';

type TokenResult = Awaited<ReturnType<typeof requestTokenxOboToken>>;

// Mock @navikt/oasis
vi.mock('@navikt/oasis', () => ({
  requestTokenxOboToken: vi.fn(),
}));

// Mock logger
vi.mock('../logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock mockData
vi.mock('../mockData', () => ({
  dpMock: {
    harInnsendteMeldekort: true,
    meldekortTilUtfylling: [],
    redirectUrl: 'https://dp-mock.nav.no',
  },
  ttlMock: null,
  aapMock: null,
  arenaMock: {
    harInnsendteMeldekort: false,
    meldekortTilUtfylling: [],
    redirectUrl: 'https://arena-mock.nav.no',
    meldegruppe: 'ARBS',
  },
}));

describe('helpers', () => {
  describe('shouldUseMockData', () => {
    beforeEach(() => {
      vi.unstubAllEnvs();
    });

    it('should return true when ENFORCE_LOGIN is "false"', () => {
      vi.stubEnv('ENFORCE_LOGIN', 'false');
      expect(shouldUseMockData()).toBe(true);
    });

    it('should return false when ENFORCE_LOGIN is "true"', () => {
      vi.stubEnv('ENFORCE_LOGIN', 'true');
      expect(shouldUseMockData()).toBe(false);
    });

    it('should return false when ENFORCE_LOGIN is not set', () => {
      expect(shouldUseMockData()).toBe(false);
    });
  });

  describe('validerMeldekortData', () => {
    it('should validate correct meldekort data', () => {
      const validData: MeldekortData = {
        harInnsendteMeldekort: true,
        meldekortTilUtfylling: [],
        redirectUrl: 'https://example.com',
      };
      expect(validerMeldekortData(validData)).toBe(true);
    });

    it('should reject data with missing fields', () => {
      const invalidData = {
        harInnsendteMeldekort: true,
        meldekortTilUtfylling: [],
        // redirectUrl missing
      };
      expect(validerMeldekortData(invalidData)).toBe(false);
    });

    it('should reject data with wrong types', () => {
      const invalidData = {
        harInnsendteMeldekort: 'true', // should be boolean
        meldekortTilUtfylling: [],
        redirectUrl: 'https://example.com',
      };
      expect(validerMeldekortData(invalidData)).toBe(false);
    });

    it('should reject null', () => {
      expect(validerMeldekortData(null)).toBe(false);
    });

    it('should reject undefined', () => {
      expect(validerMeldekortData(undefined)).toBe(false);
    });
  });

  describe('validerArenaMeldekortData', () => {
    it('should validate correct arena data', () => {
      const validData: ArenaMeldekortData = {
        harInnsendteMeldekort: false,
        meldekortTilUtfylling: [],
        redirectUrl: 'https://example.com',
        meldegruppe: 'ARBS',
      };
      expect(validerArenaMeldekortData(validData)).toBe(true);
    });

    it('should reject data without meldegruppe', () => {
      const invalidData = {
        harInnsendteMeldekort: false,
        meldekortTilUtfylling: [],
        redirectUrl: 'https://example.com',
        // meldegruppe missing
      };
      expect(validerArenaMeldekortData(invalidData)).toBe(false);
    });
  });

  describe('fetchMeldekortFromApi', () => {
    const mockConfig = {
      apiUrl: 'https://api.test.nav.no',
      audience: 'test:audience',
      path: '/test',
      serviceName: 'TestService',
      validator: validerMeldekortData,
    };

    beforeEach(() => {
      vi.clearAllMocks();
      vi.unstubAllEnvs();
      global.fetch = vi.fn();
    });

    it('should return error when API config is missing', async () => {
      const result = await fetchMeldekortFromApi<MeldekortData>('token', {
        ...mockConfig,
        apiUrl: undefined,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Missing TestService API configuration');
      }
    });

    it('should return error when token exchange fails', async () => {
      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: false,
        error: { message: 'Token exchange failed' },
      } as TokenResult);

      const result = await fetchMeldekortFromApi<MeldekortData>('token', mockConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Token exchange failed');
      }
    });

    it('should return error when API returns non-ok status', async () => {
      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'obo-token',
      } as TokenResult);

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        status: 500,
      } as Response);

      const result = await fetchMeldekortFromApi<MeldekortData>('token', mockConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('TestService API returned 500');
      }
    });

    it('should return error when API returns invalid data', async () => {
      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'obo-token',
      } as TokenResult);

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({ invalid: 'data' }),
      } as Response);

      const result = await fetchMeldekortFromApi<MeldekortData>('token', mockConfig);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('invalid data structure');
      }
    });

    it('should return null for empty meldekort data', async () => {
      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'obo-token',
      } as TokenResult);

      const emptyData = {
        harInnsendteMeldekort: false,
        meldekortTilUtfylling: [],
        redirectUrl: 'https://example.com',
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => emptyData,
      } as Response);

      const result = await fetchMeldekortFromApi<MeldekortData>('token', mockConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }
    });

    it('should return valid data on success', async () => {
      const { requestTokenxOboToken } = await import('@navikt/oasis');
      vi.mocked(requestTokenxOboToken).mockResolvedValue({
        ok: true,
        token: 'obo-token',
      } as TokenResult);

      const validData = {
        harInnsendteMeldekort: true,
        meldekortTilUtfylling: [
          {
            kanSendesFra: '2024-01-01T00:00:00',
            kanFyllesUtFra: '2024-01-01T00:00:00',
            fristForInnsending: '2024-01-14T00:00:00',
          },
        ],
        redirectUrl: 'https://example.com',
      };

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => validData,
      } as Response);

      const result = await fetchMeldekortFromApi<MeldekortData>('token', mockConfig);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validData);
      }
    });
  });

  describe('hentMeldekortData', () => {
    const mockConfig = {
      apiUrl: 'https://api.test.nav.no',
      audience: 'test:audience',
      path: '/test',
      serviceName: 'dp',
      validator: validerMeldekortData,
    };

    beforeEach(() => {
      vi.clearAllMocks();
      vi.unstubAllEnvs();
    });

    it('should return mock data when ENFORCE_LOGIN is false', async () => {
      vi.stubEnv('ENFORCE_LOGIN', 'false');

      const result = await hentMeldekortData('token', mockConfig);

      expect(result).toBeDefined();
      expect(result?.redirectUrl).toBe('https://dp-mock.nav.no');
    });

    it('should return null when mock data is not available', async () => {
      vi.stubEnv('ENFORCE_LOGIN', 'false');

      const result = await hentMeldekortData('token', {
        ...mockConfig,
        serviceName: 'ttl',
      });

      // ttlMock is null in mockData, so result should be null not undefined
      expect(result).toBeNull();
    });
  });
});
