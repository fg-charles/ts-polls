import { isRecord, isStringRecord } from "./record";


// Description of an individual poll
// RI: minVote, maxVote >= 0
export type Poll = {
  readonly name: string,
  readonly endTime: number,
  readonly options: Array<string>,
  readonly votes: Record<string, string>; 
};


/**
 * Parses unknown data into an Poll. Will log an error and return undefined
 * if it is not a valid Poll.
 * @param val unknown data to parse into an Poll
 * @return Poll if val is a valid Poll and undefined otherwise
 */
export const parsePoll = (val: unknown): undefined | Poll => {
  if (!isRecord(val)) {
    console.error("not an poll", val)
    return undefined;
  }

  if (typeof val.name !== "string") {
    console.error("not an poll: missing 'name'", val)
    return undefined;
  }

  if (typeof val.endTime !== "number" || val.endTime < 0 || isNaN(val.endTime)) {
    console.error("not an poll: missing or invalid 'endTime'", val)
    return undefined;
  }

  if (!Array.isArray(val.options) || val.options.length < 2) {
    console.error('not a poll: missing or invalid "options"');
    return undefined
  }
  
  if (!isStringRecord(val.votes)) {
    console.error('not a poll: missing or invalid "votes"');
    return undefined
  }

  return {
    name: val.name, endTime: val.endTime,
    options: val.options, votes: val.votes
  };
};
