# fastify-boilerplate
Fastify boilerplate with typescript, tests and swagger

# This boilerplate is a mix of others for a minimum configuration.

- [fastify-typescript-starter](https://github.com/yonathan06/fastify-typescript-starter)

## Features

- Typescript + eslint + Prettier
- Routes are automatically generated on the base of the folders.
- Documentation is automatically generated in OpenAPI as you create endpoints.
- Connectors for MongoDB and MySQL
- Added JWT
- CORS-ready

## Fastify Plugins

- [@fastify/autoload](https://github.com/fastify/fastify-autoload)
- [@fastify/cors](https://github.com/fastify/fastify-cors)
- [@fastify/jwt](https://github.com/fastify/fastify-jwt)
- [@fastify/mongodb](https://github.com/fastify/fastify-mongodb)
- [@fastify/mysql](https://github.com/fastify/fastify-mysql)
- [@fastify/rate-limit](https://github.com/fastify/fastify-rate-limit)
- [@fastify/swagger](https://github.com/fastify/fastify-swagger)
- [@fastify/swagger-ui](https://github.com/fastify/fastify-swagger-ui)

## Installation

With npm

```bash
  npm install
  npm run dev
```

With pnpm

```bash
  pnpm install
  pnpm run dev
```

## Swagger UI
Only enabled for the development environment

http://localhost:8080/doc
    
