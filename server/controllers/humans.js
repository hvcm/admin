"use strict";

const Basic = require('./basic.js');

class Humans extends Basic {
	save() {
		const {data} = this.req.body;
		const {cb} = this.req;

		cb
			.get('global_membership_description')
			.then(({value}) => {
				const content = value.content;
				_.forEach(this.permissions, department => {
					const x = {
						"member": data["@id"],
						"organization": department
					};

					if (!_.find(content, x)) {
						const role = {
							"@id": "membership-" + data["@id"],
							"@type": "Membership",
							"member": data["@id"],
							"organization": department,
							"role": "Operator"
						};

						content.push(role);
					}
				});

				return cb.upsert('global_membership_description', value);
			});

		return cb.upsert(data["@id"], data).then(data => this.res.json(data));
	}
	delete() {
		const {data} = this.req.body;
		const {cb} = this.req;

		const id = data["@id"];

		return cb
			.get('global_membership_description')
			.then(({value}) => {
				_.remove(value.content, {"member": id});

				return cb.upsert('global_membership_description', value);
			})
			.then(() => cb.remove(id))
			.then(data => this.res.json(data));
	}
	list() {
		const {cb} = this.req;

		return cb
			.get('global_membership_description')
			.then(({value}) => {
				const {content} = value;
				const ids = _
					.chain(content)
					.filter(item => this.permissions.includes(item.organization))
					.map('member')
					.uniq()
					.value();

				const offices = cb
					.get('global_org_structure')
					.then(data => _.get(data, 'value.content'));

				const services = this
					.util
					.getServiceMaps()
					.then(data => _.flatMap(data, item => _.get(item, 'value.content', [])))
					.then(data => cb.getMulti(data))
					.then(items => _.mapValues(items, 'value.label'));

				const schedule = cb
					.view(this.req.query('schedule'))
					.then(items => _.map(items, item => ({
						id: item.id,
						label: item.value || (item.id == 'schedule-0'
							? 'Основное расписание'
							: item.id.replace('schedule-', 'Расписание '))
					})));

				const helpers = Promise.props({
					offices,
					services,
					schedule,
					workstations: this
						.util
						.getWorkstationsId('control-panel', 'reports', 'reception', 'call-center', 'registry')
						.then(ids => {
							return cb
								.getMulti(_.uniq(ids))
								.then(data => _.map(data, 'value'));
						})
				});
				return Promise.props({
					data: cb.getMulti(ids),
					helpers
				})
			})
			.then(({data, helpers}) => {
				return {
					list: _
						.chain(data)
						.map('value')
						.filter({"@type": "Employee"})
						.value(),
					helpers
				}
			})
			.then(data => this.res.json(data));
	}
}

module.exports = Humans;
