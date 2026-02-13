/**
 * API Key Routes
 * Endpoints for managing API keys
 */

import { Router } from 'express';
import { ApiKeyController } from '../controllers/ApiKeyController';
import { authenticateUser } from '../../authentication/middlewares/authenticateUser';

const router = Router();
const apiKeyController = new ApiKeyController();

// All routes require authentication
router.use(authenticateUser);

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

export default router;
