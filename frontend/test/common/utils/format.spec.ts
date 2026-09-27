import {
  chipColor,
  daysUntil,
  formatDays,
  formatMoney,
  queueText,
  statusLabel,
} from '@/common/utils/format';

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

  it('pluralises days', () => {
    expect(formatDays(1)).toBe('1 day');
    expect(formatDays(3)).toBe('3 days');
  });

  it('labels and colours a forgiven loan', () => {
    expect(statusLabel.FORGIVEN).toBe('Forgiven');
    expect(chipColor.FORGIVEN).toBe('info');
  });

  it('labels and colours queued and removed reservations', () => {
    expect(statusLabel.QUEUED).toBe('Queued');
    expect(chipColor.QUEUED).toBe('info');
    expect(statusLabel.REMOVED).toBe('Removed');
    expect(chipColor.REMOVED).toBe('error');
  });

  it('describes a queue position', () => {
    expect(queueText(2)).toBe('Number 2 in queue');
  });
});
