export const removeBasicParams = (query: any) => {
  if (query.search) delete query.search;
  if (query.limit) delete query.limit;
  if (query.skip) delete query.skip;
  return query;
};
