import { join } from 'path';
import { keys, pick, has } from 'lodash';

import Datastore from 'nedb-promise';
import logger from './logger';
import { emit } from './sockets';

const log = logger.create('Database');

const db = { data: {} };
const getDb = () => db;

export function init(filename, config = {}) {
  const data = new Datastore(Object.assign({ filename, autoload: true }, config));
  log.info('Initialized the database').verbose(`Using [${filename}]`);

  if (config.force) {
    log.warning('Dropping tables before creating')
      .warning('Disable in [user.config.json:force]');
    data.remove({});
  }

  db.data = data;
}

export class Model {
  constructor(name, schema = {}, options = { secure: false }) {
    this.name = name;
    this.schema = schema;
    this.secure = options.secure;
    this.db = getDb().data;
  }

  /**
   * ORM methods
   */

  validate(values = {}) {
    Object.assign(this, values);
    if (!this.schema.fields) {
      throw new Error('Invalid schema: No fields exist');
    }
    if (this.schema.required) {
      if (!has(this.schema.fields, this.schema.required)) {
        throw new Error('Missing required fields', this.schema.required);
      }
    }
    return true;
  }

  values() {
    return pick(this, keys(['_id'].concat(this.schema.fields)));
  }

  async findById(_id) {
    return this.find({ _id });
  }

  async create(document = {}) {
    if (this.validate(document)) {
      const id = await this.insert(this.values());
      if (!id) {
        throw new Error('New ID was not found');
      }
      this._id = id;
      return this;
    }
  }

  async save(document = {}) {
    if (this._id) {
      if (this.validate(document)) {
        return await this.update({ _id: this._id }, this.values());
      }
    }
    return await this.create(document);
  }

  async destroy(_id = this._id) {
    if (!_id) {
      throw new Error('[Delete] No ID was found');
    }
    return await this.remove({ _id });
  }


  /**
   * NEDB - Methods
   */

  async insert(documents) {
    log.debug(`[${this.name}] Inserting`, documents);
    try {
      const result = await getDb().data.insert(documents);
      emit(`${this.name}:save`, documents, this.secure);
      return result;
    } catch (err) {
      log.error(`[${this.name}] Error inserting document`, documents);
      throw err;
    }
  }

  async find(query = {}) {
    log.debug(`[${this.name}] Find`, query);
    return getDb().data.find(query);
  }

  async update(query, update, options) {
    log.debug(`[${this.name}] Updating`, update);
    try {
      const result = await getDb().data.update(query, update, options);
      emit(`${this.name}:save`, update, this.secure);
      return result;
    } catch (err) {
      log.error(`[${this.name}] Error updating document`, update);
      throw err;
    }
  }

  async remove(query, options) {
    log.debug(`[${this.name}] Removing`, query);
    try {
      const result = await getDb().data.remove(query, options);
      emit(`${this.name}:delete`, query, this.secure);
      return result;
    } catch (err) {
      log.error(`[${this.name}] Error removing document`, query);
      throw err;
    }
  }
}

export default { init, Model };
