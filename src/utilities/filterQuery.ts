import FilterException from "../errors/errorTypes/FilterException";
import { FilterProperyOperators, getFilterProperty } from "./filterParams";

export const getFilterQuery = ({
  queryParameters,
  filterFields,
  search,
  searchFields,
}: {
  queryParameters: any;
  filterFields: string[];
  search?: string;
  searchFields: string[];
}) => {
  let query: any = {};

  if (search) {
    const searchQueryList = searchFields.map((field) => {
      return { [field]: { $regex: search, $options: "i" } };
    });
    query.$or = searchQueryList;
  }
  for (const filterkey in queryParameters) {
    const [filterValue, ...filterOperators] = filterkey.split("__");

    if (filterOperators.length === 0) {
      throw new FilterException(`Filter operator not provided`);
    }
    const filterOperator = getFilterProperty(filterOperators.join("__"));

    if (!filterFields.includes(filterValue)) {
      throw new FilterException(`Filter value '${filterValue}' is invalid`);
    }
    if (!queryParameters[filterkey]) {
      throw new FilterException(`Provide a value for filter key`);
    }
    const propertyValue = String(queryParameters[filterkey]);

    switch (filterOperator) {
      case FilterProperyOperators.in:
        query = {
          ...query,
          ...{
            [filterValue]: {
              $in: propertyValue.split(",").map((str) => str.trim()),
            },
          },
        };
        break;
      case FilterProperyOperators.eq:
        query = { ...query, ...{ [filterValue]: propertyValue } };
        break;
      case FilterProperyOperators.not_eq:
        query = { ...query, ...{ [filterValue]: { $ne: propertyValue } } };
        break;
      case FilterProperyOperators.cont:
        query = {
          ...query,
          ...{ [filterValue]: { $in: [propertyValue] } },
        };
        break;

      default:
        break;
    }
  }
  return query;
};
