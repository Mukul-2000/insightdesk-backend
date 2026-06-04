import Joi from 'joi';

// Schema for POST /api/v1/tickets/create
export const createTicketSchema = Joi.object({
    title: Joi.string().min(3).max(100).required().trim().messages({
        'string.empty': 'Ticket title cannot be empty',
        'any.required': 'A ticket must have a title'
    }),
    description: Joi.string().min(10).required().messages({
        'string.empty': 'Ticket description cannot be empty',
        'any.required': 'A ticket must have a description'
    }),
    customerEmail: Joi.string().email().required().trim().lowercase().messages({
        'string.email': 'Please provide a valid customer email address',
        'any.required': 'Customer contact email is required'
    }),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium')
});

// Schema for POST /api/v1/ai/test-ai
export const aiPromptSchema = Joi.object({
    prompt: Joi.string().required().messages({
        'string.empty': 'Prompt text cannot be empty',
        'any.required': 'Prompt text is required'
    })
});

// Schema for POST /api/v1/documents/ingest
export const ingestDocumentSchema = Joi.object({
    fileName: Joi.string().min(3).max(255).required().trim().messages({
        'any.required': 'A clear filename is required for historical tracking'
    }),
    rawText: Joi.string().min(20).required().messages({
        'any.required': 'The rawText payload cannot be empty and must be at least 20 characters long'
    })
});

// Schema for POST /api/v1/ai/chat
export const aiChatSchema = Joi.object({
    question: Joi.string().min(5).required().messages({
        'any.required': 'The question field is required to converse with the knowledge base.'
    })
});