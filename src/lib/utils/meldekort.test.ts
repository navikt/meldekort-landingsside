import { beforeEach, describe, expect, it, vi } from 'vitest';
import { erstattPlassholdere, kanFyllesUt, kanSendes, skalViseLenker } from './meldekort';
import type { AlleMeldekortData, MeldekortTilUtfylling } from '../types/meldekort';

describe('erstattPlassholdere', () => {
  it('erstatter {{ytelse}} med ytelsesnavn', () => {
    const resultat = erstattPlassholdere('Send {{ytelse}}-meldekort', 'dagpenger', undefined, 'nb');
    expect(resultat).toBe('Send dagpenger-meldekort');
  });

  it('erstatter {{dato}} med formatert dato på norsk', () => {
    const resultat = erstattPlassholdere('Frist: {{dato}}', 'dagpenger', '2026-03-24', 'nb');
    expect(resultat).toBe('Frist: 24. mars 2026');
  });

  it('erstatter {{dato}} med formatert dato på engelsk', () => {
    const resultat = erstattPlassholdere('Deadline: {{dato}}', 'dagpenger', '2026-03-24', 'en');
    expect(resultat).toBe('Deadline: 24 March 2026');
  });

  it('erstatter både {{ytelse}} og {{dato}}', () => {
    const resultat = erstattPlassholdere(
      'Send {{ytelse}}-meldekort innen {{dato}}',
      'dagpenger',
      '2026-03-24',
      'nb',
    );
    expect(resultat).toBe('Send dagpenger-meldekort innen 24. mars 2026');
  });

  it('håndterer undefined dato ved å fjerne {{dato}}', () => {
    const resultat = erstattPlassholdere(
      'Send {{ytelse}}-meldekort innen {{dato}}',
      'tiltakspenger',
      undefined,
      'nb',
    );
    expect(resultat).toBe('Send tiltakspenger-meldekort innen ');
  });

  it('håndterer ISO 8601 timestamp med tid', () => {
    const resultat = erstattPlassholdere('Frist: {{dato}}', 'aap', '2026-03-24T12:00:00', 'nb');
    expect(resultat).toBe('Frist: 24. mars 2026');
  });

  it('erstatter flere forekomster av samme placeholder', () => {
    const resultat = erstattPlassholdere(
      '{{ytelse}} {{ytelse}} {{dato}} {{dato}}',
      'aap',
      '2026-01-15',
      'nb',
    );
    expect(resultat).toBe('aap aap 15. januar 2026 15. januar 2026');
  });

  it('parser datoer uten timezone i Oslo timezone', () => {
    // Uten timezone info skal datoen parseres i Oslo timezone
    // Dette sikrer at "2026-03-24T00:00:00" blir midnatt i Oslo, ikke lokal tid
    const resultat = erstattPlassholdere(
      'Dato: {{dato}}',
      'dagpenger',
      '2026-03-24T00:00:00',
      'nb',
    );
    expect(resultat).toBe('Dato: 24. mars 2026');
  });

  it('håndterer datoer med eksplisitt UTC timezone (Z)', () => {
    // Med Z suffix skal datoen parseres som UTC
    const resultat = erstattPlassholdere(
      'Dato: {{dato}}',
      'dagpenger',
      '2026-03-24T00:00:00Z',
      'nb',
    );
    // UTC midnight blir 01:00 i Oslo (UTC+1), men vi viser fortsatt 24. mars
    expect(resultat).toBe('Dato: 24. mars 2026');
  });

  it('håndterer datoer med eksplisitt timezone offset', () => {
    const resultat = erstattPlassholdere(
      'Dato: {{dato}}',
      'dagpenger',
      '2026-03-24T00:00:00+01:00',
      'nb',
    );
    expect(resultat).toBe('Dato: 24. mars 2026');
  });
});

describe('kanSendes', () => {
  beforeEach(() => {
    // Sett fast tid: 2026-03-20 kl 14:00 Oslo tid
    vi.setSystemTime(new Date('2026-03-20T13:00:00Z')); // UTC tid (Oslo er +1)
  });

  it('returnerer true når kanSendesFra er i dag', () => {
    const meldekort: MeldekortTilUtfylling = {
      kanSendesFra: '2026-03-20',
      kanFyllesUtFra: null,
      fristForInnsending: '2026-03-27',
    };
    expect(kanSendes(meldekort)).toBe(true);
  });

  it('returnerer true når kanSendesFra er i fortiden', () => {
    const meldekort: MeldekortTilUtfylling = {
      kanSendesFra: '2026-03-15',
      kanFyllesUtFra: null,
      fristForInnsending: '2026-03-27',
    };
    expect(kanSendes(meldekort)).toBe(true);
  });

  it('returnerer false når kanSendesFra er i fremtiden', () => {
    const meldekort: MeldekortTilUtfylling = {
      kanSendesFra: '2026-03-25',
      kanFyllesUtFra: null,
      fristForInnsending: '2026-04-01',
    };
    expect(kanSendes(meldekort)).toBe(false);
  });

  it('håndterer ISO 8601 timestamp format', () => {
    const meldekort: MeldekortTilUtfylling = {
      kanSendesFra: '2026-03-20T00:00:00',
      kanFyllesUtFra: null,
      fristForInnsending: '2026-03-27',
    };
    expect(kanSendes(meldekort)).toBe(true);
  });

  it('sammenligner start of day uavhengig av tidspunkt', () => {
    // Selv om vi setter tid til midt på dagen, skal det sammenlignes med start of day
    const meldekort: MeldekortTilUtfylling = {
      kanSendesFra: '2026-03-20T23:59:59',
      kanFyllesUtFra: null,
      fristForInnsending: '2026-03-27',
    };
    expect(kanSendes(meldekort)).toBe(true);
  });
});

describe('kanFyllesUt', () => {
  beforeEach(() => {
    // Sett fast tid: 2026-03-20 kl 14:00 Oslo tid
    vi.setSystemTime(new Date('2026-03-20T13:00:00Z'));
  });

  it('returnerer true når kanFyllesUtFra er null', () => {
    const meldekort: MeldekortTilUtfylling = {
      kanSendesFra: '2026-03-25',
      kanFyllesUtFra: null,
      fristForInnsending: '2026-04-01',
    };
    expect(kanFyllesUt(meldekort)).toBe(true);
  });

  it('returnerer true når kanFyllesUtFra er i dag', () => {
    const meldekort: MeldekortTilUtfylling = {
      kanSendesFra: '2026-03-25',
      kanFyllesUtFra: '2026-03-20',
      fristForInnsending: '2026-04-01',
    };
    expect(kanFyllesUt(meldekort)).toBe(true);
  });

  it('returnerer true når kanFyllesUtFra er i fortiden', () => {
    const meldekort: MeldekortTilUtfylling = {
      kanSendesFra: '2026-03-25',
      kanFyllesUtFra: '2026-03-10',
      fristForInnsending: '2026-04-01',
    };
    expect(kanFyllesUt(meldekort)).toBe(true);
  });

  it('returnerer false når kanFyllesUtFra er i fremtiden', () => {
    const meldekort: MeldekortTilUtfylling = {
      kanSendesFra: '2026-03-25',
      kanFyllesUtFra: '2026-03-22',
      fristForInnsending: '2026-04-01',
    };
    expect(kanFyllesUt(meldekort)).toBe(false);
  });

  it('håndterer ISO 8601 timestamp format', () => {
    const meldekort: MeldekortTilUtfylling = {
      kanSendesFra: '2026-03-25',
      kanFyllesUtFra: '2026-03-20T00:00:00',
      fristForInnsending: '2026-04-01',
    };
    expect(kanFyllesUt(meldekort)).toBe(true);
  });
});

describe('skalViseLenker', () => {
  beforeEach(() => {
    // Sett fast tid: 2026-03-20 kl 14:00 Oslo tid
    vi.setSystemTime(new Date('2026-03-20T13:00:00Z'));
  });

  it('viser "Send inn" kort når meldekort kan sendes', () => {
    const data: AlleMeldekortData = {
      dagpenger: {
        harInnsendteMeldekort: false,
        meldekortTilUtfylling: [
          {
            kanSendesFra: '2026-03-10',
            kanFyllesUtFra: null,
            fristForInnsending: '2026-03-24',
          },
        ],
        redirectUrl: 'https://dagpenger.url',
      },
    };

    const visning = skalViseLenker(data);

    expect(visning.sende).toHaveLength(1);
    expect(visning.sende[0]).toEqual({
      url: 'https://dagpenger.url',
      ytelse: 'dagpenger',
      dato: '2026-03-24',
      harOgsaInnsendte: false,
    });
    expect(visning.se).toHaveLength(0);
    expect(visning.fyllUt).toHaveLength(0);
  });

  it('viser "Se innsendte" kort når kun innsendte meldekort finnes', () => {
    const data: AlleMeldekortData = {
      dagpenger: {
        harInnsendteMeldekort: true,
        meldekortTilUtfylling: [],
        redirectUrl: 'https://dagpenger.url',
      },
    };

    const visning = skalViseLenker(data);

    expect(visning.se).toHaveLength(1);
    expect(visning.se[0]).toEqual({
      url: 'https://dagpenger.url',
      ytelse: 'dagpenger',
      dato: undefined,
    });
    expect(visning.sende).toHaveLength(0);
    expect(visning.fyllUt).toHaveLength(0);
  });

  it('viser "Fyll ut" kort for AAP når meldekort kan fylles ut men ikke sendes', () => {
    const data: AlleMeldekortData = {
      aap: {
        harInnsendteMeldekort: false,
        meldekortTilUtfylling: [
          {
            kanSendesFra: '2026-03-31', // I fremtiden
            kanFyllesUtFra: '2026-03-10', // I fortiden
            fristForInnsending: '2026-04-07',
          },
        ],
        redirectUrl: 'https://aap.url',
      },
    };

    const visning = skalViseLenker(data);

    expect(visning.fyllUt).toHaveLength(1);
    expect(visning.fyllUt[0]).toEqual({
      url: 'https://aap.url',
      ytelse: 'aap',
      dato: '2026-03-31',
    });
    expect(visning.sende).toHaveLength(0);
    expect(visning.se).toHaveLength(0);
  });

  it('viser IKKE "Fyll ut" kort for dagpenger selv om det kan fylles ut', () => {
    const data: AlleMeldekortData = {
      dagpenger: {
        harInnsendteMeldekort: false,
        meldekortTilUtfylling: [
          {
            kanSendesFra: '2026-03-31',
            kanFyllesUtFra: '2026-03-10',
            fristForInnsending: '2026-04-07',
          },
        ],
        redirectUrl: 'https://dagpenger.url',
      },
    };

    const visning = skalViseLenker(data);

    expect(visning.fyllUt).toHaveLength(0);
    expect(visning.sende).toHaveLength(0);
    expect(visning.se).toHaveLength(0);
  });

  it('viser "Send inn" med harOgsaInnsendte=true når både kan sendes og har innsendte', () => {
    const data: AlleMeldekortData = {
      tiltakspenger: {
        harInnsendteMeldekort: true,
        meldekortTilUtfylling: [
          {
            kanSendesFra: '2026-03-10',
            kanFyllesUtFra: null,
            fristForInnsending: '2026-03-24',
          },
        ],
        redirectUrl: 'https://tiltakspenger.url',
      },
    };

    const visning = skalViseLenker(data);

    expect(visning.sende).toHaveLength(1);
    expect(visning.sende[0]).toEqual({
      url: 'https://tiltakspenger.url',
      ytelse: 'tiltakspenger',
      dato: '2026-03-24',
      harOgsaInnsendte: true,
    });
  });

  it('velger nærmeste frist når flere meldekort kan sendes', () => {
    const data: AlleMeldekortData = {
      dagpenger: {
        harInnsendteMeldekort: false,
        meldekortTilUtfylling: [
          {
            kanSendesFra: '2026-03-10',
            kanFyllesUtFra: null,
            fristForInnsending: '2026-03-31',
          },
          {
            kanSendesFra: '2026-03-05',
            kanFyllesUtFra: null,
            fristForInnsending: '2026-03-24',
          },
          {
            kanSendesFra: '2026-03-15',
            kanFyllesUtFra: null,
            fristForInnsending: '2026-04-07',
          },
        ],
        redirectUrl: 'https://dagpenger.url',
      },
    };

    const visning = skalViseLenker(data);

    expect(visning.sende).toHaveLength(1);
    expect(visning.sende[0]?.dato).toBe('2026-03-24');
  });

  it('håndterer flere ytelser samtidig', () => {
    const data: AlleMeldekortData = {
      dagpenger: {
        harInnsendteMeldekort: false,
        meldekortTilUtfylling: [
          {
            kanSendesFra: '2026-03-10',
            kanFyllesUtFra: null,
            fristForInnsending: '2026-03-24',
          },
        ],
        redirectUrl: 'https://dagpenger.url',
      },
      aap: {
        harInnsendteMeldekort: false,
        meldekortTilUtfylling: [
          {
            kanSendesFra: '2026-03-31',
            kanFyllesUtFra: '2026-03-10',
            fristForInnsending: '2026-04-07',
          },
        ],
        redirectUrl: 'https://aap.url',
      },
      tiltakspenger: {
        harInnsendteMeldekort: true,
        meldekortTilUtfylling: [],
        redirectUrl: 'https://tiltakspenger.url',
      },
    };

    const visning = skalViseLenker(data);

    expect(visning.sende).toHaveLength(1); // Dagpenger
    expect(visning.fyllUt).toHaveLength(1); // AAP
    expect(visning.se).toHaveLength(1); // Tiltakspenger
  });

  it('viser ingenting når ingen data er tilgjengelig', () => {
    const data: AlleMeldekortData = {};

    const visning = skalViseLenker(data);

    expect(visning.sende).toHaveLength(0);
    expect(visning.se).toHaveLength(0);
    expect(visning.fyllUt).toHaveLength(0);
  });

  it('prioriterer "Send inn" over "Se innsendte"', () => {
    const data: AlleMeldekortData = {
      dagpenger: {
        harInnsendteMeldekort: true, // Har innsendte
        meldekortTilUtfylling: [
          {
            kanSendesFra: '2026-03-10', // Men kan også sende nye
            kanFyllesUtFra: null,
            fristForInnsending: '2026-03-24',
          },
        ],
        redirectUrl: 'https://dagpenger.url',
      },
    };

    const visning = skalViseLenker(data);

    expect(visning.sende).toHaveLength(1);
    expect(visning.se).toHaveLength(0); // Skal IKKE vise "Se innsendte" når det finnes noe å sende
    expect(visning.fyllUt).toHaveLength(0);
  });

  it('prioriterer "Send inn" over "Fyll ut" for AAP', () => {
    const data: AlleMeldekortData = {
      aap: {
        harInnsendteMeldekort: false,
        meldekortTilUtfylling: [
          {
            kanSendesFra: '2026-03-10', // Kan sendes
            kanFyllesUtFra: '2026-03-05', // Kan også fylles ut
            fristForInnsending: '2026-03-24',
          },
        ],
        redirectUrl: 'https://aap.url',
      },
    };

    const visning = skalViseLenker(data);

    expect(visning.sende).toHaveLength(1);
    expect(visning.fyllUt).toHaveLength(0); // Skal IKKE vise "Fyll ut" når det kan sendes
  });
});
