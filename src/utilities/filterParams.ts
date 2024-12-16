import FilterException from "../errors/errorTypes/FilterException";

export enum FilterProperyOperators {
  eq,
  not_eq,
  in,
  cont,
}

export const getFilterProperty = (value: string) => {
  switch (value) {
    case "eq":
      return FilterProperyOperators.eq;
    case "not_eq":
      return FilterProperyOperators.not_eq;
    case "in":
      return FilterProperyOperators.in;
    case "cont":
      return FilterProperyOperators.cont;
    default:
      throw new FilterException(`Filter option '${value}' not found`);
  }
};
