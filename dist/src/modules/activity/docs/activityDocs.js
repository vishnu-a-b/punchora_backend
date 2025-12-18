"use strict";
/**
 * Activity Tracking API Documentation
 *
 * This module provides endpoints for tracking staff activities throughout the day.
 * Activities include breaks, customer visits, trips, and other work-related tasks.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.activitySchemas = exports.activityDocs = void 0;
exports.activityDocs = {
    '/activity/start': {
        post: {
            tags: ['Activity'],
            summary: 'Start a new activity',
            description: 'Staff can start tracking a new activity (tea break, lunch, trip, etc.)',
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    'multipart/form-data': {
                        schema: {
                            type: 'object',
                            required: ['type'],
                            properties: {
                                type: {
                                    type: 'string',
                                    enum: ['tea-break', 'lunch-break', 'washroom', 'care-or-onsite', 'trip', 'other'],
                                    description: 'Type of activity'
                                },
                                location: {
                                    type: 'string',
                                    description: 'Location/destination (required for care-or-onsite and trip)'
                                },
                                reason: {
                                    type: 'string',
                                    description: 'Reason for activity (required for other type)'
                                },
                                meterReadingStart: {
                                    type: 'number',
                                    description: 'Starting meter reading (required for trip)'
                                },
                                photo: {
                                    type: 'string',
                                    format: 'binary',
                                    description: 'Photo for care-or-onsite activities'
                                },
                                vehiclePhoto: {
                                    type: 'string',
                                    format: 'binary',
                                    description: 'Vehicle photo for trip activities'
                                },
                                gpsLocation: {
                                    type: 'object',
                                    properties: {
                                        latitude: { type: 'number' },
                                        longitude: { type: 'number' },
                                        accuracy: { type: 'number' }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                201: {
                    description: 'Activity started successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    message: { type: 'string' },
                                    data: { $ref: '#/components/schemas/Activity' }
                                }
                            }
                        }
                    }
                },
                400: { description: 'Validation error' },
                401: { description: 'Unauthorized' }
            }
        }
    },
    '/activity/{id}/end': {
        put: {
            tags: ['Activity'],
            summary: 'End an ongoing activity',
            description: 'End an activity and calculate duration',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'id',
                    in: 'path',
                    required: true,
                    schema: { type: 'string' },
                    description: 'Activity ID'
                }
            ],
            requestBody: {
                content: {
                    'application/json': {
                        schema: {
                            type: 'object',
                            properties: {
                                endTime: {
                                    type: 'string',
                                    format: 'date-time',
                                    description: 'End time (defaults to now)'
                                },
                                meterReadingEnd: {
                                    type: 'number',
                                    description: 'Ending meter reading (for trip activities)'
                                }
                            }
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'Activity ended successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    message: { type: 'string' },
                                    data: { $ref: '#/components/schemas/Activity' }
                                }
                            }
                        }
                    }
                },
                404: { description: 'Activity not found' },
                400: { description: 'Activity already ended' }
            }
        }
    },
    '/activity/my-activities': {
        get: {
            tags: ['Activity'],
            summary: 'Get my activities',
            description: 'Get list of activities for the authenticated user',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'skip',
                    in: 'query',
                    schema: { type: 'integer', default: 0 }
                },
                {
                    name: 'limit',
                    in: 'query',
                    schema: { type: 'integer', default: 100 }
                },
                {
                    name: 'startDate',
                    in: 'query',
                    schema: { type: 'string', format: 'date' }
                },
                {
                    name: 'endDate',
                    in: 'query',
                    schema: { type: 'string', format: 'date' }
                },
                {
                    name: 'type',
                    in: 'query',
                    schema: {
                        type: 'string',
                        enum: ['tea-break', 'lunch-break', 'washroom', 'care-or-onsite', 'trip', 'other']
                    }
                },
                {
                    name: 'status',
                    in: 'query',
                    schema: {
                        type: 'string',
                        enum: ['started', 'ended']
                    }
                }
            ],
            responses: {
                200: {
                    description: 'Activities retrieved successfully',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    data: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Activity' }
                                    },
                                    total: { type: 'integer' }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/activity/ongoing': {
        get: {
            tags: ['Activity'],
            summary: 'Get ongoing activities',
            description: 'Get list of currently active activities for authenticated user',
            security: [{ bearerAuth: [] }],
            responses: {
                200: {
                    description: 'Ongoing activities retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    data: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Activity' }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/activity/business': {
        get: {
            tags: ['Activity'],
            summary: 'Get business activities (Admin)',
            description: 'Get activities for a business (admin access required)',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'businessId',
                    in: 'query',
                    schema: { type: 'string' },
                    description: 'Business ID (super-admin only)'
                },
                {
                    name: 'skip',
                    in: 'query',
                    schema: { type: 'integer' }
                },
                {
                    name: 'limit',
                    in: 'query',
                    schema: { type: 'integer' }
                },
                {
                    name: 'startDate',
                    in: 'query',
                    schema: { type: 'string', format: 'date' }
                },
                {
                    name: 'endDate',
                    in: 'query',
                    schema: { type: 'string', format: 'date' }
                },
                {
                    name: 'type',
                    in: 'query',
                    schema: { type: 'string' }
                },
                {
                    name: 'departmentId',
                    in: 'query',
                    schema: { type: 'string' }
                }
            ],
            responses: {
                200: {
                    description: 'Business activities retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    data: {
                                        type: 'array',
                                        items: { $ref: '#/components/schemas/Activity' }
                                    },
                                    total: { type: 'integer' }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    '/activity/stats': {
        get: {
            tags: ['Activity'],
            summary: 'Get activity statistics',
            description: 'Get statistics about activities for authenticated user',
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: 'startDate',
                    in: 'query',
                    required: true,
                    schema: { type: 'string', format: 'date' }
                },
                {
                    name: 'endDate',
                    in: 'query',
                    required: true,
                    schema: { type: 'string', format: 'date' }
                }
            ],
            responses: {
                200: {
                    description: 'Statistics retrieved',
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    data: {
                                        type: 'array',
                                        items: {
                                            type: 'object',
                                            properties: {
                                                _id: { type: 'string' },
                                                count: { type: 'integer' },
                                                totalDuration: { type: 'integer' }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
exports.activitySchemas = {
    Activity: {
        type: 'object',
        properties: {
            _id: { type: 'string' },
            staff: {
                type: 'object',
                properties: {
                    _id: { type: 'string' },
                    name: { type: 'string' }
                }
            },
            business: { type: 'string' },
            department: { type: 'string' },
            type: {
                type: 'string',
                enum: ['tea-break', 'lunch-break', 'washroom', 'care-or-onsite', 'trip', 'other']
            },
            status: {
                type: 'string',
                enum: ['started', 'ended']
            },
            startTime: { type: 'string', format: 'date-time' },
            endTime: { type: 'string', format: 'date-time' },
            duration: { type: 'integer', description: 'Duration in minutes' },
            location: { type: 'string' },
            reason: { type: 'string' },
            photo: { type: 'string' },
            meterReadingStart: { type: 'number' },
            meterReadingEnd: { type: 'number' },
            vehiclePhoto: { type: 'string' },
            gpsLocation: {
                type: 'object',
                properties: {
                    latitude: { type: 'number' },
                    longitude: { type: 'number' },
                    accuracy: { type: 'number' }
                }
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
        }
    }
};
