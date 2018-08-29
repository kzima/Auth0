const express = require("express");
const app = express();
const jwt = require("express-jwt");
const jwtAuthz = require("express-jwt-authz");
const jwksRsa = require("jwks-rsa");
const cors = require("cors");
const apicache = require("apicache");
const proxy = require("http-proxy-middleware");
require("dotenv").config();

apicache.options({ debug: true });
const cache = apicache.middleware;
const PORT = 3001;

if (!process.env.AUTH0_DOMAIN || !process.env.AUTH0_AUDIENCE) {
  throw "Make sure you have AUTH0_DOMAIN, and AUTH0_AUDIENCE in your .env file";
}

app.use(cors());

const checkJwt = (req, res, next) => {
  const token = req.query && req.query.token;
  const result = jwt({
    // Dynamically provide a signing key based on the kid in the header and the singing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
    }),

    // Validate the audience and the issuer.
    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ["RS256"]
  });
  if (token) {
    req.headers["authorization"] = `Bearer ${token}`;
    console.log('req.headers["authorization"]', req.headers);
  }
  return result(req, res, next);
};

const checkScopes = jwtAuthz(["read:messages"]);
const checkScopesAdmin = jwtAuthz(["write:messages"]);

app.get("/api/public", function(req, res) {
  res.json({
    message:
      "Hello from a public endpoint! You don't need to be authenticated to see this."
  });
});

app.get("/api/private", checkJwt, checkScopes, function(req, res) {
  res.json({
    message:
      "Hello from a private endpoint! You need to be authenticated and have a scope of read:messages to see this."
  });
});

app.post("/api/admin", checkJwt, checkScopesAdmin, function(req, res) {
  res.json({
    message:
      "Hello from an admin endpoint! You need to be authenticated and have a scope of write:messages to see this."
  });
});

app.get(
  "/wms",
  checkJwt,
  cache("10 minutes"),
  proxy({
    target:
      "https://wmsa.orbmaps.com/p/geoserver/wms?token=BanslVPe-qiyh2obU36yIw&expires=1532858591&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image%2Fpng8&TRANSPARENT=true&LAYERS=logan%3Aheatmap&TILED=true&WIDTH=256&HEIGHT=256&SRS=EPSG%3A3857&CRS=EPSG%3A3857&STYLES=&BBOX=17027723.91703214%2C-3220139.1275979057%2C17028946.909484703%2C-3218916.135145343",
    changeOrigin: true, // for vhosted sites, changes host header to match to target's host
    logLevel: "debug",
    pathRewrite: function(path, req) {
      return "";
    }
  })
);

app.listen(PORT);
console.log(
  `Server listening on http://localhost:${PORT}. The React app will be built and served at http://localhost:3000.`
);
