import { WindowCalculationEngine } from '../services/WindowCalculationEngine';
import { Event } from '../types';

describe('WindowCalculationEngine', () => {
  const engine = new WindowCalculationEngine();

  const event: Event = {
    id: 'evt-1',
    name: 'Test Event',
    test_window: { start: '2026-05-01T00:00:00Z', end: '2026-05-07T23:59:59Z', enabled: false },
    preprod_window: { start: '2026-05-08T00:00:00Z', end: '2026-05-14T23:59:59Z', enabled: true },
    prod_window: { start: '2026-05-15T00:00:00Z', end: '2026-05-20T23:59:59Z', enabled: true },
  };

  it('validates inside TEST window', () => {
    const res = engine.validateTiming(event, '2026-05-02T12:00:00Z', 'TEST');
    expect(res.isValid).toBe(false);
    expect(res.phase).toBe('TEST');
  });

  it('validates inside PREPROD window', () => {
    const res = engine.validateTiming(event, '2026-05-10T12:00:00Z', 'PREPROD');
    expect(res.isValid).toBe(true);
    expect(res.phase).toBe('PREPROD');
  });

  it('validates inside PROD window', () => {
    const res = engine.validateTiming(event, '2026-05-16T12:00:00Z', 'PROD');
    expect(res.isValid).toBe(true);
    expect(res.phase).toBe('PROD');
  });

  it('invalidates before any window', () => {
    const res = engine.validateTiming(event, '2026-04-01T00:00:00Z', 'PROD');
    expect(res.isValid).toBe(false);
    expect(res.phase).toBe('PROD');
  });

  it('invalidates after all windows', () => {
    const res = engine.validateTiming(event, '2026-06-01T00:00:00Z','PROD');
    expect(res.isValid).toBe(false);
    expect(res.phase).toBe('PROD');
  });

  it('invalidates inside a disabled window', () => {
    const disabledEvent = {
      ...event,
      test_window: { ...event.test_window, enabled: false }
    };
    const res = engine.validateTiming(disabledEvent, '2026-05-02T12:00:00Z', 'null');
    expect(res.isValid).toBe(false);
    expect(res.phase).toBe(null);
  });
});
