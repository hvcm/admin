"use strict";
const Basic = require('./basic.js');

class Terminals extends Basic {
	save() {
		const {data} = this.req.body;
		return this
			._saveEntityWorkstation(data)
			.then(() => this.linkToEntity(data))
			.then(data => this.res.json(data));
	}
	linkToEntity(data) {
		const {cb} = this.req;
		const id = data['@id'];
		const hiddentype = data.__hidden_type;

		const field = hiddentype.indexOf('megatron') === 0
			? 'available_workstation'
			: 'attached_terminal';

		return cb
			.get(hiddentype)
			.then(res => {
				const item = res.value;
				const workstations = item[field];
				workstations.push(id);
				item[field] = _.uniq(workstations)
				return cb.upsert(item["@id"], item);
			})
	}
	unlinkToEntity(data) {
		const {cb} = this.req;
		const id = data['@id'];
		const hiddentype = data.__hidden_type;

		const field = hiddentype.indexOf('megatron') === 0
			? 'available_workstation'
			: 'attached_terminal';

		return cb
			.get(hiddentype)
			.then(res => {
				const item = res.value;
				const workstations = item[field];
				item[field] = _.filter(workstations, item => item != id);

				return cb.upsert(item["@id"], item);
			})
	}
	delete() {
		const {data} = this.req.body;
		return this
			._deleteEntityWorkstation(data)
			.then(() => {
				return this.unlinkToEntity(data);
			})
			.then(data => this.res.json(data));
	}
	list() {
		const {cb} = this.req;

		const registries = _.map(this.permissions, item => `registry_workstation_${item}`);

		return this
			.util
			.getWorkstationsId('terminal')
			.then(workstation_id => {
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
						.then(items => _.map(items, 'id'))
						.then(ids => cb.getMulti(ids))
						.then(items => _.chain(items).map('value').filter({view_order: "0"}).map(item => ({id: item["@id"], label: item.label})).value()),
					// .then(items => _.map(items, item => ({id: item.id, label: item.value}))),
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
