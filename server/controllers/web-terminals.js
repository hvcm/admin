"use strict";
const Basic = require('./basic.js');

class WebTerminals extends Basic {
	save() {
		const {data} = this.req.body;
		const {cb} = this.req;

		return cb
			.get('megatron-6')
			.then(term => {
				term.value.available_workstation = data;
				return cb.upsert('megatron-6', term.value)
			})
			.then(res => this.res.json(res));
	}

}

module.exports = WebTerminals;
