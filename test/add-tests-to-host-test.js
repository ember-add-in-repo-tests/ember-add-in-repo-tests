'use strict';

const chai = require('chai');
const addTestsToHost = require('../lib/add-tests-to-host');

const { assert } = chai;

describe('add-tests-to-host', () => {
  it('return dumb string', () => {
    assert.equal(addTestsToHost(), 'Not yet implemented');
  });
});
