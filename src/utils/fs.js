import fs from "fs";
import path from "path";
import crypto from "crypto";
import https from "https";
import isDev from "electron-is-dev";
import { remote } from "electron";
import regedit from "regedit";

const app = remote.app;

const regVBSLoc = path.join(app.getAppPath(), isDev ? 'lib/vbs' : '../lib/vbs');
regedit.setExternalVBSLocation(regVBSLoc);

export async function walk(dir) {
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

export function checksum(path) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');
    const rs = fs.createReadStream(path);
    rs.on('error', reject);
    rs.on('data', chunk => hash.update(chunk));
    rs.on('end', () => resolve(hash.digest('hex').toUpperCase()))
  });
}

export async function createDir(path) {
  try {
    await fs.promises.mkdir(path, { recursive: true });
  } catch (e) {
    console.log(e);
  }
}

export async function isExist(path) {
  try {
    await fs.promises.stat(path);
    return true;
  } catch (e) {
    return false;
  }
}

export function downloadAndSaveFile(url, path) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error('statusCode=' + res.statusCode));
      }

      const file = fs.createWriteStream(path);
      res.pipe(file);
      file.on('close', resolve);
      file.on('error', reject);
    });
  });
}

export function getRegistryValue(path, key) {
  return new Promise((resolve, reject) => {
    regedit.list(path, function (err, result) {
      if (err) return reject(err);
      if (result[path].values[key]) {
        resolve(result[path].values[key].value)
      } else {
        reject(new Error('The key not found'));
      }
    });
  })
}

export function getA3Directory() {
  return getRegistryValue('HKLM\\Software\\WOW6432Node\\bohemia interactive\\arma 3', 'main');
}