export function getVariables(): Record<string, string> {
  return import.meta.env as Record<string, string>;
}

export function getEnv(key: string): string {
  const variables = getVariables();
  const value = variables[key] || variables[`PUBLIC_${key}`];

  if (value === undefined) {
    console.warn(`Miljøvariabelen ${key} er ikke definert`);
  }

  return value || '';
}
