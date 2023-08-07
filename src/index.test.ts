import { test } from 'vitest';
import {
  decodeJsonParams,
  decodeJsonParamsAsString,
  encodeObjectAsJsonParams,
} from '.';

type ParameterizableValue =
  | (string | number | bigint | boolean | Date | null | ParameterizableValue[])
  | undefined;
type ParameterizableObject = Record<string, ParameterizableValue>;

const paramsToObjectMap: Record<string, ParameterizableObject> = {
  "s1='xyz'": { s1: 'xyz' },
  "s1='abc%28%27%29'": { s1: "abc(')" },
  'i1=123': { i1: 123 },
  'i1=123.456': { i1: 123.456 },
  'I1=123': { I1: BigInt(123) },
  'b1=true': { b1: true },
  'b1=false': { b1: false },
  'n1=null': { n1: null },
  "d1='2021-01-01T00%3A00%3A00.000Z'": {
    d1: new Date('2021-01-01T00:00:00.000Z'),
  },
  'a1=(1%2C2%2C3)': { a1: [1, 2, 3] },
  "a2=('a%2C1'%2C'b%2C2'%2C'c%2C3')": { a2: ['a,1', 'b,2', 'c,3'] },
  "s1='xyz'&s2='abc'&i1=123&i2=456&I1=123&I2=456&b1=true&b2=false&n1=null&d1='2021-01-01T00%3A00%3A00.000Z'&a1=(1%2C2%2C3)&a2=('a%2C1'%2C'b%2C2'%2C'c%2C3')":
    {
      s1: 'xyz',
      s2: 'abc',
      i1: 123,
      i2: 456,
      I1: BigInt(123),
      I2: BigInt(456),
      b1: true,
      b2: false,
      n1: null,
      d1: new Date('2021-01-01T00:00:00.000Z'),
      a1: [1, 2, 3],
      a2: ['a,1', 'b,2', 'c,3'],
    },
};

test('encoding and decoding query parameters', () => {
  for (const [params, obj] of Object.entries(paramsToObjectMap)) {
    const encoded = encodeObjectAsJsonParams(obj);
    expect(encoded).toEqual(params);

    const decodedAsObject = decodeJsonParams(params);
    expect(decodedAsObject).toEqual(replaceLossyParams(obj));

    const decodedAsString = decodeJsonParamsAsString(params);
    expect(decodedAsString).toEqual(JSON.stringify(replaceLossyParams(obj)));
  }
});

function replaceLossyParams(obj: Record<string, any>): object {
  const replacement = { ...obj };
  for (const [key, value] of Object.entries(obj)) {
    if (value instanceof Date) {
      replacement[key] = value.toJSON();
    } else if (typeof value === 'bigint') {
      replacement[key] = Number(value);
    }
  }
  return replacement;
}
