## Objetivo
Implementar login con Discord (OAuth2) y proteger operaciones de configuraciones por usuario: crear solo si el usuario está autenticado, listar perfil con sus configuraciones, y borrar configuraciones propias.

## Decisiones
- Transporte de identidad: JWT en `Authorization: Bearer <token>` (evita CSRF; ya se permite `Authorization` en CORS).
- Frontend integrará flujo OAuth mediante redirección a Discord y retorno a `WEB_APP_URL` con token.
- Persistencia: MongoDB, colección `users`; asociación de propiedad vía `ownerId` en `configs`.

## Cambios de Configuración
- Añadir variables `.env`: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`, `JWT_SECRET`, `WEB_APP_URL`.
- Extender `src/plugins/config.ts` para validar y exponer estas claves en `server.config`.

## Plugins y Utilidades
- Registrar `@fastify/jwt` en `src/server.ts` usando `server.config.JWT_SECRET`.
- Decorar `server.authenticate` como `onRequest/preHandler` que:
  - Valida JWT (`request.jwtVerify()`),
  - Adjunta `request.user` con `{ userId, discordId, username }`.

## Modelo de Datos
- Crear colección `users` con índice en `discordId`.
- Esquema `User`: `{ _id, discordId, username, avatar, createdAt }`.
- Añadir campo `ownerId: ObjectId` en documentos de `configs` (actualizar `src/types/mongo/config.ts` y DTOs relacionados).

## Endpoints de Autenticación
- `GET /auth/discord`:
  - Devuelve/Redirige a URL de autorización de Discord con `client_id`, `scope=identify`, `redirect_uri`, `response_type=code`, `state`.
- `GET /auth/discord/callback`:
  - Intercambia `code` por `access_token` en `https://discord.com/api/oauth2/token`.
  - Obtiene usuario `https://discord.com/api/users/@me`.
  - Upsert en `users` por `discordId` y obtiene `userId`.
  - Emite JWT con `{ userId, discordId, username }` y redirige a `WEB_APP_URL/auth/callback?token=<JWT>`.
- `GET /users/me` (protegido):
  - Devuelve perfil del usuario y contadores.

## Endpoints de Configs (propietario)
- `POST /configs` (protegido):
  - Requiere `server.authenticate`.
  - Asigna `ownerId` del `request.user.userId` al documento.
- `GET /users/me/configs` (protegido):
  - Lista configuraciones donde `ownerId == userId`.
- `DELETE /configs/:configid` (protegido):
  - Verifica propiedad (`ownerId` del documento vs `userId`).
  - Elimina si coincide; si no, devuelve 403.

## Autorización y Seguridad
- Reutilizar `rate-limit`; añadir límites en rutas `/auth/*`.
- Expiración del JWT (p.ej. 2h); sin refresh tokens inicialmente (re-login cuando expire).
- Validar `state` en OAuth para mitigar CSRF en el callback.

## CORS y Swagger
- CORS ya permite `Authorization`. Mantener `credentials: true` por compatibilidad.
- Añadir `bearerAuth` en `src/utils/swagger.ts` y marcar rutas protegidas con `security: [{ bearerAuth: [] }]`.

## Tests
- Añadir tests con `vitest`:
  - Verificación de `server.authenticate`.
  - Flujos de `POST /configs` y `DELETE /configs/:id` con/ sin token.
  - Listado `GET /users/me/configs`.

## Integración Frontend
- Frontend inicia login llamando `GET /auth/discord` y navegando a Discord.
- Tras `callback`, el backend redirige a `WEB_APP_URL/auth/callback?token=...`.
- Frontend guarda token y usa `Authorization: Bearer` en llamadas para crear/listar/borrar.

## Plan de Implementación
1. Añadir claves a `.env` y validar en `src/plugins/config.ts`.
2. Registrar `@fastify/jwt` y crear `server.authenticate`.
3. Implementar rutas `/auth/discord` y `/auth/discord/callback`.
4. Crear colección `users` y tipos.
5. Añadir `ownerId` a `configs`; actualizar creación y listados.
6. Implementar `GET /users/me`, `GET /users/me/configs`.
7. Implementar `DELETE /configs/:configid` con verificación de propiedad.
8. Actualizar Swagger y escribir tests.

¿Confirmas este plan para proceder con la implementación?