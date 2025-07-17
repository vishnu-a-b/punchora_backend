"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BadRequestError_1 = __importDefault(require("../errors/errorTypes/BadRequestError"));
const filterQuery_1 = require("../utilities/filterQuery");
const removeBasicParams_1 = require("../utilities/removeBasicParams");
const FilterException_1 = __importDefault(require("../errors/errorTypes/FilterException"));
const setFilterParams = ({ filterFields, searchFields, sortFields, }) => {
    return (req, res, next) => {
        try {
            //sort
            let sortBy = req.query.sortBy;
            const search = req.query.search;
            let sortOption = "desc";
            if (sortBy) {
                if (sortBy[0] === "-") {
                    sortOption = "asc";
                    sortBy = sortBy.slice(1);
                }
                if (!sortFields.includes(sortBy)) {
                    next(new BadRequestError_1.default({ error: "sorting parameter not allowed" }));
                    return;
                }
                req.sort = {
                    [sortBy]: sortOption,
                };
                delete req.query.sortBy;
            }
            //filter
            const { limit, skip } = req.query;
            const filter = (0, filterQuery_1.getFilterQuery)({
                queryParameters: (0, removeBasicParams_1.removeBasicParams)(req.query),
                filterFields,
                search,
                searchFields,
            });
            req.filterQuery = filter;
            req.query.limit = limit;
            req.query.skip = skip;
            req.query.search = search;
            next();
        }
        catch (e) {
            if (e instanceof FilterException_1.default) {
                next(new BadRequestError_1.default({ error: e.message }));
            }
            next(e);
        }
    };
};
exports.default = setFilterParams;
