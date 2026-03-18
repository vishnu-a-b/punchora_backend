export const removeBasicParams = (query: any) => {
  if (query.search) delete query.search;
  if (query.limit) delete query.limit;
  if (query.skip) delete query.skip;
  if (query.business) delete query.business; // handled by req.businessFilter via mergeScopingFilters
  if (query.department) delete query.department; // handled by req.departmentFilter via mergeScopingFilters
  return query;
};
