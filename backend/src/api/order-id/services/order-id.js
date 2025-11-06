'use strict';

/**
 * order-id service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::order-id.order-id');
