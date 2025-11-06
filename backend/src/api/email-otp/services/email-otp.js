'use strict';

/**
 * email-otp service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::email-otp.email-otp');
