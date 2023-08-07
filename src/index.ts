/**
 * The fast JSON query parameter encoding and decoding utilities.
 */

const jsonCharsMap = {
  "'": `"`,
  '(': `[`,
  ')': `]`,
  '=': `":`,
  '&': `,"`,
};

/**
 * Encodes an object as a query parameter string using a syntax that is both
 * human-readable and fast to parse. String values are wrapped in single quotes,
 * with any contained single quotes and parentheses percent-escaped. Array
 * values are wrapped in parentheses. Other values are converted to strings
 * using the `toString()` method. Values are further URL-encoded. Object keys
 * with undefined values are omitted. Nested objects are not allowed.
 * @param obj The object to encode.
 * @returns The encoded query parameter string.
 */
export function encodeObjectAsJsonParams(obj: object): string {
  const paramStrings = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      paramStrings.push(`${key}=${encodeValue(value)}`);
    }
  }
  return paramStrings.join('&');
}

/**
 * Decodes a query parameter string encoded with `encodeObjectAsJsonParams()`,
 * returning its equivalent JavaScript object.
 * @param paramsString The query parameter string to decode.
 * @returns The decoded JavaScript object.
 */
export function decodeJsonParams(paramsString: string): object {
  return JSON.parse(decodeJsonParamsAsString(paramsString));
}

/**
 * Decodes a query parameter string encoded with `encodeObjectAsJsonParams()`,
 * returning its equivalent JSON string.
 * @param paramsString The query parameter string to decode.
 * @returns The decoded JSON string.
 */
export function decodeJsonParamsAsString(paramsString: string): string {
  return (
    '{"' +
    decodeURIComponent(
      paramsString.replace(
        /'|\(|\)|=|&/g,
        (match) => jsonCharsMap[match as keyof typeof jsonCharsMap]
      )
    ) +
    '}'
  );
}

function encodeValue(value: any): string {
  const valueType = typeof value;
  if (valueType === 'string') {
    return `'${encodeURIComponent(value)
      .replaceAll("'", '%27')
      .replaceAll('(', '%28')
      .replaceAll(')', '%29')}'`;
  }
  if (['number', 'boolean', 'bigint'].includes(valueType)) {
    return value.toString();
  }
  if (value instanceof Date) {
    return "'" + encodeURIComponent(value.toJSON()) + "'";
  }
  if (Array.isArray(value)) {
    return `(${value.map((v) => encodeValue(v)).join('%2C')})`;
  }
  if (value === null) {
    return 'null';
  }
  throw Error(`Cannot encode value: ${value}`);
}
