"use strict";

const Basic = require('./basic.js');

class Globals extends Basic {
	save() {
		const {data} = this.req.body;
		const {cb} = this.req;
		const val = {
			"@id": "user_info_fields",
			"@type": "Config",
			"content": data
		};
		return cb
			.upsert('user_info_fields', val)
			.then(data => this.res.json(data));

	}
	delete() {
		this.save();
	}
	list() {
		const {cb} = this.req;

		return cb
			.get('user_info_fields')
			.then(data => {
				const helpers = Promise.props({
					canedit: this
						.util
						.canEdit()
				});
				const list = _
					.chain(data)
					.get([
						'value', 'content'
					], [])
					.map((item, index) => {
						item.__index = index;
						return item;
					})
					.value();

				return Promise.props({list, helpers});
			})
			.then(data => this.res.json(data));
	}
}

module.exports = Globals;
