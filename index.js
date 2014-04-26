var _ = require('underscore');

function parse (sql) {
  var tokenPattern = /\$[a-zA-Z]([a-zA-Z0-9_]*)\b/g;

  var params = _.uniq(_.map(sql.match(tokenPattern), function (token) {
    return token.substring(1); // Remove leading dollar sign
  })).sort();

  var interpolatedSql = _.reduce(params, function (acc, param, index) {
    return acc.replace(new RegExp('\\$' + param + '\\b', 'g'), '$' + (index + 1));
  }, sql);

  return {
    sql: interpolatedSql,
    params: params
  };
}

function extract_params (obj, params) {
  var missing = _.difference(params, Object.keys(obj));

  if (missing.length)
    throw new Error('Unbound Params: ' + missing);

  return _.map(params, function (param) {
    return obj[param];
  });
};

function patch (obj, opts) {
  // Already patched
  if (obj.origQuery) return;

  var options = _.extend({
    cache: true
  }, opts);

  var parse_ = (options.cache) ? _.memoize(parse) : parse;

  obj.origQuery = obj.query;
  obj.query = function (sql, params_map, cb) {
    if (_.isArray(params_map) || _.isFunction(params_map) || !_.isObject(params_map)) {
      return this.origQuery.apply(this, arguments);
    }
    var res = parse_(sql);
    return this.origQuery.apply(this, [ res.sql, extract_params(params_map, res.params), cb ]);
  };
}

module.exports = {
  parse: parse,
  extractParams: extract_params,
  patchClient: function (client, opts) {
    return patch(client, opts);
  },
  patch: function (pg, opts) {
    return patch(pg.Client.prototype, opts);
  }
}
