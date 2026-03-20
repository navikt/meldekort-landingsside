import { onLanguageSelect } from '@navikt/nav-dekoratoren-moduler';

onLanguageSelect((language: { locale: string }) => {
  // Use relative path to work with base path
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');
  fetch(`${basePath}/api/language`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ language: language.locale }),
  })
    .then((response) => {
      if (response.ok) {
        window.location.reload();
      } else {
        console.error('Failed to set language');
      }
    })
    .catch((error) => {
      console.error('Error setting language:', error);
    });
});
