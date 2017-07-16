'use strict'

let DB_Face = require("./db/DB_Face");
let Couchbase = require("couchbase");

module.exports = DB_Face;
module.exports.Cluster = require("./db/DB_Face");
module.exports.Bucket = require("./db/DB_Bucket");
module.exports.ViewQuery = Couchbase.ViewQuery;
module.exports.N1qlQuery = Couchbase.N1qlQuery;
