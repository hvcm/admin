'use strict'

let Promise = require('bluebird');
let _ = require('lodash');
let uuid = require('node-uuid');

class Request {
	constructor(outer_id, parts) {
		this.outer_id = outer_id;
		this.id = uuid.v1();
		this.parts = parts;
		this.arrived = 0;
		this.data = {};
	}
	part(part_data) {
		this.arrived++;
		_.assign(this.data, part_data);
		return this.arrived == this.parts ? this.data : undefined;
	}
}

module.exports = Request;
