import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

// Local demo server only. A hosted release should use a static host with its own
// access controls; this module intentionally has no upload or analysis endpoint.
const root = resolve(import.meta.dirname, '../..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png' };
const port = Number(process.env.PORT || 4174);
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const target = resolve(root, '.' + (pathname === '/' ? '/apps/web/index.html' : pathname));
    // The separator matters: a sibling such as "sentient-backup" shares a prefix
    // with the root but is outside the directory we intend to serve.
    if (!target.startsWith(root + sep) || !(await stat(target)).isFile()) throw new Error('Not found');
    response.writeHead(200, { 'content-type': types[extname(target)] || 'application/octet-stream', 'x-content-type-options': 'nosniff' });
    response.end(await readFile(target));
  } catch { response.writeHead(404); response.end('Not found'); }
}).listen(port, () => console.log(`NeuroLift demo: http://localhost:${port}`));
