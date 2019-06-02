import fs from "fs";
import path from "path";
import { remote } from 'electron';
import retry from 'async-retry';
import isDev from 'electron-is-dev';

import { checksum, createDir, getA3Directory, walk } from "./fs";

import Seven from 'node-7z';
import xml2js from 'xml2js';
import * as ftp from "basic-ftp";

const app = remote.app;
const xmlParser = new xml2js.Parser();

export const STATUS = {
  CONNECTING: "CONNECTING",
  VALIDATING: "VALIDATING",
  DOWNLOADING: "DOWNLOADING",
  DONE: "DONE",
  ERROR: "ERROR"
};

class FTPService {
  constructor() {
    this.MD5Dir = path.resolve(app.getPath('userData'), 'md5');
    this.client = new ftp.Client();
  }

  async connect() {
    this.A3Dir = await getA3Directory();
    if (!this.A3Dir) throw new Error("ArmA 3 не найдена!");

    await this.client.access({
      host: process.env.REACT_APP_FTP_HOST,
      user: process.env.REACT_APP_FTP_USER,
      password: process.env.REACT_APP_FTP_PASSWORD,
      secure: false
    });
  }

  async disconnect() {
    return await this.client.close();
  }

  async downloadFile(url, localPath) {
    return await retry(async () => {
      await createDir(path.dirname(localPath));
      const dStream = fs.createWriteStream(localPath);
      this.client.download(dStream, url);
      await new Promise((resolve, reject) => {
        dStream.on('finish', resolve);
        dStream.on('close', resolve);
        dStream.on('error', reject);
      });
    }, {
      retries: 5
    });
  }

  async unpackFile(localPath) {
    return await retry(async () => {
      const autoconfig = Seven.extractFull(localPath, path.dirname(localPath), {
        $bin: path.join(app.getAppPath(), isDev ? 'lib/7za.exe' : '../lib/7za.exe')
      });
      await new Promise((resolve, reject) => {
        autoconfig.on('error', reject);
        autoconfig.on('end', resolve);
      });

      await fs.promises.unlink(localPath);
    }, {
      retries: 5
    });
  }

  async validate(full, progress) {
    progress({ status: STATUS.CONNECTING });

    await this.connect();

    await this.downloadFile('autoconfig.7z', path.resolve(this.MD5Dir, 'autoconfig.7z'));
    await this.unpackFile(path.resolve(this.MD5Dir, 'autoconfig.7z'));

    const mods = await this._getMods();
    const addons = await this._getAddons();

    progress({ status: STATUS.VALIDATING });

    let oldValid = {};
    if (!full) {
      try {
        oldValid = JSON.parse(await fs.promises.readFile(path.resolve(this.MD5Dir, 'valid.json')));
      } catch (e) {
      }
    }

    const validAddons =
      await Promise.all(
        mods
          .map(async mod => {
            const res = await walk(path.resolve(this.A3Dir, mod));
            return await Promise.all(res.map(async f => {
              f.short = f.full.substr(this.A3Dir.length + 1, f.full.length);
              const remote = addons.find(a => a.short === f.short);
              if (remote) {
                if (!full) {
                  const v = oldValid.find(v => v.short === f.short && v.size === f.size && v.time === f.time);
                  v ? f.md5 = v.md5 : f.md5 = await checksum(f.full);
                } else {
                  f.md5 = await checksum(f.full);
                }
                if (f.md5 === remote.md5) {
                  return f;
                }
              }
              try {
                await fs.promises.unlink(f.full);
              } catch (e) {
                console.error(e);
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

    await this.disconnect();

    await this._saveValid(valid);

    progress({ status: STATUS.DONE });

    return { mods, valid, download, validSize, totalSize };
  }

  async download(downloadFiles, progress) {
    progress({ status: STATUS.CONNECTING });

    await this.connect();

    const totalDownloadSize = downloadFiles.map(d => d.size).reduce((a, c) => a + c, 0);

    this.client.trackProgress(i => {
      const info = { ...i, fileSize: downloadFiles.find(d => d.url === i.name), totalDownloadSize };
      progress({ status: STATUS.DOWNLOADING, completed: info.bytesOverall / totalDownloadSize, info: info });
    });

    for (const d of downloadFiles) {
      try {
        const filePath = path.resolve(this.A3Dir, d.url);
        await this.downloadFile(d.url, filePath);
        this.unpackFile(filePath);
      } catch (e) {
        console.error(e);
      }
    }

    this.client.trackProgress();

    await this.disconnect();

    progress({ status: STATUS.DONE });

    return true;
  }

  async _getMods() {
    const modsXML = await fs.promises.readFile(path.resolve(this.MD5Dir, 'autoconfig', 'Mods.xml'));
    return await new Promise((resolve, reject) => {
      xmlParser.parseString(modsXML, function (err, result) {
        if (err) reject(err);
        else resolve(result.DSServer.Mods.map(m => m.Name[0]));
      });
    });
  }

  async _getAddons() {
    const modsXML = await fs.promises.readFile(path.resolve(this.MD5Dir, 'autoconfig', 'Addons.xml'));
    return await new Promise((resolve, reject) => {
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

  async _saveValid(valid) {
    return await fs.promises.writeFile(
      path.resolve(this.MD5Dir, 'valid.json'),
      JSON.stringify(valid, null, 2),
      'utf8'
    );
  }
}

export default FTPService;