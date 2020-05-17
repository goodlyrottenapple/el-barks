const {
  override,
  addBabelPlugin
} = require("customize-cra");
const path = require("path");

module.exports = override(
  addBabelPlugin(["transform-remove-console", { "exclude": [ "error", "warn"] }])
);