import Datastore from 'nedb-promise';
import Config from '../config/';
import logger from '../logger';
import { emit } from '../sockets';

const { database } = Config.defaults();
const log = logger.create('Database');

const db = {};
const getDb = () => db;

export async function init() {
  const config = new Datastore(database.config);
  const data = new Datastore(database.data);
  log.info('Initialized the databases');

  Object.assign(db, { config, data });
}

export class Database {
  constructor(name, secure = true) {
    this.name = name;
    this.secure = secure;
    this.db = getDb[name];
    if (!this.db) {
      throw new Error(`Database with name of [${name}] was not found!`);
    }
  }

  db() {
    return this.db;
  }

  async insert(documents) {
    log.debug(`[${this.name}] Inserting`, documents);
    try {
      const result = await this.db.insert(documents);
      emit(`${this.name}:save`, documents, this.secure);
      return result;
    } catch (err) {
      log.error(`[${this.name}] Error inserting document`, documents);
      throw err;
    }
  }

  async find(query) {
    log.debug(`[${this.name}] Find`, query);
    return this.db.find(query);
  }

  async update(query, update, options) {
    log.debug(`[${this.name}] Updating`, update);
    try {
      const result = await this.db.update(query, update, options);
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
      const result = await this.db.remove(query, options);
      emit(`${this.name}:delete`, query, this.secure);
      return result;
    } catch (err) {
      log.error(`[${this.name}] Error removing document`, query);
      throw err;
    }
  }
}

export default { init, Database };
