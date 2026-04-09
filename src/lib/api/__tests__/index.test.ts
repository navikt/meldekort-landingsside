import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getMeldekortResultat } from '../index';
import type { MeldekortData, ArenaMeldekortData } from '../../types/meldekort';

// Mock all API clients
vi.mock('../clients/dagpenger', () => ({
  hentMeldekortDataFraDP: vi.fn(),
}));

vi.mock('../clients/tiltakspenger', () => ({
  hentMeldekortDataFraTTL: vi.fn(),
}));

vi.mock('../clients/arbeidsavklaringspenger', () => ({
  hentMeldekortDataFraAAP: vi.fn(),
}));

vi.mock('../clients/arena', () => ({
  hentMeldekortDataFraArena: vi.fn(),
}));

vi.mock('../clients/harDP', () => ({
  hentHarDP: vi.fn(),
}));

describe('index', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMeldekortResultat', () => {
    it('should redirect when user has only one ytelse (DP)', async () => {
      const { hentMeldekortDataFraDP } = await import('../clients/dagpenger');
      const { hentMeldekortDataFraTTL } = await import('../clients/tiltakspenger');
      const { hentMeldekortDataFraAAP } = await import('../clients/arbeidsavklaringspenger');

      const dpData: MeldekortData = {
        harInnsendteMeldekort: true,
        meldekortTilUtfylling: [],
        redirectUrl: 'https://dp.nav.no',
      };

      vi.mocked(hentMeldekortDataFraDP).mockResolvedValue(dpData);
      vi.mocked(hentMeldekortDataFraTTL).mockResolvedValue(undefined);
      vi.mocked(hentMeldekortDataFraAAP).mockResolvedValue(undefined);

      const result = await getMeldekortResultat('test-token');

      expect(result.redirectUrl).toBe('https://dp.nav.no');
      expect(result.data).toEqual({ dp: dpData });
    });

    it('should not redirect when user has multiple ytelser', async () => {
      const { hentMeldekortDataFraDP } = await import('../clients/dagpenger');
      const { hentMeldekortDataFraTTL } = await import('../clients/tiltakspenger');
      const { hentMeldekortDataFraAAP } = await import('../clients/arbeidsavklaringspenger');

      const dpData: MeldekortData = {
        harInnsendteMeldekort: true,
        meldekortTilUtfylling: [],
        redirectUrl: 'https://dp.nav.no',
      };

      const ttlData: MeldekortData = {
        harInnsendteMeldekort: false,
        meldekortTilUtfylling: [
          {
            kanSendesFra: '2024-01-01T00:00:00',
            kanFyllesUtFra: '2024-01-01T00:00:00',
            fristForInnsending: '2024-01-14T00:00:00',
          },
        ],
        redirectUrl: 'https://ttl.nav.no',
      };

      vi.mocked(hentMeldekortDataFraDP).mockResolvedValue(dpData);
      vi.mocked(hentMeldekortDataFraTTL).mockResolvedValue(ttlData);
      vi.mocked(hentMeldekortDataFraAAP).mockResolvedValue(undefined);

      const result = await getMeldekortResultat('test-token');

      expect(result.redirectUrl).toBeUndefined();
      expect(result.data).toEqual({ dp: dpData, ttl: ttlData });
    });

    it('should check harDP when Arena has data and redirect to DP when harDP is true', async () => {
      const { hentMeldekortDataFraDP } = await import('../clients/dagpenger');
      const { hentMeldekortDataFraTTL } = await import('../clients/tiltakspenger');
      const { hentMeldekortDataFraAAP } = await import('../clients/arbeidsavklaringspenger');
      const { hentHarDP } = await import('../clients/harDP');
      const { hentMeldekortDataFraArena } = await import('../clients/arena');

      const arenaData: ArenaMeldekortData = {
        harInnsendteMeldekort: true,
        meldekortTilUtfylling: [],
        redirectUrl: 'https://arena.nav.no',
        meldegruppe: 'DAGP',
      };

      vi.mocked(hentMeldekortDataFraDP).mockResolvedValue(undefined);
      vi.mocked(hentMeldekortDataFraTTL).mockResolvedValue(undefined);
      vi.mocked(hentMeldekortDataFraAAP).mockResolvedValue(undefined);
      vi.mocked(hentMeldekortDataFraArena).mockResolvedValue(arenaData);
      vi.mocked(hentHarDP).mockResolvedValue(true);

      const result = await getMeldekortResultat('test-token');

      expect(result.redirectUrl).toBe(
        'https://arbeid.intern.dev.nav.no/arbeid/dagpenger/meldekort',
      );
      expect(result.data).toEqual({});
      expect(hentMeldekortDataFraArena).toHaveBeenCalledWith('test-token');
      expect(hentHarDP).toHaveBeenCalledWith('test-token');
    });

    it('should check Arena when no new ytelser and harDP is false', async () => {
      const { hentMeldekortDataFraDP } = await import('../clients/dagpenger');
      const { hentMeldekortDataFraTTL } = await import('../clients/tiltakspenger');
      const { hentMeldekortDataFraAAP } = await import('../clients/arbeidsavklaringspenger');
      const { hentHarDP } = await import('../clients/harDP');
      const { hentMeldekortDataFraArena } = await import('../clients/arena');

      const arenaData: ArenaMeldekortData = {
        harInnsendteMeldekort: false,
        meldekortTilUtfylling: [
          {
            kanSendesFra: '2024-01-01T00:00:00',
            kanFyllesUtFra: '2024-01-01T00:00:00',
            fristForInnsending: '2024-01-14T00:00:00',
          },
        ],
        redirectUrl: 'https://arena.nav.no',
        meldegruppe: 'ARBS',
      };

      vi.mocked(hentMeldekortDataFraDP).mockResolvedValue(undefined);
      vi.mocked(hentMeldekortDataFraTTL).mockResolvedValue(undefined);
      vi.mocked(hentMeldekortDataFraAAP).mockResolvedValue(undefined);
      vi.mocked(hentHarDP).mockResolvedValue(false);
      vi.mocked(hentMeldekortDataFraArena).mockResolvedValue(arenaData);

      const result = await getMeldekortResultat('test-token');

      expect(result.redirectUrl).toBe('https://arena.nav.no');
      expect(result.data).toEqual({ arena: arenaData });
      expect(hentHarDP).toHaveBeenCalledWith('test-token');
      expect(hentMeldekortDataFraArena).toHaveBeenCalledWith('test-token');
    });

    it('should return empty data when no meldekort found', async () => {
      const { hentMeldekortDataFraDP } = await import('../clients/dagpenger');
      const { hentMeldekortDataFraTTL } = await import('../clients/tiltakspenger');
      const { hentMeldekortDataFraAAP } = await import('../clients/arbeidsavklaringspenger');
      const { hentHarDP } = await import('../clients/harDP');
      const { hentMeldekortDataFraArena } = await import('../clients/arena');

      vi.mocked(hentMeldekortDataFraDP).mockResolvedValue(undefined);
      vi.mocked(hentMeldekortDataFraTTL).mockResolvedValue(undefined);
      vi.mocked(hentMeldekortDataFraAAP).mockResolvedValue(undefined);
      vi.mocked(hentHarDP).mockResolvedValue(false);
      vi.mocked(hentMeldekortDataFraArena).mockResolvedValue(undefined);

      const result = await getMeldekortResultat('test-token');

      expect(result.redirectUrl).toBeUndefined();
      expect(result.data).toEqual({});
    });

    it('should call all new ytelser in parallel', async () => {
      const { hentMeldekortDataFraDP } = await import('../clients/dagpenger');
      const { hentMeldekortDataFraTTL } = await import('../clients/tiltakspenger');
      const { hentMeldekortDataFraAAP } = await import('../clients/arbeidsavklaringspenger');

      vi.mocked(hentMeldekortDataFraDP).mockResolvedValue(undefined);
      vi.mocked(hentMeldekortDataFraTTL).mockResolvedValue(undefined);
      vi.mocked(hentMeldekortDataFraAAP).mockResolvedValue(undefined);

      await getMeldekortResultat('test-token');

      expect(hentMeldekortDataFraDP).toHaveBeenCalledWith('test-token');
      expect(hentMeldekortDataFraTTL).toHaveBeenCalledWith('test-token');
      expect(hentMeldekortDataFraAAP).toHaveBeenCalledWith('test-token');
    });

    it('should include all three ytelser when all have data', async () => {
      const { hentMeldekortDataFraDP } = await import('../clients/dagpenger');
      const { hentMeldekortDataFraTTL } = await import('../clients/tiltakspenger');
      const { hentMeldekortDataFraAAP } = await import('../clients/arbeidsavklaringspenger');

      const dpData: MeldekortData = {
        harInnsendteMeldekort: true,
        meldekortTilUtfylling: [],
        redirectUrl: 'https://dp.nav.no',
      };

      const ttlData: MeldekortData = {
        harInnsendteMeldekort: false,
        meldekortTilUtfylling: [
          {
            kanSendesFra: '2024-01-01T00:00:00',
            kanFyllesUtFra: '2024-01-01T00:00:00',
            fristForInnsending: '2024-01-14T00:00:00',
          },
        ],
        redirectUrl: 'https://ttl.nav.no',
      };

      const aapData: MeldekortData = {
        harInnsendteMeldekort: true,
        meldekortTilUtfylling: [],
        redirectUrl: 'https://aap.nav.no',
      };

      vi.mocked(hentMeldekortDataFraDP).mockResolvedValue(dpData);
      vi.mocked(hentMeldekortDataFraTTL).mockResolvedValue(ttlData);
      vi.mocked(hentMeldekortDataFraAAP).mockResolvedValue(aapData);

      const result = await getMeldekortResultat('test-token');

      expect(result.redirectUrl).toBeUndefined();
      expect(result.data).toEqual({ dp: dpData, ttl: ttlData, aap: aapData });
    });
  });
});
