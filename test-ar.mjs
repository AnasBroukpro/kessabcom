import {createWriteStream} from 'fs';
import {Readable} from 'stream';
import {pipeline} from 'stream/promises';
import {createGzip} from 'zlib';
import {create as tarCreate} from 'tar';

const files = [
  'package.json', 'package-lock.json', 'server.ts',
  'cashplusService.ts', 'whatsappService.ts', 'tsconfig.json',
  'index.html', 'vite.config.ts', 'Dockerfile', '.env.example',
  'src'
];

const out = createWriteStream('kessabcom-cloud-run.tar.gz');
const gzip = createGzip();
const tar = tarCreate({gzip: false}, {prefix: 'kessabcom/'});

pipeline(tar, gzip, out).then(() => console.log('Done'));

for (const f of files) {
  tar.add(f);
}
tar.end();
