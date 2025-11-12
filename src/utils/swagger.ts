import { version, description, author, homepage, bugs, name } from "../../package.json";

export const schema = {
  openapi: {
    info: {
      title: name,
      description: description,
      version: version,
      contact: {
        name: author,
        url: bugs.url,
      },
    },
    externalDocs: {
      url: homepage,
    },
    consumes: ["application/json"],
    produces: ["application/json"],
    tags: [{ name: "examples", description: "Examples" }],
    securityDefinitions: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  hideUntagged: true,
};
