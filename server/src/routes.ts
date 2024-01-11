import { Request, Response } from "express";
import { ParamsDictionary } from "express-serve-static-core";


// Require type checking of request body.
type SafeRequest = Request<ParamsDictionary, {}, Record<string, unknown>>;
type SafeResponse = Response;  // only writing, so no need to check


// Description of an individual poll
// RI: minBid, maxBid >= 0
type Poll = {
  name: string,
  endTime: number,  // ms since epoch
  options: Array<string>,
  votes: Record<string, string> // name to option
};


// Map from name to poll details.
const polls: Map<string, Poll> = new Map();


/** Testing function to remove all the added polls. */
export const resetForTesting = (): void => {
  polls.clear();
};

/** Testing function to move all end times forward the given amount (of ms). */
export const advanceTimeForTesting = (ms: number): void => {
  for (const poll of polls.values()) {
    poll.endTime -= ms;
  }
};


// Sort polls with the ones finishing soonest first, but with all those that
// are completed after those that are not and in reverse order by end time.
const comparePolls = (a: Poll, b: Poll): number => {
  const now: number = Date.now();
  const endA = now <= a.endTime ? a.endTime : 1e15 - a.endTime;
  const endB = now <= b.endTime ? b.endTime : 1e15 - b.endTime;
  return endA - endB;
};

/**
 * Returns a list of all the polls, sorted so that the ongoing polls come
 * first, with the ones about to end listed first, and the completed ones after,
 * with the ones completed more recently
 * @param _req the request
 * @param res the response
 */
export const listPolls = (_req: SafeRequest, res: SafeResponse): void => {
  const vals = Array.from(polls.values());
  vals.sort(comparePolls);
  res.send({polls: vals});
};


/**
 * Add the item to the list.
 * @param req the request
 * @param res the response
 */
export const addPoll = (req: SafeRequest, res: SafeResponse): void => {
  const name = req.body.name;
  if (typeof name !== 'string') {
    res.status(400).send("missing 'name' parameter");
    return;
  }

  const minutes = req.body.minutes;
  if (typeof minutes !== "number") {
    res.status(400).send(`'minutes' is not a number: ${minutes}`);
    return;
  } else if (isNaN(minutes) || minutes < 1 || Math.round(minutes) !== minutes) {
    res.status(400).send(`'minutes' is not a positive integer: ${minutes}`);
    return;
  }

  const options = req.body.options;
  if (!Array.isArray(options)) {
    res.status(400).send(`'options' is not an array: ${options}`);
    return;
  }

  const votes = {};

  // Make sure there is no poll with this name already.
  if (polls.has(name)) {
    res.status(400).send(`poll for '${name}' already exists`);
    return;
  }

  const poll: Poll = {
    name: name,
    endTime: Date.now() + minutes * 60 * 1000,  // convert to ms
    options: options,
    votes: votes
  };
  polls.set(poll.name, poll); // add this to the map of polls
  res.send({poll: poll});  // send the poll we made
}


/**
 * Vote in an poll
 * @param req the request
 * @param req the response
 */
export const voteInPoll = (req: SafeRequest, res: SafeResponse): void => {
  const voter = req.body.voter;
  if (typeof voter !== 'string') {
    res.status(400).send("missing or invalid 'voter' parameter");
    return;
  }

  const name = req.body.name;
  if (typeof name !== "string") {
    res.status(400).send("missing or invalid 'name' parameter");
    return;
  }

  const poll = polls.get(name);
  if (poll === undefined) {
    res.status(400).send(`no poll with name '${name}'`);
    return;
  }

  const now = Date.now();
  if (now >= poll.endTime) {
    res.status(400).send(`poll for "${poll.name}" has already ended`);
    return;
  }

  const vote = req.body.vote;
  if (typeof vote !== "string") {
    res.status(400).send(`'vote' is not a string: ${vote}`);
    return;
  }

  poll.votes[voter] = vote;
  res.send({poll: poll});  // send back the updated poll state
}


/**
 * Retrieves the current state of a given poll.
 * @param req the request
 * @param req the response
 */
export const getPoll = (req: SafeRequest, res: SafeResponse): void => {
  const name = req.body.name;
  if (typeof name !== "string") {
    res.status(400).send("missing or invalid 'name' parameter");
    return;
  }

  const poll = polls.get(name);
  if (poll === undefined) {
    res.status(400).send(`no poll with name '${name}'`);
    return;
  }

  res.send({poll: poll});  // send back the current poll state
}
