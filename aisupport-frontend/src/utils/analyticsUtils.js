export const countBy = (items, selector) => items.reduce((acc, item) => {
  const key = typeof selector === 'function' ? selector(item) : item[selector];
  acc[key] = (acc[key] || 0) + 1;
  return acc;
}, {});

export const distribution = (items, selector) => Object.entries(countBy(items, selector))
  .map(([name, value]) => ({ name, value }))
  .sort((a, b) => b.value - a.value);

export const average = (items, selector) => {
  if (!items.length) return 0;
  return items.reduce((sum, item) => sum + Number(typeof selector === 'function' ? selector(item) : item[selector] || 0), 0) / items.length;
};

export const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;
