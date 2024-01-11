import * as assert from 'assert';
import * as httpMocks from 'node-mocks-http';
import { addPoll, voteInPoll, getPoll, listPolls,
         resetForTesting, advanceTimeForTesting } from './routes';

describe('routes', function() {

  it('add', function() {
    // Separate domain for each branch:
    // 1. Missing name
    const req1 = httpMocks.createRequest(
        {method: 'POST', url: '/api/add', body: {}});
    const res1 = httpMocks.createResponse();
    addPoll(req1, res1);
    assert.strictEqual(res1._getStatusCode(), 400);
    assert.deepStrictEqual(res1._getData(),
        "missing 'name' parameter");

        // 6. Missing minutes
    const req7 = httpMocks.createRequest(
        {method: 'POST', url: '/api/add',
         body: {name: "couch", seller: "Fred", description: "a couch",
                minBid: 7}});
    const res7 = httpMocks.createResponse();
    addPoll(req7, res7);
    assert.strictEqual(res7._getStatusCode(), 400);
    assert.deepStrictEqual(res7._getData(),
        "'minutes' is not a number: undefined");

    // 7. Invalid minutes
    const req8 = httpMocks.createRequest(
        {method: 'POST', url: '/api/add',
         body: {name: "couch", minutes: 0, options: ['a', 'b']}});
    const res8 = httpMocks.createResponse();
    addPoll(req8, res8);
    assert.strictEqual(res8._getStatusCode(), 400);
    assert.deepStrictEqual(res8._getData(),
        "'minutes' is not a positive integer: 0");

    const req9 = httpMocks.createRequest(
        {method: 'POST', url: '/api/add',
         body: {name: "couch",  minutes: 3.5, options: ['a', 'b']}});
    const res9 = httpMocks.createResponse();
    addPoll(req9, res9);
    assert.strictEqual(res9._getStatusCode(), 400);
    assert.deepStrictEqual(res9._getData(),
        "'minutes' is not a positive integer: 3.5");

    // Invalid options
    const req12 = httpMocks.createRequest(
        {method: 'POST', url: '/api/add',
         body: {name: "couch", minutes: 3, options:3}});
    const res12 = httpMocks.createResponse();
    addPoll(req12, res12);
    assert.strictEqual(res12._getStatusCode(), 400);
    assert.deepStrictEqual(res12._getData(),
        "'options' is not an array: 3");

    const req13 = httpMocks.createRequest(
        {method: 'POST', url: '/api/add',
         body: {name: "couch", minutes: 3, options:"hello"}});
    const res13 = httpMocks.createResponse();
    addPoll(req13, res13);
    assert.strictEqual(res13._getStatusCode(), 400);
    assert.deepStrictEqual(res13._getData(),
        "'options' is not an array: hello");

    // 8. Correctly added
    const req10 = httpMocks.createRequest(
        {method: 'POST', url: '/api/add',
         body: {name: "couch", minutes: 4, options: ['a', 'b']}});
    const res10 = httpMocks.createResponse();
    addPoll(req10, res10);
    assert.strictEqual(res10._getStatusCode(), 200);
    assert.deepStrictEqual(res10._getData().poll.name, "couch");
    assert.deepStrictEqual(res10._getData().poll.options, ['a', 'b']);
    const endTime10 = res10._getData().poll.endTime;
    assert.ok(Math.abs(endTime10 - Date.now() - 4 * 60 * 1000) < 50);

    const req11 = httpMocks.createRequest(
        {method: 'POST', url: '/api/add',
         body: {name: "chair", minutes: 2, options: ['c', 'd', 'f']}});
    const res11 = httpMocks.createResponse();
    addPoll(req11, res11);
    assert.strictEqual(res11._getStatusCode(), 200);
    assert.deepStrictEqual(res11._getData().poll.name, "chair");
    assert.deepStrictEqual(res11._getData().poll.options, ['c', 'd', 'f']);
    const endTime11 = res11._getData().poll.endTime;
    assert.ok(Math.abs(endTime11 - Date.now() - 2 * 60 * 1000) < 50);

    resetForTesting();
  });

  it('vote', function() {
    const req1 = httpMocks.createRequest(
        {method: 'POST', url: '/api/add',
         body: {name: "couch", minutes: 5, options: ['a', 'b']}});
    const res1 = httpMocks.createResponse();
    addPoll(req1, res1);
    assert.strictEqual(res1._getStatusCode(), 200);
    assert.deepStrictEqual(res1._getData().poll.name, "couch");

    // Separate domain for each branch:
    // 1. Missing voter
    const req2 = httpMocks.createRequest(
        {method: 'POST', url: '/api/vote', body: {}});
    const res2 = httpMocks.createResponse();
    voteInPoll(req2, res2);
    assert.strictEqual(res2._getStatusCode(), 400);
    assert.deepStrictEqual(res2._getData(),
        "missing or invalid 'voter' parameter");

    // 2. Missing name
    const req3 = httpMocks.createRequest(
        {method: 'POST', url: '/api/vote', body: {voter: "Barney"}});
    const res3 = httpMocks.createResponse();
    voteInPoll(req3, res3);
    assert.strictEqual(res3._getStatusCode(), 400);
    assert.deepStrictEqual(res3._getData(),
        "missing or invalid 'name' parameter");

    // 3. Invalid name
    const req4 = httpMocks.createRequest(
        {method: 'POST', url: '/api/vote',
         body: {voter: "Barney", name: "chair"}});
    const res4 = httpMocks.createResponse();
    voteInPoll(req4, res4);
    assert.strictEqual(res4._getStatusCode(), 400);
    assert.deepStrictEqual(res4._getData(), "no poll with name 'chair'");

    const req5 = httpMocks.createRequest(
        {method: 'POST', url: '/api/vote',
         body: {voter: "Barney", name: "stool"}});
    const res5 = httpMocks.createResponse();
    voteInPoll(req5, res5);
    assert.strictEqual(res5._getStatusCode(), 400);
    assert.deepStrictEqual(res5._getData(), "no poll with name 'stool'");

    // 4. vote missing
    const req6 = httpMocks.createRequest(
        {method: 'POST', url: '/api/vote',
         body: {voter: "Barney", name: "couch"}});
    const res6 = httpMocks.createResponse();
    voteInPoll(req6, res6);
    assert.strictEqual(res6._getStatusCode(), 400);
    assert.deepStrictEqual(res6._getData(),
        "'vote' is not a string: undefined");

    // 5. vote invalid
    const req7 = httpMocks.createRequest(
        {method: 'POST', url: '/api/vote',
         body: {voter: "Barney", name: "couch", vote: -1}});
    const res7 = httpMocks.createResponse();
    voteInPoll(req7, res7);
    assert.strictEqual(res7._getStatusCode(), 400);
    assert.deepStrictEqual(res7._getData(),
        "'vote' is not a string: -1");

    // 7. vote made
    const req10 = httpMocks.createRequest(
        {method: 'POST', url: '/api/vote',
         body: {voter: "Barney", name: "couch", vote: 'a'}});
    const res10 = httpMocks.createResponse();
    voteInPoll(req10, res10);
    assert.strictEqual(res10._getStatusCode(), 200);
    assert.deepStrictEqual(res10._getData().poll.name, "couch");
    assert.deepStrictEqual(res10._getData().poll.votes, {'Barney': 'a'});

    const req11 = httpMocks.createRequest(
        {method: 'POST', url: '/api/vote',
         body: {voter: "Fred", name: "couch", vote: 'b'}});
    const res11 = httpMocks.createResponse();
    voteInPoll(req11, res11);
    assert.strictEqual(res11._getStatusCode(), 200);
    assert.deepStrictEqual(res11._getData().poll.name, "couch");
    assert.deepStrictEqual(res11._getData().poll.votes, {'Barney': 'a', 'Fred':'b'});

    const req8 = httpMocks.createRequest(
        {method: 'POST', url: '/api/vote',
         body: {voter: "Fred", name: "couch", vote: 'a'}});
    const res8 = httpMocks.createResponse();
    voteInPoll(req8, res8);
    assert.strictEqual(res8._getStatusCode(), 200);
    assert.deepStrictEqual(res8._getData().poll.name, "couch");
    assert.deepStrictEqual(res8._getData().poll.votes, {'Barney': 'a', 'Fred':'a'});

    // Push time forward by over 5 minutes
    advanceTimeForTesting(5 * 60 * 1000 + 50);

    // 8. Poll over (advanceTimeForTesting) [separate test]
    const req12 = httpMocks.createRequest(
        {method: 'POST', url: '/api/vote',
         body: {voter: "Barney", name: "couch", vote: 'a'}});
    const res12 = httpMocks.createResponse();
    voteInPoll(req12, res12);
    assert.strictEqual(res12._getStatusCode(), 400);
    assert.deepStrictEqual(res12._getData(),
        "poll for \"couch\" has already ended");

    resetForTesting();
  });

  it('get', function() {
    const req1 = httpMocks.createRequest(
        {method: 'POST', url: '/api/add',
         body: {name: "couch",  minutes: 5, options: ['a', 'b']}});
    const res1 = httpMocks.createResponse();
    addPoll(req1, res1);
    assert.strictEqual(res1._getStatusCode(), 200);
    assert.deepStrictEqual(res1._getData().poll.name, "couch");

    const req2 = httpMocks.createRequest(
        {method: 'POST', url: '/api/add',
         body: {name: "chair", minutes: 10, options: ['c', 'd']}});
    const res2 = httpMocks.createResponse();
    addPoll(req2, res2);
    assert.strictEqual(res2._getStatusCode(), 200);
    assert.deepStrictEqual(res2._getData().poll.name, "chair");
    assert.deepStrictEqual(res2._getData().poll.options, ['c', 'd']);

    // Separate domain for each branch:
    // 1. Missing name
    // 1. Missing name
    const req3 = httpMocks.createRequest(
        {method: 'POST', url: '/api/get', body: {voter: "Barney"}});
    const res3 = httpMocks.createResponse();
    getPoll(req3, res3);
    assert.strictEqual(res3._getStatusCode(), 400);
    assert.deepStrictEqual(res3._getData(),
        "missing or invalid 'name' parameter");

    // 2. Invalid name
    const req4 = httpMocks.createRequest(
        {method: 'POST', url: '/api/get',
         body: {voter: "Barney", name: "fridge"}});
    const res4 = httpMocks.createResponse();
    getPoll(req4, res4);
    assert.strictEqual(res4._getStatusCode(), 400);
    assert.deepStrictEqual(res4._getData(), "no poll with name 'fridge'");

    const req5 = httpMocks.createRequest(
        {method: 'POST', url: '/api/get',
         body: {voter: "Barney", name: "stool"}});
    const res5 = httpMocks.createResponse();
    getPoll(req5, res5);
    assert.strictEqual(res5._getStatusCode(), 400);
    assert.deepStrictEqual(res5._getData(), "no poll with name 'stool'");

    // 3. Poll found
    const req6 = httpMocks.createRequest(
        {method: 'POST', url: '/api/get', body: {name: "couch"}});
    const res6 = httpMocks.createResponse();
    getPoll(req6, res6);
    assert.strictEqual(res6._getStatusCode(), 200);
    assert.deepStrictEqual(res6._getData().poll.name, "couch");
    assert.deepStrictEqual(res6._getData().poll.options, ['a', 'b']);
    assert.deepStrictEqual(res6._getData().poll.votes, {});

    const req7 = httpMocks.createRequest(
        {method: 'POST', url: '/api/get', body: {name: "chair"}});
    const res7 = httpMocks.createResponse();
    getPoll(req7, res7);
    assert.strictEqual(res7._getStatusCode(), 200);
    assert.deepStrictEqual(res7._getData().poll.name, "chair");
    assert.deepStrictEqual(res7._getData().poll.options, ['c', 'd']);
    assert.deepStrictEqual(res7._getData().poll.votes, {});

    resetForTesting();
  });

  it('list', function() {
    const req1 = httpMocks.createRequest(
        {method: 'GET', url: '/api/list', query: {}});
    const res1 = httpMocks.createResponse();
    listPolls(req1, res1);
    assert.strictEqual(res1._getStatusCode(), 200);
    assert.deepStrictEqual(res1._getData(), {polls: []});

    const req2 = httpMocks.createRequest(
        {method: 'POST', url: '/api/add',
         body: {name: "couch", options: ['a', 'b'],  minutes: 10}});
    const res2 = httpMocks.createResponse();
    addPoll(req2, res2);
    assert.strictEqual(res2._getStatusCode(), 200);
    assert.deepStrictEqual(res2._getData().poll.name, "couch");

    const req3 = httpMocks.createRequest(
        {method: 'POST', url: '/api/add',
         body: {name: "chair", options: ['a', 'b'], minutes: 5}});
    const res3 = httpMocks.createResponse();
    addPoll(req3, res3);
    assert.strictEqual(res3._getStatusCode(), 200);
    assert.deepStrictEqual(res3._getData().poll.name, "chair");

    const req4 = httpMocks.createRequest(
        {method: 'POST', url: '/api/add',
         body: {name: "stool", options: ['a', 'b'], minutes: 15}});
    const res4 = httpMocks.createResponse();
    addPoll(req4, res4);
    assert.strictEqual(res4._getStatusCode(), 200);
    assert.deepStrictEqual(res4._getData().poll.name, "stool");
    assert.deepStrictEqual(res4._getData().poll.options, ['a', 'b']);

    // NOTE: chair goes first because it finishes sooner
    const req5 = httpMocks.createRequest(
        {method: 'GET', url: '/api/list', query: {}});
    const res5 = httpMocks.createResponse();
    listPolls(req5, res5);
    assert.strictEqual(res5._getStatusCode(), 200);
    assert.deepStrictEqual(res5._getData().polls.length, 3);
    assert.deepStrictEqual(res5._getData().polls[0].name, "chair");
    assert.deepStrictEqual(res5._getData().polls[1].name, "couch");
    assert.deepStrictEqual(res5._getData().polls[2].name, "stool");

   // Push time forward by over 5 minutes
   advanceTimeForTesting(5 * 60 * 1000 + 50); 
         
   // NOTE: chair goes after because it has finished
   const req6 = httpMocks.createRequest(
       {method: 'GET', url: '/api/list', query: {}});
   const res6 = httpMocks.createResponse();
   listPolls(req6, res6);
   assert.strictEqual(res6._getStatusCode(), 200);
   assert.deepStrictEqual(res6._getData().polls.length, 3);
   assert.deepStrictEqual(res6._getData().polls[0].name, "couch");
   assert.deepStrictEqual(res6._getData().polls[1].name, "stool");
   assert.deepStrictEqual(res6._getData().polls[2].name, "chair");
       
   // Push time forward by another 5 minutes
   advanceTimeForTesting(5 * 60 * 1000);
   
   // NOTE: chair stays after because it finished first
   const req7 = httpMocks.createRequest(
       {method: 'GET', url: '/api/list', query: {}});
   const res7 = httpMocks.createResponse();
   listPolls(req7, res7);
   assert.strictEqual(res7._getStatusCode(), 200);
   assert.deepStrictEqual(res7._getData().polls.length, 3);
   assert.deepStrictEqual(res7._getData().polls[0].name, "stool");
   assert.deepStrictEqual(res7._getData().polls[1].name, "couch");
   assert.deepStrictEqual(res7._getData().polls[2].name, "chair");

   // Push time forward by another 20 minutes (all are completed)
   advanceTimeForTesting(20 * 60 * 1000);
   
   // NOTE: chair stays after because it finished first
   const req8 = httpMocks.createRequest(
       {method: 'GET', url: '/api/list', query: {}});
   const res8 = httpMocks.createResponse();
   listPolls(req8, res8);
   assert.strictEqual(res8._getStatusCode(), 200);
   assert.deepStrictEqual(res8._getData().polls.length, 3);
   assert.deepStrictEqual(res8._getData().polls[0].name, "stool");
   assert.deepStrictEqual(res8._getData().polls[1].name, "couch");
   assert.deepStrictEqual(res8._getData().polls[2].name, "chair");

    resetForTesting();
  });

});
