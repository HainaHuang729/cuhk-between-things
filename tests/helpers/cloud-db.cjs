const copy = (value) => JSON.parse(JSON.stringify(value));

function createDatabase() {
  const collections = new Map();
  function matches(row, expression) {
    if (expression.op === "and") return expression.terms.every((term) => matches(row, term));
    if (expression.op === "or") return expression.terms.some((term) => matches(row, term));
    return Object.entries(expression).every(([key, value]) => value instanceof RegExp ? value.test(row[key] || "") : row[key] === value);
  }
  let pending = Promise.resolve();
  const db = {
    command: { and: (terms) => ({ op: "and", terms }), or: (terms) => ({ op: "or", terms }) },
    RegExp: ({ regexp, options }) => new RegExp(regexp, options),
    runTransaction(run) {
      const next = pending.then(() => run(db));
      pending = next.catch(() => {});
      return next;
    },
    collection(name) {
      if (!collections.has(name)) collections.set(name, new Map());
      const rows = collections.get(name);
      const query = (condition, limit = 100, sort) => ({
        where: (next) => query(next, limit, sort),
        limit: (next) => query(condition, next, sort),
        orderBy: (field, direction) => query(condition, limit, { field, direction }),
        update: async ({ data }) => {
          for (const [id, row] of rows) if (!condition || matches(row, condition)) rows.set(id, copy({ ...row, ...data }));
          return {};
        },
        get: async () => {
          let data = [...rows.values()].filter((row) => !condition || matches(row, condition));
          if (sort) data.sort((a, b) => String(a[sort.field]).localeCompare(String(b[sort.field])) * (sort.direction === "desc" ? -1 : 1));
          return { data: copy(data.slice(0, limit)) };
        },
        doc(id) {
          return {
            get: async () => ({ data: rows.has(id) ? copy(rows.get(id)) : null }),
            set: async ({ data }) => { rows.set(id, copy({ ...data, _id: id })); return {}; },
            update: async ({ data }) => { rows.set(id, copy({ ...rows.get(id), ...data })); return {}; },
            remove: async () => { rows.delete(id); return {}; }
          };
        }
      });
      return query();
    }
  };
  return { db, collections };
}

module.exports = { createDatabase };
