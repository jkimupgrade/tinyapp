const { assert } = require('chai');

const { getUserByEmail } = require('../helpers.js');

const testUsers = {
  'userRandomId': {
    id: 'userRandomID',
    email: 'user@example.com',
    password: 'purple-monkey-dinosaur'
  },
  'user2RandomID': {
    id: 'user2RandomID',
    email: 'user2@example.com',
    password: 'dishwasher-funk'
  }
};

describe('getUserByEmail', () => {
  it('should return a user with valid email', () => {
    const user = getUserByEmail('user@example.com', testUsers);
    const expectedOutput = 'userRandomID';
    assert.strictEqual(user, expectedOutput);
  });

  it('should return undefined with an invalid email', () => {
    const user = getUserByEmail('user3@example.com', testUsers);
    const expectedOutput = undefined;
    assert.strictEqual(user, expectedOutput);
  });
});