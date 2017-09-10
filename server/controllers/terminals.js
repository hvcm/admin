"use strict";
const Basic = require('./basic.js');

class Terminals extends Basic {
	save() {
		const {data} = this.req.body;
		const previous = data.__previous;
		const id = data['@id'];

		return this
			._saveEntityWorkstation(data)
			.then(() => {
				return id !== previous && this.unlinkToEntity({"@id": previous, __hidden_type: data.__hidden_type});
			})
			.then(() => this.linkToEntity(data))
			.then(data => this.res.json(data));
	}
	linkToEntity(data) {
		const {cb} = this.req;
		const id = data['@id'];
		const hiddentype = data.__hidden_type;

		// const field = hiddentype.includes('megatron')
		// 	? 'available_workstation'
		// 	: 'attached_terminal';

		if (hiddentype.includes('megatron')) {
			return cb
				.get(hiddentype)
				.then(res => {
					const item = res.value;
					const workstations = item.available_workstation || [];
					workstations.push(id);
					item.available_workstation = _.uniq(workstations);

					return cb.upsert(item["@id"], item);
				});
		}

		return Promise.resolve(true);
	}
	unlinkToEntity(data) {
		const {cb} = this.req;
		const id = data['@id'];
		const hiddentype = data.__hidden_type;
		//
		// const field = hiddentype.indexOf('megatron') === 0
		// 	? 'available_workstation'
		// 	: 'attached_terminal';

		return cb
			.get(hiddentype)
			.then(res => {
				const item = res.value;
				item.available_workstation = _.filter(item.available_workstation, item => item != id);

				return cb.upsert(item["@id"], item);
			})
	}
	_delete(data) {
		return this
			._deleteEntityWorkstation(data)
			.then(() => this.unlinkToEntity(data))
	}
	delete() {
		const {data} = this.req.body;

		return this
			._delete(data)
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
					fields: this
						.util
						.fieldsMap(),
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
