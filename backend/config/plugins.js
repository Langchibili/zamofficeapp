module.exports = ({ env }) => ({
    // provider: "local",
      // providerOptions: {
      //   destination: "./public/uploads",
      //   maxFileSize: 100 * 1024 * 1024, // 100MB in bytes
      // },
  
  
      upload: {
          providerOptions: {
            provider: "local",
            destination: "./public/uploads",
        // set max file size
        maxFileSize: 100 * 1024 * 1024 // 100MB in bytes
          },
          name: "strapi::body",
          config: {
            formLimit: "256mb", // modify form body
            jsonLimit: "256mb", // modify JSON body
            textLimit: "256mb", // modify text body
            formidable: {
              maxFileSize: 250 * 1024 * 1024, // multipart data, modify here limit of uploaded file size
            },
            sizeLimit: 250 * 1024 * 1024, // 256mb in bytes
            breakpoints: {
              xlarge: 1920,
              large: 1000,
              medium: 750,
              small: 500,
              xsmall: 64
            },
          },
        },
      'users-permissions': {
        config: {
          jwt: {
            expiresIn: '7d',
          },
        },
      }
    });