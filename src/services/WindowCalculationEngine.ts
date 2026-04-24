import { Event, TimeWindow, ValidationResponse } from '../types';
import { isWithinInterval, parseISO } from 'date-fns';

export class WindowCalculationEngine {
  public validateTiming(event: Event, releaseTimestampStr: string, targetEnv: string): ValidationResponse {
    const releaseTime = parseISO(releaseTimestampStr);

    const checkWindow = (window: TimeWindow) => {
      if (!window.enabled || !window.start || !window.end || !targetEnv) return false;
      const start = parseISO(window.start);
      const end = parseISO(window.end);
      return isWithinInterval(releaseTime, { start, end });
    };

    if (!event.event_enabled || !event.event_open_for_delivery) {
      return {
        isValid: false,
        phase: null,
        message: `Event ${event.id} is not enabled or not open for delivery.`,
      };
    }

    const envKey = targetEnv.toLowerCase() as 'test' | 'preprod' | 'prod';
    if (['test', 'preprod', 'prod'].includes(envKey)) {
      if (checkWindow(event.time_windows[envKey])) {
        return {
          isValid: true,
          phase: targetEnv as 'TEST' | 'PREPROD' | 'PROD',
          message: `Release is within the ${targetEnv} window for event ${event.id}.`,
        }
      } else {
        return {
          isValid: false,
          phase: targetEnv as 'TEST' | 'PREPROD' | 'PROD',
          message: `Release is within the ${targetEnv} window for event ${event.id}, but target environment is ${targetEnv}.`,
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
