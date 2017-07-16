module.exports = {
	test: {
		label: "Тестовый сервер",
		pm2Id: "index",
		database: {
			host: 'couchbase://194.226.171.100/',
			port: ''
		},
		buckets: {
			main: "rdf_doppel",
			auth: "ss"
		}
	},
	prod: {
		label: "Продакшен сервер",
		pm2Id: "Test",
		database: {
			host: 'couchbase://194.226.171.146/',
			port: ''
		},
		buckets: {
			main: "rdf-ns",
			auth: "ss-ns"
		}
	}
};
