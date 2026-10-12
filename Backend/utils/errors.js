const { isProduction } = require("../config");

// Internal error text (stack hints, DB messages) must not reach API clients in
// production. In development it is returned to make debugging easier.
const errorDetail = (error) =>
  isProduction ? undefined : error?.message || String(error);

module.exports = { errorDetail };
