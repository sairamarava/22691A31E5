const { Logger, logger, Log } = require("./logger");
const {
  requestLogger,
  errorLogger,
  loggedController,
  loggedService,
  loggedQuery,
} = require("./middleware");
const { FrontendLogger, frontendLogger, useLogger } = require("./frontend");

module.exports = {
  // Core logging functionality
  Logger,
  logger,
  Log,

  // Backend middleware
  requestLogger,
  errorLogger,
  loggedController,
  loggedService,
  loggedQuery,

  // Frontend functionality
  FrontendLogger,
  frontendLogger,
  useLogger,
};
