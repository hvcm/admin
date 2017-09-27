"use strict";
const Basic = require('./basic.js');

class WebTerminals extends Basic {
	save() {
		const {data} = this.req.body;
		const {cb} = this.req;

		return cb
			.get('megatron-6')
			.then(({value}) => {
				value.available_workstation = data;
				console.log('WEB TERMINAL:', value);
				return cb.upsert('megatron-6', value);
			})
			.then(res => this.res.json(res));
	}
}

module.exports = WebTerminals;
