/**
 * Determines whether the given value is a record.
 * @param val the value in question
 * @return true if the value is a record and false otherwise
 */
export const isRecord = (val: unknown): val is Record<string, unknown> => {
  return val !== null && typeof val === "object";
};

/**
 * Determines whether the given value is a record of strings.
 * @param val the value in question
 * @return true if the value is a record and false otherwise
 */
export const isStringRecord = (val: unknown): val is Record<string, string> => {
  if (!isRecord(val)) return false;
  for (const entry of Object.entries(val)) {
    if (typeof entry[1] !== 'string') {
      return false;
    }
  }
  return true;
}
