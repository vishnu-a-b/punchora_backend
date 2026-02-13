"use strict";
/**
 * API Key Routes
 * Endpoints for managing API keys
 */
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ApiKeyController_1 = require("../controllers/ApiKeyController");
const authenticateUser_1 = require("../../authentication/middlewares/authenticateUser");
const router = (0, express_1.Router)();
const apiKeyController = new ApiKeyController_1.ApiKeyController();
// All routes require authentication
router.use(authenticateUser_1.authenticateUser);
/**
 * @route   POST /v1/api-keys
 * @desc    Create a new API key
 * @access  Private (requires authentication)
 */
router.post('/', apiKeyController.createApiKey);
/**
 * @route   GET /v1/api-keys
 * @desc    List all API keys
 * @access  Private (requires authentication)
 */
router.get('/', apiKeyController.listApiKeys);
/**
 * @route   GET /v1/api-keys/:id
 * @desc    Get single API key details
 * @access  Private (requires authentication)
 */
router.get('/:id', apiKeyController.getApiKey);
/**
 * @route   PUT /v1/api-keys/:id
 * @desc    Update API key
 * @access  Private (requires authentication)
 */
router.put('/:id', apiKeyController.updateApiKey);
/**
 * @route   DELETE /v1/api-keys/:id
 * @desc    Revoke API key
 * @access  Private (requires authentication)
 */
router.delete('/:id', apiKeyController.revokeApiKey);
exports.default = router;
