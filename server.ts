import { serveDir } from '@std/http/file-server';

Deno.serve((req: Request) => {
  return serveDir(req, {
    fsRoot: 'dist',
    quiet: true,
  });
});
