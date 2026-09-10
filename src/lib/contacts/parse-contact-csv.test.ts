import { describe, expect, it } from 'vitest';
import { parseContactCsv, parseTagCell } from './parse-contact-csv';

describe('parseTagCell', () => {
  it('splits comma-separated tags and trims whitespace', () => {
    expect(parseTagCell(' VIP , Lead ,  ')).toEqual(['VIP', 'Lead']);
  });

  it('splits semicolon-separated tags', () => {
    expect(parseTagCell('VIP; Lead; Customer')).toEqual([
      'VIP',
      'Lead',
      'Customer',
    ]);
  });

  it('de-dupes case-insensitively', () => {
    expect(parseTagCell('vip, VIP, Lead')).toEqual(['vip', 'Lead']);
  });

  it('returns empty for blank values', () => {
    expect(parseTagCell('')).toEqual([]);
    expect(parseTagCell(undefined)).toEqual([]);
  });
});

describe('parseContactCsv', () => {
  it('parses optional tags column', () => {
    const csv = `phone,name,tags
+15551234567,Alice,"VIP, Lead"
+15559876543,Bob,Customer`;

    expect(parseContactCsv(csv)).toEqual({
      hasTagsColumn: true,
      hasCompanyColumn: false,
      totalRows: 2,
      invalidRows: 0,
      rows: [
        {
          phone: '+15551234567',
          name: 'Alice',
          email: undefined,
          company: undefined,
          tagNames: ['VIP', 'Lead'],
        },
        {
          phone: '+15559876543',
          name: 'Bob',
          email: undefined,
          company: undefined,
          tagNames: ['Customer'],
        },
      ],
    });
  });

  it('returns empty tagNames when tags column is absent', () => {
    const csv = `phone,name
+15551234567,Alice`;

    expect(parseContactCsv(csv)).toEqual({
      hasTagsColumn: false,
      hasCompanyColumn: false,
      totalRows: 1,
      invalidRows: 0,
      rows: [
        {
          phone: '+15551234567',
          name: 'Alice',
          email: undefined,
          company: undefined,
          tagNames: [],
          customValues: undefined,
        },
      ],
    });
  });

  it('captures custom field columns into customValues map', () => {
    const csv = `phone,name,due_amount,fee_type
+15551234567,Alice,150.00,Tuition`;

    const result = parseContactCsv(csv);
    expect(result.rows[0].customValues).toEqual({
      due_amount: '150.00',
      fee_type: 'Tuition',
    });
  });

  it('counts total and invalid rows correctly when phone cell is empty', () => {
    const csv = `phone,name
+15551234567,Alice
,NoPhone
+15559876543,Bob`;

    const result = parseContactCsv(csv);
    expect(result.totalRows).toBe(3);
    expect(result.invalidRows).toBe(1);
    expect(result.rows).toHaveLength(2);
  });
});
