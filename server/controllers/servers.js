"use strict";

const Basic = require('./basic.js');
const config = require('../../config/default.js');
const pm2 = require('pm2');

class Servers extends Basic {
	reload() {
		const id = this.req.body.server_id;
		const pm2id = config[id].pm2Id;

		pm2.connect(err => {
			if (err) {
				this
					.res
					.json({state: false, value: err.message});
				return;
			}

			pm2.start(pm2id, (err, apps) => {
				console.log(apps);
				pm2.disconnect();
				this
					.res
					.json({state: true});
			});
		});
	}
	list() {
		const list = _.map(config, (cfg, id) => ({id, label: cfg.label}))

		pm2.connect(err => {

			if (err) {
				this
					.res
					.json({
						error: {
							state: false,
							value: err.message
						},
						helpers: {},
						list
					});
				return;
			}

			pm2.list((err, applist) => {
				pm2.disconnect();
				this
					.res
					.json({
						list,
						helpers: _.map(config, item => {
							return _.find(applist, {name: item.pm2Id}) || false;
						})
					});
			});
		});
	}
}

module.exports = Servers;
