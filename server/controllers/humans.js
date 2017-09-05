"use strict";

const Basic = require('./basic.js');

class Humans extends Basic {
	save() {
		const {data} = this.req.body;
		const {cb} = this.req;
		const _member_of = data._member_of;
		_.unset(data, '_member_of');

		cb
			.get('global_membership_description')
			.then(({value}) => {
				const content = _.filter(value.content, item => (item.member != data["@id"] || _member_of.includes(item.organization)));

				_.forEach(_member_of, department => {
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
				value.content = content;
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
				const membership = content;
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

				const schedule = this
					.util
					.getSchedulesByView();

				const helpers = Promise.props({
					offices,
					services,
					schedule,
					membership,
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
