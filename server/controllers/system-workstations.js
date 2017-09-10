"use strict";

const Basic = require('./basic.js');

class SystemWorkstations extends Basic {
	save() {
		const {data} = this.req.body;
		const {cb} = this.req;
		const permissions = this.permissions;

		return this
			._saveEntityWorkstation(data)
			.then(() => {
				const registries = _.map(permissions, item => `registry_workstation_${item}`);
				return Promise.map(registries, reg => this.util.addWorkstation(data["@id"], data.device_type, reg));
			})
			.then(data => this.res.json(data));
	}
	delete() {
		const {data} = this.req.body;

		return this
			._deleteEntityWorkstation(data)
			.then(data => this.res.json(data));
	}
	list() {
		const {cb, cookies} = this.req;
		const permissions = this.permissions;
		const registries = _.map(permissions, item => `registry_workstation_${item}`);

		return Promise.props({
			reg: this
				.util
				.getWorkstationsId('call-center', 'registry'),
			webterm: cb.get('megatron-6')
		}).then(({reg, webterm}) => {
			const workstation_id = _
				.chain(reg)
				.concat(_.get(webterm, 'value.available_workstation', []))
				.value();

			const list = cb
				.getMulti(workstation_id)
				.then(data => _.map(data, 'value'));
			const terminals = this
				.util
				.getWorkstationsId('terminal')
				.then(ids => cb.getMulti(ids));

			const helpers = Promise.props({
				offices: this
					.util
					.getOffices(),
				terminals: terminals.then(res => this.toWideMap(res, "@id", "label", "default_agent", '__hidden_type')),
				terminalsMap: terminals.then(res => this.toMap(res, "@id", "attached_to")),
				webterm: webterm.value
			});

			return Promise.props({list, helpers})
		}).then(data => this.res.json(data));
	}
	toWideMap(items, key, ...fields) {
		return _.transform(items, (acc, {
			value = {}
		}) => {
			const k = value[key];
			acc[k] = _.pick(value, fields);
		}, {});
	}
	toMap(items, key, value_key) {
		return _.transform(items, (acc, {
			value = {}
		}) => {
			const k = value[key];
			acc[k] = value[value_key];
		}, {});
	}
}

module.exports = SystemWorkstations;
