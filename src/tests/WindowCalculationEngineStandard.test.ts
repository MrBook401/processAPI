import { WindowCalculationEngine } from '../services/WindowCalculationEngine';
import { Event } from '../types';

describe('WindowCalculationEngine', () => {
  const engine = new WindowCalculationEngine();

  const event: Event = {
    id: 'evt-1',
    name: 'Test Event',
    created_at: new Date().toISOString(),
    event_enabled: true,
    event_open_for_delivery: true,
    type: 'standard',
    time_windows: {
      test: { start: null, end: null, enabled: true },
      preprod: { start: null, end: null, enabled: true },
      prod: { start: '2026-05-15T00:00:00Z', end: '2026-05-20T23:59:59Z', enabled: true },
    }
  };

  it('validates inside TEST window', () => {
    const res = engine.validateTiming(event, '2026-05-02T12:00:00Z', 'TEST');
    expect(res.isValid).toBe(true);
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
      time_windows: { ...event.time_windows, test: { ...event.time_windows.test, enabled: false } }
    };
    const res = engine.validateTiming(disabledEvent, '2026-05-02T12:00:00Z', 'null');
    expect(res.isValid).toBe(false);
    expect(res.phase).toBe(null);
  });

  it('invalidates when event is disabled', () => {
    const disabledEvent = { ...event, event_enabled: false };
    const res = engine.validateTiming(disabledEvent, '2026-05-02T12:00:00Z', 'TEST');
    expect(res.isValid).toBe(false);
    expect(res.phase).toBe(null);
  });

  it('invalidates when event is not open for delivery', () => {
    const disabledEvent = { ...event, event_open_for_delivery: false };
    const res = engine.validateTiming(disabledEvent, '2026-05-02T12:00:00Z', 'TEST');
    expect(res.isValid).toBe(false);
    expect(res.phase).toBe(null);
  });
});
