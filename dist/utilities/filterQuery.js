"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFilterQuery = void 0;
const FilterException_1 = __importDefault(require("../errors/errorTypes/FilterException"));
const filterParams_1 = require("./filterParams");
const getFilterQuery = ({ queryParameters, filterFields, search, searchFields, }) => {
    let query = {};
    if (search) {
        const searchQueryList = searchFields.map((field) => {
            return { [field]: { $regex: search, $options: "i" } };
        });
        query.$or = searchQueryList;
    }
    for (const filterkey in queryParameters) {
        const [filterValue, ...filterOperators] = filterkey.split("__");
        if (filterOperators.length === 0) {
            throw new FilterException_1.default(`Filter operator not provided`);
        }
        const filterOperator = (0, filterParams_1.getFilterProperty)(filterOperators.join("__"));
        if (!filterFields.includes(filterValue)) {
            throw new FilterException_1.default(`Filter value '${filterValue}' is invalid`);
        }
        if (!queryParameters[filterkey]) {
            throw new FilterException_1.default(`Provide a value for filter key`);
        }
        const propertyValue = String(queryParameters[filterkey]);
        switch (filterOperator) {
            case filterParams_1.FilterProperyOperators.in:
                query = Object.assign(Object.assign({}, query), {
                    [filterValue]: {
                        $in: propertyValue.split(",").map((str) => str.trim()),
                    },
                });
                break;
            case filterParams_1.FilterProperyOperators.eq:
                query = Object.assign(Object.assign({}, query), { [filterValue]: propertyValue });
                break;
            case filterParams_1.FilterProperyOperators.not_eq:
                query = Object.assign(Object.assign({}, query), { [filterValue]: { $ne: propertyValue } });
                break;
            case filterParams_1.FilterProperyOperators.cont:
                query = Object.assign(Object.assign({}, query), { [filterValue]: { $in: [propertyValue] } });
                break;
            default:
                break;
        }
    }
    return query;
};
exports.getFilterQuery = getFilterQuery;
