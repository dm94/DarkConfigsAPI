import server from '../../src/server.js';
import { describe, test, expect } from 'vitest';

describe('Protected routes', () => {
  test('POST /configs requires auth', async () => {
    const response = await server.inject({
      method: 'POST',
      path: '/configs',
      payload: {
        name: 't',
        description: 'd',
        config: { GENERAL: {} },
      },
    });
    expect(response.statusCode).eq(401);
  });
});
