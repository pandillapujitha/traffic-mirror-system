function timestamp() {
  return new Date().toISOString();
}

function info(scope, message, meta) {
  console.log(`[${timestamp()}] [INFO] [${scope}] ${message}`, meta ?? "");
}

function warn(scope, message, meta) {
  console.warn(`[${timestamp()}] [WARN] [${scope}] ${message}`, meta ?? "");
}

function error(scope, message, meta) {
  console.error(`[${timestamp()}] [ERROR] [${scope}] ${message}`, meta ?? "");
}

module.exports = { info, warn, error };
