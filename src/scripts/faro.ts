import { initInstrumentation } from "../lib/utils/faro";

// Start analytics når DOM er klar
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInstrumentation);
} else {

    initInstrumentation();
}
