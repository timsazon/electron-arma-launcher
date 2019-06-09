const fs = require("fs");
const path = require("path");
const retry = require("async-retry");
const isDev = require("electron-is-dev");
const hasha = require("hasha");

const Seven = require('node-7z');
const xml2js = require('xml2js');
const ftp = require('basic-ftp');

const { ipcRenderer, remote } = require('electron');

const app = remote.app;

const xmlParser = new xml2js.Parser();

const STATUS = {
  CONNECTING: "CONNECTING",
  VALIDATING: "VALIDATING",
  CHECKSUM: "CHECKSUM",
  DOWNLOADING: "DOWNLOADING",
  DONE: "DONE",
  ERROR: "ERROR",
  NONE: "NONE"
};

let client = new ftp.Client(0);
let settings = undefined;
let ftpOptions = undefined;

let appPath = app.getAppPath();
let userDataPath = app.getPath('userData');

let MD5Dir = path.resolve(userDataPath, 'md5');

function setProgress(progress) {
  ipcRenderer.send('web', {
    type: 'progress',
    progress: progress
  });
}

async function connect() {
  await new Promise((resolve, reject) => {
    client
      .access({
        host: ftpOptions.host,
        user: ftpOptions.user,
        password: ftpOptions.password,
        secure: ftpOptions.secure
      })
      .then(resolve)
      .catch(reject);

    setTimeout(() => reject(new Error('Connection timeout')), 10000);
  });

  return client.cd(ftpOptions.path);
}

async function disconnect() {
  return client.close();
}

async function walk(dir) {
  let results = [];

  let list;
  try {
    list = await fs.promises.readdir(dir);
  } catch (e) {
    return results;
  }
  if (!list.length) return results;

  await Promise.all(
    list.map(async file => {
      file = path.resolve(dir, file);
      const stat = await fs.promises.stat(file);
      if (stat && stat.isDirectory()) {
        const res = await walk(file);
        results = results.concat(res);
      } else {
        results.push({ full: file, size: stat["size"], time: stat.mtime.valueOf() });
      }
    })
  );

  return results;
}

async function createDir(path) {
  try {
    await fs.promises.mkdir(path, { recursive: true });
  } catch (e) {
    console.log(e);
  }
}

async function downloadFile(url, localPath) {
  await createDir(path.dirname(localPath));
  const dStream = fs.createWriteStream(localPath);
  const result = new Promise((resolve, reject) => {
    dStream.on('finish', resolve);
    dStream.on('close', resolve);
    dStream.on('error', reject);
  });

  return await retry(async () => {
    if (client.closed) await connect();
    await client.download(dStream, url, dStream.bytesWritten);
    return result;
  }, {
    retries: 10,
    onRetry: e => console.log(`Download retry ${url}:`, e.message)
  });
}

async function unpackFile(localPath) {
  return await retry(async () => {
    const autoconfig = Seven.extractFull(localPath, path.dirname(localPath), {
      $bin: path.join(appPath, isDev ? 'lib/7za.exe' : '../lib/7za.exe')
    });
    await new Promise((resolve, reject) => {
      autoconfig.on('error', reject);
      autoconfig.on('end', resolve);
    });
    return fs.promises.unlink(localPath);
  }, {
    retries: 3,
    onRetry: e => console.log(`Unpack retry ${localPath}:`, e.message)
  });
}

async function _getMods() {
  const modsXML = await fs.promises.readFile(path.resolve(MD5Dir, 'autoconfig', 'Mods.xml'));
  return new Promise((resolve, reject) => {
    xmlParser.parseString(modsXML, function (err, result) {
      if (err) reject(err);
      else resolve(result.DSServer.Mods.map(m => m.Name[0]));
    });
  });
}

async function _getAddons() {
  const modsXML = await fs.promises.readFile(path.resolve(MD5Dir, 'autoconfig', 'Addons.xml'));
  return new Promise((resolve, reject) => {
    xmlParser.parseString(modsXML, function (err, result) {
      if (err) reject(err);
      else
        resolve(result.DSServer.Addons.map(a => ({
          url: a.Url[0],
          size: Number.parseInt(a.Size[0]),
          pbo: a.Pbo[0],
          short: path.join(a.Path[0], a.Pbo[0]),
          md5: a.Md5[0],
        })));
    });
  });
}

async function _saveValid(valid) {
  return fs.promises.writeFile(
    path.resolve(MD5Dir, 'valid.json'),
    JSON.stringify(valid, null, 2),
    'utf8'
  );
}

async function validate(full) {
  try {
    setProgress({ status: STATUS.CONNECTING });

    await connect();

    await downloadFile('autoconfig.7z', path.resolve(MD5Dir, 'autoconfig.7z'));
    await unpackFile(path.resolve(MD5Dir, 'autoconfig.7z'));

    const mods = await _getMods();
    const addons = await _getAddons();

    setProgress({ status: STATUS.VALIDATING });

    let oldValid = [];
    if (!full) {
      try {
        oldValid = JSON.parse(await fs.promises.readFile(path.resolve(MD5Dir, 'valid.json'), 'utf8'));
      } catch (e) {
      }
    }

    const validAddons =
      await Promise.all(
        mods
          .map(async mod => {
            const res = await walk(path.resolve(settings.a3mods, mod));
            return Promise.all(res.map(async f => {
              f.short = f.full.substr(settings.a3mods.length + 1, f.full.length);
              const remote = addons.find(a => a.short === f.short);
              if (remote) {
                if (!full) {
                  const v = oldValid.find(v => v.short === f.short && v.size === f.size && v.time === f.time);
                  if (v) {
                    f.md5 = v.md5;
                  } else {
                    f.md5 = await hasha.fromFile(f.full, { algorithm: 'md5' });
                  }
                } else {
                  f.md5 = await hasha.fromFile(f.full, { algorithm: 'md5' });
                }
                f.md5 = f.md5.toUpperCase();
                if (f.md5 === remote.md5) {
                  return f;
                }
              }
              return null;
            }))
          })
      );

    const valid = validAddons.flat(1).filter(v => v !== null);
    const download = addons.filter(a => !valid.find(v => v.short === a.short));
    const totalSize = addons.map(d => d.size).reduce((a, c) => a + c, 0);
    const validSize =
      addons
        .filter(a => valid.find(v => v.short === a.short))
        .map(d => d.size)
        .reduce((a, c) => a + c, 0);

    await disconnect();

    await _saveValid(valid);

    setProgress({ status: STATUS.DONE });

    return { mods, valid, download, validSize, totalSize };
  } catch (e) {
    setProgress({ status: STATUS.ERROR });
    throw e;
  }
}

async function download(downloadFiles) {
  try {
    setProgress({ status: STATUS.CONNECTING });

    await connect();

    const totalDownloadSize = downloadFiles.map(d => d.size).reduce((a, c) => a + c, 0);

    client.trackProgress(i => {
      const info = { ...i, fileSize: downloadFiles.find(d => d.url === i.name), totalDownloadSize };
      setProgress({ status: STATUS.DOWNLOADING, completed: info.bytesOverall / totalDownloadSize, info: info });
    });

    for (const d of downloadFiles) {
      try {
        const filePath = path.resolve(settings.a3mods, d.url);
        await downloadFile(d.url, filePath);
        unpackFile(filePath);
      } catch (e) {
        console.error(e);
      }
    }

    client.trackProgress();

    await disconnect();

    setProgress({ status: STATUS.DONE });

    return true;
  } catch (e) {
    setProgress({ status: STATUS.ERROR });
    throw e;
  }
}

ipcRenderer.on('ftp', (event, args) => {
  switch (args.type) {
    case 'init':
      settings = args.settings;
      ftpOptions = args.ftpOptions;
      break;
    case 'validate':
      settings = args.settings;
      validate(args.full)
        .then(res => ipcRenderer.send('web', {
          type: 'validate',
          res: res
        }))
        .catch(err => ipcRenderer.send('web', {
          type: 'validate',
          err: err
        }));
      break;
    case 'download':
      settings = args.settings;
      download(args.downloadFiles)
        .then(res => ipcRenderer.send('web', {
          type: 'download',
          res: res
        }))
        .catch(err => ipcRenderer.send('web', {
          type: 'download',
          err: err
        }));
      break;
  }
});