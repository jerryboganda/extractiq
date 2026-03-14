import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const websiteDir = path.join(rootDir, "Website", "dist");
const webAppDir = path.join(rootDir, "Web App", "dist");
const apiOrigin = process.env.LOCAL_API_ORIGIN ?? "http://localhost:4000";
const port = Number(process.env.LOCAL_FRONTEND_PORT ?? 8080);

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".ico", "image/x-icon"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".ttf", "font/ttf"],
]);

function sendFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = contentTypes.get(ext) ?? "application/octet-stream";
  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=300",
  });
  fs.createReadStream(filePath).pipe(res);
}

function resolveAsset(baseDir, requestPath, fallbackFile) {
  const cleaned = requestPath.split("?")[0].split("#")[0];
  const target = path.normalize(path.join(baseDir, cleaned));
  if (!target.startsWith(baseDir)) {
    return fallbackFile;
  }

  if (fs.existsSync(target) && fs.statSync(target).isFile()) {
    return target;
  }

  return fallbackFile;
}

function proxyApi(req, res) {
  const url = new URL(req.url ?? "/", apiOrigin);
  const proxyReq = http.request(
    url,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: url.host,
      },
    },
    (proxyRes) => {
      res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers);
      proxyRes.pipe(res);
    },
  );

  proxyReq.on("error", (error) => {
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: { message: `API proxy failed: ${error.message}` } }));
  });

  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const requestPath = req.url ?? "/";

  if (requestPath.startsWith("/api/")) {
    proxyApi(req, res);
    return;
  }

  if (requestPath === "/app" || requestPath.startsWith("/app/")) {
    const relativePath = requestPath === "/app" ? "/" : requestPath.slice("/app".length);
    const filePath = resolveAsset(webAppDir, relativePath, path.join(webAppDir, "index.html"));
    sendFile(res, filePath);
    return;
  }

  const filePath = resolveAsset(websiteDir, requestPath, path.join(websiteDir, "index.html"));
  sendFile(res, filePath);
});

server.listen(port, () => {
  console.log(`Local frontend available at http://localhost:${port}`);
  console.log(`Website: http://localhost:${port}/`);
  console.log(`Web App: http://localhost:${port}/app/login`);
  console.log(`API proxy: ${apiOrigin}`);
});
