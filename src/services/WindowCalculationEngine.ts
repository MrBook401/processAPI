import { Event, TimeWindow, ValidationResponse } from '../types';
import { isWithinInterval, parseISO } from 'date-fns';

export class WindowCalculationEngine {
  public validateTiming(event: Event, releaseTimestampStr: string, targetEnv: string): ValidationResponse {
    const releaseTime = parseISO(releaseTimestampStr);

    if(!event || !releaseTimestampStr || !targetEnv ){
      return {
        isValid: false,
        phase: null,
        message: `Missing required information: event, release timestamp, or target environment.`,
      }
    }

    const checkWindow = (window: TimeWindow) => {
      if (!window || !window.enabled || !window.start || !window.end) return false;

      const start = window.start;
      const end = window.end;

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


// null dates mean the window is open, so we consider it valid without checking the time
      if (event.time_windows[envKey].start === null && event.time_windows[envKey].end === null ) {
        return {
          isValid: true,
          phase: targetEnv as 'TEST' | 'PREPROD' | 'PROD',
          message: `No controls on time window needed`,
        }
      }
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
