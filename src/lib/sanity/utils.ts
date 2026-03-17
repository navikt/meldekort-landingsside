/**
 * Sjekker om Sanity-data mangler eller er ufullstendig.
 * Returnerer true hvis objektet er null/undefined eller hvis noen påkrevde felter mangler.
 */
export function sanityDataMissing<T extends Record<string, unknown>>(
  data: T | null | undefined,
  requiredFields?: (keyof T)[],
): boolean {
  if (!data) return true;

  if (!requiredFields) return false;

  return requiredFields.some((field) => {
    const value = data[field];
    return (
      value === null ||
      value === undefined ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    );
  });
}
