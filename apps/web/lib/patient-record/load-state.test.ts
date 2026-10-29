import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApiError } from '../http/api-error';
import { canEdit, classifyHttpStatus, failureFromError, readSectionResponse } from './load-state';

const respond = (status: number, body = '') => new Response(body || null, { status });

describe('classifyHttpStatus', () => {
  it('maps statuses to load outcomes', () => {
    assert.equal(classifyHttpStatus(200), 'ok');
    assert.equal(classifyHttpStatus(204), 'ok');
    assert.equal(classifyHttpStatus(401), 'unauthorized');
    assert.equal(classifyHttpStatus(403), 'forbidden');
    assert.equal(classifyHttpStatus(404), 'not_found');
    assert.equal(classifyHttpStatus(500), 'server');
    assert.equal(classifyHttpStatus(502), 'server');
  });
});

describe('readSectionResponse', () => {
  it('treats a 200 with an empty body as nothing saved yet', async () => {
    assert.deepEqual(await readSectionResponse(respond(200)), { kind: 'empty' });
  });

  it('treats a literal null body as nothing saved yet', async () => {
    assert.deepEqual(await readSectionResponse(respond(200, 'null')), { kind: 'empty' });
  });

  it('treats 404 as nothing saved yet', async () => {
    assert.deepEqual(await readSectionResponse(respond(404, '{"message":"x"}')), { kind: 'empty' });
  });

  it('returns object payloads as data', async () => {
    assert.deepEqual(await readSectionResponse(respond(200, '{"teeth":[]}')), {
      kind: 'data',
      data: { teeth: [] },
    });
  });

  it('treats a non-object JSON body as empty', async () => {
    assert.deepEqual(await readSectionResponse(respond(200, '"text"')), { kind: 'empty' });
  });

  it('never treats auth or server failures as empty', async () => {
    assert.deepEqual(await readSectionResponse(respond(401)), {
      kind: 'error',
      reason: 'unauthorized',
    });
    assert.deepEqual(await readSectionResponse(respond(500, 'boom')), {
      kind: 'error',
      reason: 'server',
    });
  });

  it('treats an unparseable 200 body as a server error, not empty', async () => {
    assert.deepEqual(await readSectionResponse(respond(200, '<html>')), {
      kind: 'error',
      reason: 'server',
    });
  });
});

describe('failureFromError', () => {
  it('uses the status carried by ApiError', () => {
    assert.equal(failureFromError(new ApiError('x', 401)), 'unauthorized');
    assert.equal(failureFromError(new ApiError('x', 503)), 'server');
  });

  it('treats anything else as a network failure', () => {
    assert.equal(failureFromError(new TypeError('Failed to fetch')), 'network');
  });
});

describe('canEdit', () => {
  it('only allows editing loaded sections', () => {
    assert.equal(canEdit({ status: 'ready', data: {}, isEmpty: true }), true);
    assert.equal(canEdit({ status: 'loading' }), false);
    assert.equal(canEdit({ status: 'error', reason: 'server' }), false);
  });
});
