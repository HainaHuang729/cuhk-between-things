// Keep local reads synchronous while accepting network-backed service results.
function readResult(read, success, failure) {
  try {
    const result = read();
    return result && typeof result.then === "function"
      ? result.then(success).catch(failure)
      : success(result);
  } catch (error) {
    return failure(error);
  }
}

function combineResults(results) {
  return results.some((result) => result && typeof result.then === "function")
    ? Promise.all(results)
    : results;
}

module.exports = { readResult, combineResults };
