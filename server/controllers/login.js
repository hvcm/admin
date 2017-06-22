"use strict";

const Basic = require('./basic');
const cfg = require('../../config/default');

const auth = require("iris-auth-util");
auth.configure({data: cfg.buckets.main, session: cfg.buckets.auth});

class Login extends Basic {
	login() {
		const user = this.req.body.user;
		const password_hash = this.req.body.password;
		auth
			.authorize({user, password_hash})
			.then(res => {
				if (!res.state) {
					return res;
				}

				const {user_id} = res.value;
				const {cb} = this.req;

				return cb
					.get(user_id)
					.then(data => {
						const user = data && data.value;

						if (!_.get(user, ['permissions', 'can-admin'])) {
							return res;
						}

						res.value.user = user;
						const permissions = _.get(user, [
							'permissions', 'can-admin'
						], {});
						const admins = _.reduce(permissions, (acc, item, index) => ((item && acc.push(index)), acc), []);

						return cb
							.get('global_org_structure')
							.then(structure => _.chain(structure.value.content).filter(item => ~ admins.indexOf(item['@id'])).map(Util.mapID).value())
							.then(globals => {
								res.value.admins = globals;
								return res;
							})

					})
			})
			.then(res => this.res.status(200).send(res));

	}
}

module.exports = Login;
