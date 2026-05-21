const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const http = require("http");
const eurekaClient = require("./eureka-client");

const PORT = Number(process.env.PORT) || 4000;

const app = express();
const server = http.createServer(app);

app.use(cors());

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "UP"
  });
});

app.get("/discovery", (req, res) => {
  const services = eurekaClient.cache.app || {};

  res.json(
    Object.fromEntries(
      Object.entries(services).map(([name, instances]) => [
        name,
        instances.map((instance) => ({
          instanceId: instance.instanceId,
          status: instance.status,
          url: getInstanceUrl(instance)
        }))
      ])
    )
  );
});

app.get("/debug/routes", (req, res) => {
  try {
    res.json({
      authServiceUrl: getServiceUrl("AUTH-SERVICE"),
      chatServiceUrl: getServiceUrl("CHAT-SERVICE")
    });
  } catch (error) {
    res.status(503).json({
      error: error.message
    });
  }
});

function getInstanceUrl(instance) {
  if (instance.metadata && instance.metadata.baseUrl) {
    return normalizeServiceUrl(instance.metadata.baseUrl);
  }

  const host = instance.ipAddr || instance.hostName;
  const port = instance.port && (instance.port.$ || instance.port);

  if (!host || !port) {
    throw new Error("Invalid Eureka instance");
  }

  return normalizeServiceUrl(`http://${host}:${port}`);
}

function normalizeServiceUrl(url) {
  if (!url) {
    throw new Error("Missing service URL");
  }

  const normalizedUrl =
    /^https?:\/\//i.test(url)
      ? url
      : `https://${url}`;

  return normalizedUrl.replace(/\/$/, "");
}

function getServiceUrl(serviceName) {
  const instances = eurekaClient.getInstancesByAppId(serviceName);

  if (!instances || instances.length === 0) {
    throw new Error(`No instances found for ${serviceName}`);
  }

  return getInstanceUrl(instances[0]);
}

function resolveService(serviceName) {
  return (req, res, next) => {
    try {
      req.targetServiceUrl = getServiceUrl(serviceName);
      next();
    } catch (error) {
      res.status(503).json({
        error: error.message
      });
    }
  };
}

function createEurekaProxy(serviceName, options = {}) {
  return createProxyMiddleware({
    target: "http://127.0.0.1",
    router: (req) => {
      const targetServiceUrl =
        req.targetServiceUrl || getServiceUrl(serviceName);

      console.log(
        `Proxy ${serviceName}: ${req.method} ${req.originalUrl || req.url} -> ${targetServiceUrl}${req.url}`
      );

      return targetServiceUrl;
    },
    changeOrigin: true,
    on: {
      error: (error, req, resOrSocket) => {
        console.error(
          `Proxy error for ${serviceName}:`,
          error
        );

        if (
          resOrSocket &&
          typeof resOrSocket.writeHead === "function"
        ) {
          if (!resOrSocket.headersSent) {
            resOrSocket.writeHead(502, {
              "Content-Type": "application/json"
            });
          }

          resOrSocket.end(JSON.stringify({
            error: `Proxy error for ${serviceName}`,
            details: error.message
          }));

          return;
        }

        if (
          resOrSocket &&
          typeof resOrSocket.destroy === "function"
        ) {
          resOrSocket.destroy();
        }
      }
    },
    ...options
  });
}

app.use(
  "/chat",
  resolveService("CHAT-SERVICE"),
  createEurekaProxy("CHAT-SERVICE", {
    pathRewrite: {
      "^/chat": ""
    },
    ws: true,
    logLevel: "debug"
  })
);

app.use(
  "/auth",
  resolveService("AUTH-SERVICE"),
  createEurekaProxy("AUTH-SERVICE", {
    pathRewrite: {
      "^/auth": ""
    }
  })
);

server.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);

  eurekaClient.start((error) => {
    if (error) {
      console.log("Eureka registration failed:", error);
      return;
    }

    console.log("API-GATEWAY registered in Eureka");
  });
});

process.on("SIGINT", () => {
  eurekaClient.stop(() => {
    process.exit();
  });
});
