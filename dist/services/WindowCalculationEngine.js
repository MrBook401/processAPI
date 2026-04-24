"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowCalculationEngine = void 0;
const date_fns_1 = require("date-fns");
class WindowCalculationEngine {
    validateTiming(event, releaseTimestampStr) {
        const releaseTime = (0, date_fns_1.parseISO)(releaseTimestampStr);
        const checkWindow = (window) => {
            if (!window.enabled || !window.start || !window.end)
                return false;
            const start = (0, date_fns_1.parseISO)(window.start);
            const end = (0, date_fns_1.parseISO)(window.end);
            return (0, date_fns_1.isWithinInterval)(releaseTime, { start, end });
        };
        if (checkWindow(event.test_window)) {
            return {
                isValid: true,
                phase: 'TEST',
                message: `Release is within the TEST window for event ${event.id}.`,
            };
        }
        if (checkWindow(event.preprod_window)) {
            return {
                isValid: true,
                phase: 'PREPROD',
                message: `Release is within the PREPROD window for event ${event.id}.`,
            };
        }
        if (checkWindow(event.prod_window)) {
            return {
                isValid: true,
                phase: 'PROD',
                message: `Release is within the PROD window for event ${event.id}.`,
            };
        }
        return {
            isValid: false,
            phase: null,
            message: `Release was created outside of all allowed windows for event ${event.id}.`,
        };
    }
}
exports.WindowCalculationEngine = WindowCalculationEngine;
