const { Eureka } = require("eureka-js-client");

const APP_NAME = "CHAT-SERVICE";
const PORT = Number(process.env.PORT) || 3002;
const HOST = process.env.HOST || process.env.RAILWAY_PUBLIC_DOMAIN || "localhost";
const IP_ADDR = process.env.IP_ADDR || "127.0.0.1";
const PROTOCOL = process.env.PROTOCOL || (process.env.RAILWAY_PUBLIC_DOMAIN ? "https" : "http");
const PUBLIC_URL = process.env.PUBLIC_URL || `${PROTOCOL}://${HOST}${process.env.RAILWAY_PUBLIC_DOMAIN ? "" : `:${PORT}`}`;
const EUREKA_SERVICE_URL = process.env.EUREKA_SERVICE_URL;

const eurekaConfig = EUREKA_SERVICE_URL
  ? {
      serviceUrls: {
        default: [EUREKA_SERVICE_URL]
      }
    }
  : {
      host: process.env.EUREKA_HOST || "localhost",
      port: Number(process.env.EUREKA_PORT) || 8761,
      servicePath: "/eureka/apps/"
    };

const client = new Eureka({
  instance: {
    app: APP_NAME,
    instanceId: `${APP_NAME}:${HOST}:${PORT}`,
    hostName: HOST,
    ipAddr: IP_ADDR,
    port: {
      "$": PORT,
      "@enabled": true
    },
    vipAddress: APP_NAME,
    statusPageUrl: PUBLIC_URL,
    healthCheckUrl: `${PUBLIC_URL}/health`,
    metadata: {
      baseUrl: PUBLIC_URL
    },
    dataCenterInfo: {
      "@class": "com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo",
      name: "MyOwn"
    }
  },
  eureka: eurekaConfig
});

module.exports = client;
