"use strict";
const Basic = require('./basic.js');

class Terminals extends Basic {
	save(data) {
		return this
			._saveEntityWorkstation(data)
			.then(data => this.res.json(data));
	}
	delete(data) {
		return this
			._deleteEntityWorkstation(data)
			.then(data => this.res.json(data));
	}
	list() {

		const {cb, cookies} = this.req;
		const permissions = cookies
			.permissions
			.split(',');
		const registries = _.map(permissions, item => `registry_workstation_${item}`);

		return this
			.util
			.getWorkstationsId('terminal')
			.then(workstation_id => {
				console.log('terminals', workstation_id);
				const list = cb
					.getMulti(_.uniq(workstation_id))
					.then(data => _.map(data, 'value'));

				const helpers = Promise.props({
					offices: cb
						.get('global_org_structure')
						.then(data => _.get(data, 'value.content')),
					megatron6: cb
						.get('megatron-6')
						.then(item => _.get(item, 'value.available_workstation')),
					megatron1: cb
						.get('megatron-1')
						.then(item => _.get(item, 'value.available_workstation')),
					groups: cb
						.view(this.req.query('service_group'))
						.then(items => _.map(items, item => ({id: item.id, label: item.value}))),
					workstations: this
						.util
						.getWorkstationsId('call-center', 'registry')
						.then(items => {

							return cb
								.getMulti(items)
								.then(data => _.map(data, 'value'));
						})
				});

				return Promise.props({list, helpers})
			})
			.then(data => this.res.json(data));

	}
}

module.exports = Terminals;
