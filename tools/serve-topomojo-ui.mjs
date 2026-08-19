import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, request as proxyRequest } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const [workDirectory, launchpointDirectory, port = '4201'] = process.argv.slice(2);

if (!workDirectory || !launchpointDirectory) {
  throw new Error('Usage: node tools/serve-topomojo-ui.mjs <work-directory> <launchpoint-directory> [port]');
}

const workRoot = resolve(workDirectory);
const launchpointRoot = resolve(launchpointDirectory);

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2'
};

function resolvePath(root, pathname) {
  const path = resolve(root, `.${normalize(pathname)}`);
  return path.startsWith(`${root}${sep}`) || path === root ? path : null;
}

function sendFile(response, path) {
  response.writeHead(200, {
    'Content-Type': contentTypes[extname(path)] || 'application/octet-stream',
    'Cache-Control': 'no-cache'
  });
  createReadStream(path).pipe(response);
}

function sendDevelopmentSettings(response) {
  const settingsPath = join(workRoot, 'assets', 'settings.json');
  const settings = JSON.parse(readFileSync(settingsPath, 'utf8'));
  settings.apphost = '';

  response.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache'
  });
  response.end(JSON.stringify(settings));
}

createServer((request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
    const proxy = proxyRequest(
      {
        host: '127.0.0.1',
        port: 5000,
        path: `${url.pathname}${url.search}`,
        method: request.method,
        headers: request.headers
      },
      proxyResponse => {
        response.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
        proxyResponse.pipe(response);
      }
    );

    proxy.on('error', () => {
      response.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('TopoMojo API is unavailable.');
    });

    request.pipe(proxy);
    return;
  }

  if (url.pathname === '/assets/settings.json') {
    sendDevelopmentSettings(response);
    return;
  }

  const isLaunchpoint = url.pathname === '/lp' || url.pathname.startsWith('/lp/');
  const root = isLaunchpoint ? launchpointRoot : workRoot;
  const relativePath = isLaunchpoint ? url.pathname.slice(3) || '/' : url.pathname;
  let path = resolvePath(root, relativePath);

  if (path && existsSync(path) && statSync(path).isDirectory()) {
    path = join(path, 'index.html');
  }

  if (!path || !existsSync(path)) {
    path = join(root, 'index.html');
  }

  if (!existsSync(path)) {
    response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('TopoMojo UI is still building.');
    return;
  }

  sendFile(response, path);
}).listen(Number(port), '0.0.0.0', () => {
  console.log(`TopoMojo UI listening on http://localhost:${port}`);
});
