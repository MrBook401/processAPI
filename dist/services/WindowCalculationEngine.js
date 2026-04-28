"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WindowCalculationEngine = void 0;
const date_fns_1 = require("date-fns");
class WindowCalculationEngine {
    validateTiming(event, releaseTimestampStr, targetEnv) {
        if (!event || !releaseTimestampStr || !targetEnv) {
            return {
                isValid: false,
                phase: null,
                message: `Missing required information: event, release timestamp, or target environment.`,
            };
        }
        const releaseTime = (0, date_fns_1.parseISO)(releaseTimestampStr);
        if (isNaN(releaseTime.getTime())) {
            return {
                isValid: false,
                phase: null,
                message: `Invalid release timestamp provided.`,
            };
        }
        const checkWindow = (window) => {
            if (!window || !window.enabled || !window.start || !window.end)
                return false;
            const start = window.start;
            const end = window.end;
            return (0, date_fns_1.isWithinInterval)(releaseTime, { start, end });
        };
        if (!event.event_enabled || !event.event_open_for_delivery) {
            return {
                isValid: false,
                phase: null,
                message: `Event ${event.id} is not enabled or not open for delivery.`,
            };
        }
        const envKey = targetEnv.toLowerCase();
        if (['test', 'preprod', 'prod'].includes(envKey)) {
            // null dates mean the window is open, so we consider it valid without checking the time
            if (event.time_windows[envKey].start === null && event.time_windows[envKey].end === null) {
                return {
                    isValid: true,
                    phase: targetEnv,
                    message: `No controls on time window needed`,
                };
            }
            if (checkWindow(event.time_windows[envKey])) {
                return {
                    isValid: true,
                    phase: targetEnv,
                    message: `Release is within the ${targetEnv} window for event ${event.id}.`,
                };
            }
            else {
                return {
                    isValid: false,
                    phase: targetEnv,
                    message: `Release is not within the ${targetEnv} window for event ${event.id}`,
                };
            }
        }
        return {
            isValid: false,
            phase: null,
            message: `Release was created outside of all allowed windows for event ${event.id}.`,
        };
    }
}
exports.WindowCalculationEngine = WindowCalculationEngine;
