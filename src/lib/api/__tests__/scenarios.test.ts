import { describe, it, expect } from 'vitest';
import { getScenario, getScenarioUrl, getScenarioDisplayName, scenarios } from '../scenarios';

describe('scenarios', () => {
  describe('getScenario', () => {
    it('skal returnere default scenario når name er undefined', () => {
      const result = getScenario(undefined);
      expect(result).toEqual(scenarios.default);
    });

    it('skal returnere default scenario når name er tom streng', () => {
      const result = getScenario('');
      expect(result).toEqual(scenarios.default);
    });

    it('skal returnere default scenario når name ikke finnes', () => {
      const result = getScenario('finnes-ikke');
      expect(result).toEqual(scenarios.default);
    });

    it('skal returnere riktig scenario når name er "default"', () => {
      const result = getScenario('default');
      expect(result).toEqual(scenarios.default);
    });

    it('skal returnere riktig scenario når name er "ingen-meldekort"', () => {
      const result = getScenario('ingen-meldekort');
      expect(result).toEqual(scenarios['ingen-meldekort']);
      expect(result.dagpenger).toBeUndefined();
      expect(result.aap).toBeUndefined();
      expect(result.tiltakspenger).toBeUndefined();
    });

    it('skal returnere riktig scenario når name er "kun-dagpenger"', () => {
      const result = getScenario('kun-dagpenger');
      expect(result).toEqual(scenarios['kun-dagpenger']);
      expect(result.dagpenger).toBeDefined();
      expect(result.aap).toBeUndefined();
      expect(result.tiltakspenger).toBeUndefined();
    });

    it('skal returnere riktig scenario når name er "kun-aap"', () => {
      const result = getScenario('kun-aap');
      expect(result).toEqual(scenarios['kun-aap']);
      expect(result.dagpenger).toBeUndefined();
      expect(result.aap).toBeDefined();
      expect(result.tiltakspenger).toBeUndefined();
    });

    it('skal returnere riktig scenario når name er "kun-tp"', () => {
      const result = getScenario('kun-tp');
      expect(result).toEqual(scenarios['kun-tp']);
      expect(result.dagpenger).toBeUndefined();
      expect(result.aap).toBeUndefined();
      expect(result.tiltakspenger).toBeDefined();
    });

    it('skal returnere riktig scenario når name er "aap-og-tp"', () => {
      const result = getScenario('aap-og-tp');
      expect(result).toEqual(scenarios['aap-og-tp']);
      expect(result.dagpenger).toBeUndefined();
      expect(result.aap).toBeDefined();
      expect(result.tiltakspenger).toBeDefined();
    });

    it('skal returnere riktig scenario når name er "alle-ytelser"', () => {
      const result = getScenario('alle-ytelser');
      expect(result).toEqual(scenarios['alle-ytelser']);
      expect(result.dagpenger).toBeDefined();
      expect(result.aap).toBeDefined();
      expect(result.tiltakspenger).toBeDefined();
    });

    it('skal returnere riktig scenario når name er "kun-innsendte"', () => {
      const result = getScenario('kun-innsendte');
      expect(result).toEqual(scenarios['kun-innsendte']);
      expect(result.dagpenger?.innsendteMeldekort).toBe(true);
      expect(result.aap?.innsendteMeldekort).toBe(true);
      expect(result.tiltakspenger?.innsendteMeldekort).toBe(true);
      expect(result.dagpenger?.meldekortTilUtfylling).toEqual([]);
      expect(result.aap?.meldekortTilUtfylling).toEqual([]);
      expect(result.tiltakspenger?.meldekortTilUtfylling).toEqual([]);
    });

    it('skal returnere riktig scenario når name er "kun-utfylling"', () => {
      const result = getScenario('kun-utfylling');
      expect(result).toEqual(scenarios['kun-utfylling']);
      expect(result.dagpenger?.innsendteMeldekort).toBe(false);
      expect(result.aap?.innsendteMeldekort).toBe(false);
      expect(result.tiltakspenger?.innsendteMeldekort).toBe(false);
      expect(result.dagpenger?.meldekortTilUtfylling.length).toBeGreaterThan(0);
      expect(result.aap?.meldekortTilUtfylling.length).toBeGreaterThan(0);
      expect(result.tiltakspenger?.meldekortTilUtfylling.length).toBeGreaterThan(0);
    });
  });

  describe('getScenarioUrl', () => {
    it('skal returnere base URL for default scenario', () => {
      const result = getScenarioUrl('default');
      expect(result).toBe('/meldekort');
    });

    it('skal returnere URL med query parameter for andre scenarier', () => {
      const result = getScenarioUrl('kun-dagpenger');
      expect(result).toBe('/meldekort?scenario=kun-dagpenger');
    });

    it('skal returnere URL med query parameter for ingen-meldekort', () => {
      const result = getScenarioUrl('ingen-meldekort');
      expect(result).toBe('/meldekort?scenario=ingen-meldekort');
    });

    it('skal returnere URL med query parameter for alle-ytelser', () => {
      const result = getScenarioUrl('alle-ytelser');
      expect(result).toBe('/meldekort?scenario=alle-ytelser');
    });

    it('skal returnere URL med query parameter for aap-og-tp', () => {
      const result = getScenarioUrl('aap-og-tp');
      expect(result).toBe('/meldekort?scenario=aap-og-tp');
    });

    it('skal returnere URL med query parameter for kun-innsendte', () => {
      const result = getScenarioUrl('kun-innsendte');
      expect(result).toBe('/meldekort?scenario=kun-innsendte');
    });

    it('skal returnere URL med query parameter for kun-utfylling', () => {
      const result = getScenarioUrl('kun-utfylling');
      expect(result).toBe('/meldekort?scenario=kun-utfylling');
    });

    it('skal håndtere scenarionavn som ikke finnes (returnerer URL med query parameter)', () => {
      const result = getScenarioUrl('finnes-ikke');
      expect(result).toBe('/meldekort?scenario=finnes-ikke');
    });
  });

  describe('getScenarioDisplayName', () => {
    it('skal returnere spesiell tekst for default scenario', () => {
      const result = getScenarioDisplayName('default');
      expect(result).toBe('Standard (ingen scenario parameter)');
    });

    it('skal returnere scenarionavnet for andre scenarier', () => {
      const result = getScenarioDisplayName('kun-dagpenger');
      expect(result).toBe('kun-dagpenger');
    });

    it('skal returnere scenarionavnet for ingen-meldekort', () => {
      const result = getScenarioDisplayName('ingen-meldekort');
      expect(result).toBe('ingen-meldekort');
    });

    it('skal returnere scenarionavnet for alle-ytelser', () => {
      const result = getScenarioDisplayName('alle-ytelser');
      expect(result).toBe('alle-ytelser');
    });

    it('skal returnere scenarionavnet for aap-og-tp', () => {
      const result = getScenarioDisplayName('aap-og-tp');
      expect(result).toBe('aap-og-tp');
    });

    it('skal returnere scenarionavnet for kun-innsendte', () => {
      const result = getScenarioDisplayName('kun-innsendte');
      expect(result).toBe('kun-innsendte');
    });

    it('skal returnere scenarionavnet for kun-utfylling', () => {
      const result = getScenarioDisplayName('kun-utfylling');
      expect(result).toBe('kun-utfylling');
    });

    it('skal returnere scenarionavnet selv om det ikke finnes', () => {
      const result = getScenarioDisplayName('finnes-ikke');
      expect(result).toBe('finnes-ikke');
    });
  });
});
