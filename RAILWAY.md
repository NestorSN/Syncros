# Railway deployment

Deploy each backend component as its own Railway service.

## eureka-server

Start command:

```bash
java -jar target/eureka-server-1.0.0.jar
```

Railway sets `PORT` automatically. The Eureka URL for the other services should be:

```text
https://<eureka-domain>/eureka/apps/
```

## Node services

Use this start command in each service:

```bash
npm start
```

Required environment variables for `auth-service`, `chat-service`, and `api-gateway`:

```text
EUREKA_SERVICE_URL=https://<eureka-domain>/eureka/apps/
PUBLIC_URL=https://<current-service-domain>
```

Local fallback still works without those variables:

- `auth-service`: `http://localhost:3001`
- `chat-service`: `http://localhost:3002`
- `api-gateway`: `http://localhost:4000`

## Useful checks

```text
GET /health
GET /discovery
```

`/discovery` exists on the API Gateway and shows what it can currently see from Eureka.
