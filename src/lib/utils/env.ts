export function getVariables(): Record<string, string> {
    if (typeof window === "undefined") {
        return process.env as Record<string, string>;
    } else {
        return import.meta.env as Record<string, string>;
    }
}

export function getEnv(key: string): string {

    const variables = getVariables();
    const value = variables[key] || variables[`PUBLIC_${key}`];

    if (value === undefined) {
        console.warn(`Miljøvariabelen ${key} er ikke definert`);
    }

    return value || "";
}