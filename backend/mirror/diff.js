// Lightweight structural diff between the primary and shadow JSON responses.
// Returns { equal: boolean, differences: [{ path, primaryValue, shadowValue }] }

function isPlainObject(val) {
  return val !== null && typeof val === "object" && !Array.isArray(val);
}

function diffValues(primary, shadow, path, differences) {
  if (primary === shadow) return;

  const bothObjects = isPlainObject(primary) && isPlainObject(shadow);
  const bothArrays = Array.isArray(primary) && Array.isArray(shadow);

  if (bothObjects) {
    const keys = new Set([...Object.keys(primary), ...Object.keys(shadow)]);
    keys.forEach((key) => {
      // "service" and generated "id" fields are expected to differ between
      // primary/shadow (different service name, independently generated
      // request id) - they are not real behavioral mismatches
      if (key === "service" || key === "id") return;
      diffValues(primary[key], shadow[key], path ? `${path}.${key}` : key, differences);
    });
    return;
  }

  if (bothArrays) {
    const maxLen = Math.max(primary.length, shadow.length);
    for (let i = 0; i < maxLen; i++) {
      diffValues(primary[i], shadow[i], `${path}[${i}]`, differences);
    }
    return;
  }

  differences.push({
    path: path || "(root)",
    primaryValue: primary,
    shadowValue: shadow
  });
}

function diffResponses(primaryBody, shadowBody) {
  const differences = [];
  diffValues(primaryBody, shadowBody, "", differences);
  return { equal: differences.length === 0, differences };
}

module.exports = { diffResponses };
