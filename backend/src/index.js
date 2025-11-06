// 'use strict';
// const socketClient = require('./utils/socket-client');

// module.exports = {
//   /**
//    * An asynchronous bootstrap function that runs before
//    * your application gets started.
//    */
//   register(/*{ strapi }*/) {},
//   async bootstrap({ strapi }) {
//     try {
//       console.log('Initializing Socket.IO client...');
      
//       // Initialize socket connection with delay to ensure server is fully up
//       setTimeout(() => {
//         socketClient.initialize();
//       }, 2000); // Wait 2 seconds after Strapi starts

//       // Graceful shutdown handling
//       const shutdown = async (signal) => {
//         console.log(`Received ${signal}. Shutting down gracefully...`);
//         socketClient.disconnect();
//         process.exit(0);
//       };

//       process.on('SIGINT', () => shutdown('SIGINT'));
//       process.on('SIGTERM', () => shutdown('SIGTERM'));
//       process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon

//     } catch (error) {
//       console.error('Bootstrap error:', error);
//       strapi.log.error('Failed to initialize socket client:', error);
//     }
//   },
// };

// ./src/index.js
'use strict';
const socketClient = require('./utils/socket-client');

module.exports = {
  register() {},

  async bootstrap({ strapi }) {
    console.log('Initializing Socket.IO client...');
    setTimeout(() => socketClient.initialize(), 2000); // wait Strapi startup

    const shutdown = async (signal) => {
      console.log(`Received ${signal}, shutting down...`);
      socketClient.disconnect();
      process.exit(0);
    };

    ['SIGINT', 'SIGTERM', 'SIGUSR2'].forEach(sig => process.on(sig, () => shutdown(sig)));
  },
};
