import { daysUntil, formatMoney } from '@/pages/profile/utils/format';

describe('format', () => {
  it('formats money as dollars and cents', () => {
    expect(formatMoney(6)).toBe('$6.00');
    expect(formatMoney(0)).toBe('$0.00');
  });

  it('rounds days until a time up to whole days', () => {
    const now = new Date('2026-03-01T12:00:00Z');

    expect(daysUntil('2026-03-03T12:00:00Z', now)).toBe(2);
    expect(daysUntil('2026-03-03T13:00:00Z', now)).toBe(3);
    expect(daysUntil('2026-03-01T12:00:00Z', now)).toBe(0);
  });
});
