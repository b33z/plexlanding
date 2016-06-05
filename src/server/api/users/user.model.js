import { keys, pick } from 'lodash';

import { Model } from '../../database';

// TODO
// Have a flag for requested, approved/rejected, invite pending, and accepted.

const schema = {
  fields: {
    email: '',
    username: '',
    comment: '',
    status: {
      requested: false,
      approved: false,
      rejected: false,
      pending: false,
      friend: false
    },
    required: ['email']
  }
};

export class User extends Model {
  constructor(values = {}) {
    super('User', schema, { secure: true });
    Object.assign(this, values);
  }
}


export default User;
