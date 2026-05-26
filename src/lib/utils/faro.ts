import { type Faro, getWebInstrumentations, initializeFaro } from "@grafana/faro-web-sdk";
import { TracingInstrumentation } from "@grafana/faro-web-tracing";

import { getEnv } from "./env";

let faro: Faro | null = null;

export function initInstrumentation(): void {
    if (typeof window === "undefined" || faro !== null) return;

    getFaro();
}

export function getFaro(): Faro | null {
    if (faro !== null) return faro;

    faro = initializeFaro({
        url: getEnv("FARO_URL"),
        app: {
            name: "meldekort-landingsside",
            version: getEnv("GITHUB_SHA"),
        },
        instrumentations: [
            ...getWebInstrumentations({
                captureConsole: true,
            }),
            new TracingInstrumentation({
                instrumentationOptions: {
                    propagateTraceHeaderCorsUrls: [/https:\/\/[^/]+\.nav\.no\/.*/],
                },
            }),
        ],
        paused: getEnv("IS_LOCALHOST") === "true",
        beforeSend: (item) => {
            if (item.meta?.page?.url) {
                try {
                    const url = new URL(item.meta.page.url);
                    url.search = "";
                    item.meta.page.url = url.toString();
                } catch {
                    /* ignore */
                }
            }
            return item;
        },
    });
    return faro;
}
