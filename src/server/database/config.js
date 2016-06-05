import { merge } from 'lodash';

import { Database } from './';

class Config extends Database {
  constructor() {
    super('config');
    this.config = {};
    this.loaded = false;
  }

  async load(force = false) {
    if (this.loaded && !force) {
      return this.config;
    }
    const result = await this.find();
    this.config = result[0];
    this.loaded = true;

    return this.config;
  }

  save(config) {
    this.config = merge(this.config, config);
    return this.update({ _id: this.config._id }, this.config);
  }
}

