import { Event, TimeWindow, ValidationResponse } from '../types';
import { isWithinInterval, parseISO } from 'date-fns';

export class WindowCalculationEngine {
  public validateTiming(event: Event, releaseTimestampStr: string): ValidationResponse {
    const releaseTime = parseISO(releaseTimestampStr);

    const checkWindow = (window: TimeWindow) => {
      const start = parseISO(window.start);
      const end = parseISO(window.end);
      return isWithinInterval(releaseTime, { start, end });
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
