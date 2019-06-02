import React, { useEffect, useState } from 'react';
import { remote } from "electron";
import path from "path";
import { createDir, downloadAndSaveFile, getRegistryValue, isExist } from "../../utils/fs";
import { exec } from "child_process";
import isDev from "electron-is-dev";
import { connect } from "react-redux";
import { showNotificationMessage } from "../../redux/actions";
import Button from "@material-ui/core/Button";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogActions from "@material-ui/core/DialogActions";
import Dialog from "@material-ui/core/Dialog";
import Slide from "@material-ui/core/Slide";
import { DialogContent } from "@material-ui/core";
import DialogContentText from "@material-ui/core/DialogContentText";
import CircularProgress from "@material-ui/core/CircularProgress";
import TeamSpeakIcon from "@material-ui/icons/HeadsetMic";
import { promisify } from "util";

const execAsync = promisify(exec);

const app = remote.app;

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

async function getTeamSpeakDirectory() {
  let path = await getRegistryValue('HKLM\\Software\\TeamSpeak 3 Client', '');
  if (!path) path = await getRegistryValue('HKCU\\Software\\TeamSpeak 3 Client', '');
  return path;
}

async function isPluginExist() {
  let exist = await isExist(path.resolve(app.getPath('appData'), 'TS3Client', 'plugins', 'task_force_radio_win64.dll'));
  if (!exist) {
    const ts3dir = await getTeamSpeakDirectory();
    exist = await isExist(path.resolve(ts3dir, 'config', 'plugins', 'task_force_radio_win64.dll'));
    if (!exist) {
      exist = await isExist(path.resolve(ts3dir, 'plugins', 'task_force_radio_win64.dll'));
    }
  }
  return exist;
}

function TeamSpeak(props) {
  const [isTeamSpeak, setIsTeamSpeak] = useState(true);
  const [isPlugin, setIsPlugin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [dialog, setDialog] = useState({
    open: false,
    message: '',
    handleCancel: () => ({}),
    handleAccept: () => ({})
  });

  useEffect(() => {
    getTeamSpeakDirectory().then(d => {
      if (d && d.length > 0)
        setIsTeamSpeak(true);
      else
        setIsTeamSpeak(false);
      isPluginExist().then(setIsPlugin);
    });
  }, []);

  useEffect(() => {
    if (!dialog.open) {
      if (!isTeamSpeak) {
        setDialog({
          open: true,
          message: 'Установить TS3?',
          handleCancel: () => setDialog(d => ({ ...d, open: false })),
          handleAccept: () => {
            setDialog(d => ({ ...d, open: false }));
            setupTeamSpeak();
          }
        })
      } else if (!isPlugin) {
        setDialog({
          open: true,
          message: 'Установить TS3 плагин?',
          handleCancel: () => setDialog(d => ({ ...d, open: false })),
          handleAccept: () => {
            setDialog(d => ({ ...d, open: false }));
            setupPlugin();
          }
        })
      }
    }
    // eslint-disable-next-line
  }, [isTeamSpeak, isPlugin]);

  async function setupTeamSpeak() {
    const installerPath = path.resolve(app.getPath('userData'), 'ts3', 'TeamSpeak3_installer.exe');
    const isInstallerExist = await isExist(installerPath);
    if (!isInstallerExist) {
      setIsLoading(true);
      await createDir(path.dirname(installerPath));
      await downloadAndSaveFile(
        process.env.REACT_APP_TS3_DOWNLOAD_URL,
        installerPath
      );
      setIsLoading(false);
    }
    try {
      await execAsync(installerPath);
      const d = await getTeamSpeakDirectory();
      if (d && d.length > 0) {
        setIsTeamSpeak(true);
        await setupPlugin();
      } else {
        setIsTeamSpeak(false);
      }
    } catch (e) {
      props.showNotificationMessage("Установка прервана");
    }
  }

  async function setupPlugin() {
    try {
      await execAsync(path.join(app.getAppPath(), isDev ? 'lib/task_force_radio.ts3_plugin' : '../lib/task_force_radio.ts3_plugin'));
      const isExist = await isPluginExist();
      setIsPlugin(isExist);
    } catch (e) {
      props.showNotificationMessage("Ошибка: " + e.message);
    }
  }

  if (isLoading) return <CircularProgress/>;

  return (
    <React.Fragment>
      <Button
        href={isTeamSpeak && isPlugin ? process.env.REACT_APP_TS3_URL : '#'}
        variant="contained"
        color="primary"
        disableFocusRipple
        disableRipple
        disableTouchRipple
        onClick={() => {
          if (!isTeamSpeak) return setupTeamSpeak();
          if (!isPlugin) return setupPlugin();
        }}
      >
        <TeamSpeakIcon style={{ marginRight: '8px' }}/>
        TeamSpeak
      </Button>
      <Dialog
        open={dialog.open}
        TransitionComponent={Transition}
        keepMounted
        onClose={dialog.handleCancel}
        aria-labelledby="alert-dialog-slide-title"
        aria-describedby="alert-dialog-slide-description"
      >
        <DialogTitle id="alert-dialog-slide-title">{dialog.message}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Для игры на сервере необходимо наличие установленного TeamSpeak 3 с плагином рации
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={dialog.handleCancel} color="primary">
            Отмена
          </Button>
          <Button onClick={dialog.handleAccept} color="primary" variant="outlined">
            Установить
          </Button>
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
}

export default connect(
  null,
  { showNotificationMessage }
)(TeamSpeak);