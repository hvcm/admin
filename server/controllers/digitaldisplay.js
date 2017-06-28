"use strict";
const Basic = require('./basic.js');

class Digitaldisplay extends Basic {
	save() {
		const {data} = this.req.body;
		return this
			._saveEntityWorkstation(data)
			.then(() => {
				return this.linkToEntity(data);
			})
			.then(data => this.res.json(data));
	}
	linkToEntity(data) {
		const {cb} = this.req;
		const id = data['@id'];

		return cb
			.get('megatron-2')
			.then(res => {
				const item = res.value;
				const workstations = item.available_workstation;
				workstations.push(id);
				item.available_workstation = _.uniq(workstations)
				return cb.upsert(item["@id"], item);
			})
	}
	unlinkToEntity(data) {
		const {cb} = this.req;
		const id = data['@id'];

		return cb
			.get('megatron-2')
			.then(res => {
				const item = res.value;
				const workstations = item.available_workstation;
				item.available_workstation = _.filter(workstations, item => item != id);

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
		const {cb, cookies} = this.req;
		const permissions = cookies
			.permissions
			.split(',');
		const registries = _.map(permissions, item => `registry_workstation_${item}`);

		return this
			.util
			.getWorkstationsId('digital-display')
			.then(workstation_id => {

				const list = cb
					.getMulti(_.uniq(workstation_id))
					.then(data => _.map(data, 'value'));

				const helpers = Promise.props({
					offices: cb
						.get('global_org_structure')
						.then(data => _.get(data, 'value.content'))
				});

				return Promise.props({list, helpers})
			})
			.then(data => this.res.json(data));

	}
}

module.exports = Digitaldisplay;
