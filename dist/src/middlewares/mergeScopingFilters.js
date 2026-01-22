"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeScopingFilters = void 0;
/**
 * PHASE 4: Merge Scoping Filters Middleware
 *
 * Merges businessFilter and departmentFilter from req into filterQuery.
 * This middleware should run AFTER setFilterParams middleware.
 *
 * Why needed:
 * - businessScopingValidator sets req.businessFilter and req.departmentFilter
 * - setFilterParams creates req.filterQuery from query params
 * - This middleware combines both for complete filtering
 */
const mergeScopingFilters = (req, res, next) => {
    const scopedReq = req;
    try {
        // Initialize filterQuery if not present
        if (!scopedReq.filterQuery) {
            scopedReq.filterQuery = {};
        }
        // Merge business filter
        if (scopedReq.businessFilter) {
            Object.assign(scopedReq.filterQuery, scopedReq.businessFilter);
        }
        // Merge department filter
        if (scopedReq.departmentFilter) {
            // Department filter can be complex (with $or for multi-department)
            // Need to merge carefully to avoid overwriting existing conditions
            if (scopedReq.departmentFilter.$or) {
                // Multi-department filter with $or
                if (scopedReq.filterQuery.$and) {
                    // Already has $and, add to it
                    scopedReq.filterQuery.$and.push(scopedReq.departmentFilter);
                }
                else if (Object.keys(scopedReq.filterQuery).length > 0) {
                    // Has other filters, wrap in $and
                    const existingFilters = Object.assign({}, scopedReq.filterQuery);
                    scopedReq.filterQuery = {
                        $and: [existingFilters, scopedReq.departmentFilter],
                    };
                }
                else {
                    // No existing filters, just assign
                    Object.assign(scopedReq.filterQuery, scopedReq.departmentFilter);
                }
            }
            else {
                // Simple department filter
                Object.assign(scopedReq.filterQuery, scopedReq.departmentFilter);
            }
        }
        next();
    }
    catch (error) {
        console.error("[mergeScopingFilters] Error:", error);
        return res.status(500).json({
            success: false,
            error: "Failed to apply scoping filters",
        });
    }
};
exports.mergeScopingFilters = mergeScopingFilters;
