import React, { useContext, useEffect, useState } from "react";
import { ipcRenderer } from 'electron';

import { SettingsContext } from "./SettingsProvider";

export const STATUS = {
  CONNECTING: "CONNECTING",
  VALIDATING: "VALIDATING",
  DOWNLOADING: "DOWNLOADING",
  DONE: "DONE",
  ERROR: "ERROR",
  NONE: "NONE"
};

const Context = React.createContext({
  progress: { status: STATUS.NONE },
  validate: null,
  download: null
});

function Provider(props) {
  const [progress, setProgress] = useState({ status: STATUS.NONE });
  const { settings } = useContext(SettingsContext);

  useEffect(() => {
    ipcRenderer.send('ftp',{
      type: 'init',
      settings: settings,
      ftpOptions: {
        host: process.env.REACT_APP_FTP_HOST,
        user: process.env.REACT_APP_FTP_USER,
        password: process.env.REACT_APP_FTP_PASSWORD,
        path: process.env.REACT_APP_FTP_PATH,
        secure: false
      }
    });

    ipcRenderer.on('web', (event, args) => {
      if (args.type === 'progress') setProgress(args.progress);
    });
    // eslint-disable-next-line
  }, []);

  async function validate(full) {
    ipcRenderer.send('ftp',{
      type: 'validate',
      settings: settings,
      full: full
    });

    return new Promise((resolve, reject) => {
      ipcRenderer.on('web', (event, args) => {
        if (args.type === 'validate') {
          if (!args.err) resolve(args.res);
          else reject(args.err);
        }
      });
    });
  }

  async function download(downloadFiles) {
    ipcRenderer.send('ftp',{
      type: 'download',
      settings: settings,
      downloadFiles: downloadFiles
    });

    return new Promise((resolve, reject) => {
      ipcRenderer.on('web', (event, args) => {
        if (args.type === 'download') {
          if (!args.err) resolve(args.res);
          else reject(args.err);
        }
      });
    });
  }

  return (
    <Context.Provider
      value={{
        progress: progress,
        validate: validate,
        download: download,
      }}
    >
      {props.children}
    </Context.Provider>
  )
}

export {
  Context as FtpContext,
  Provider as FtpProvider
}
