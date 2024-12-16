import { Request, Response, NextFunction } from "express";
import BadRequestError from "../errors/errorTypes/BadRequestError";
import { getFilterQuery } from "../utilities/filterQuery";
import { removeBasicParams } from "../utilities/removeBasicParams";
import ModelFilterInterface from "../interfaces/ModelFilterInterface";
import FilterException from "../errors/errorTypes/FilterException";

const setFilterParams = ({
  filterFields,
  searchFields,
  sortFields,
}: ModelFilterInterface) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      //sort
      let sortBy = req.query.sortBy as string;
      const search = req.query.search as string;
      let sortOption: string = "desc";
      if (sortBy) {
        if (sortBy[0] === "-") {
          sortOption = "asc";
          sortBy = sortBy.slice(1);
        }
        if (!sortFields.includes(sortBy as string)) {
          next(new BadRequestError({ error: "sorting parameter not allowed" }));
          return;
        }
        req.sort = {
          [sortBy]: sortOption,
        };
        delete req.query.sortBy;
      }

      //filter
      const { limit, skip } = req.query;
      const filter = getFilterQuery({
        queryParameters: removeBasicParams(req.query),
        filterFields,
        search,
        searchFields,
      });

      req.filterQuery = filter;
      req.query.limit = limit;
      req.query.skip = skip;
      req.query.search = search
      next();
    } catch (e: any) {
      if (e instanceof FilterException) {
        next(new BadRequestError({ error: e.message }));
      }
      next(e);
    }
  };
};

export default setFilterParams;
