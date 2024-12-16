const swaggerAutogen = require("swagger-autogen")({
  autoBody: false,
});

const outputFile = "./out/swagger.json";
const endpointsFiles = ["./src/routes/*.ts"];

const config = {
  info: {
    title: "Shanthibhavan APIs",
    description: "",
  },
  host: process.env.SERVER_URL,
  schemes: ["http", "https"],
  consumes: ["application/json", "multipart/form-data"],
  basePath: "/",
  securityDefinitions: {
    JWT: {
      type: "apiKey",
      name: "Authorization",
      in: "header",
      description:
        'Enter the token with the `Bearer ` prefix, e.g. "Bearer abcde12345',
    },
  },
};

swaggerAutogen(outputFile, endpointsFiles, config);
