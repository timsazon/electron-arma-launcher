import React, { useEffect, useState } from 'react';
import Button from "@material-ui/core/Button";
import FTPService, { STATUS } from "../../utils/FTPService";
import { remote } from "electron";

import path from "path";
import { execFile } from 'child_process';
import Loader from "./Loader";
import DownloadDialog from "./dialog/DownloadDialog";
import { connect } from "react-redux";
import { showNotificationMessage } from "../../redux/actions";
import { getA3Directory } from "../../utils/fs";

function Footer(props) {
  const [ftp, setFtp] = useState(null);
  const [progress, setProgress] = useState({ status: null });
  const [A3Dir, setA3Dir] = useState(undefined);

  const [downloadDialog, setDownloadDialog] = useState({
    open: false, files: [], handleCancel: () => {
    }, handleAccept: () => {
    }
  });

  useEffect(() => {
    getA3Directory().then(d => {
      setA3Dir(d);
      setFtp(new FTPService(d));
    });
  }, []);

  useEffect(() => {
    switch (progress.status) {
      case STATUS.VALIDATING:
        remote.getCurrentWindow().setProgressBar(2);
        break;
      case STATUS.DOWNLOADING:
        remote.getCurrentWindow().setProgressBar(progress.completed);
        break;
      default:
        remote.getCurrentWindow().setProgressBar(-1);
    }
  }, [progress]);

  async function check(full = true) {
    try {
      if (!A3Dir) throw new Error("ArmA 3 не найдена!");

      const validationInfo = await ftp.validate(full, setProgress);

      if (validationInfo.download.length > 0) {
        setDownloadDialog({
          open: true,
          files: validationInfo.download.map(d => ({ name: d.short, size: d.size })),
          handleCancel: () => setDownloadDialog(d => ({ ...d, open: false })),
          handleAccept: () => {
            setDownloadDialog(d => ({ ...d, open: false }));
            ftp.download(validationInfo.download, setProgress)
              .then(() => props.showNotificationMessage("Все файлы загружены!"));
          }
        });
      } else {
        props.showNotificationMessage("Все файлы прошли проверку!");
      }
    } catch (e) {
      setProgress({ status: null });
      props.showNotificationMessage("Ошибка: " + e.message);
    }
  }

  async function start() {
    try {
      if (!A3Dir) throw new Error("ArmA 3 не найдена!");

      await check(false);
      const validationInfo = await ftp.validate(false, () => {});
      if (validationInfo.download.length > 0) throw new Error('Не все файлы загружены');

      execFile(path.resolve(A3Dir, 'arma3battleye.exe'), ['-noSplash', '-noLogs', `-mod=${validationInfo.mods.join(';')}`], (error) => {
        if (error) throw error;
      });

      const window = remote.getCurrentWindow();
      window.minimize();
    } catch (e) {
      setProgress({ status: null });
      props.showNotificationMessage("Ошибка: " + e.message);
    }
  }

  return (
    <React.Fragment>
      {!progress.status || progress.status === STATUS.DONE ?
        <div className="lower" style={{ gridColumn: 1, marginLeft: '20px', marginBottom: '20px', justifySelf: 'start', alignSelf: 'end' }}>
          <Button
            size="large"
            color="secondary"
            disableFocusRipple
            disableRipple
            style={{ fontSize: '3em' }}
            onClick={() => check()}
          >
            Проверка
          </Button>
        </div> :
        <div className="lower" style={{ gridColumn: '1 / 3', marginLeft: '20px', marginBottom: '20px', justifySelf: 'stretch', alignSelf: 'end' }}>
          <Loader progress={progress}/>
        </div>}
      <div className="lower" style={{ gridColumn: 3, marginRight: '20px', marginBottom: '20px', justifySelf: 'end', alignSelf: 'end' }}>
        <Button
          size="large"
          color="secondary"
          disableFocusRipple
          disableRipple
          style={{ fontSize: '3em' }}
          onClick={start}
          disabled={progress.status && progress.status !== STATUS.DONE}
        >
          Играть
        </Button>
      </div>
      <DownloadDialog
        open={downloadDialog.open}
        files={downloadDialog.files}
        handleCancel={downloadDialog.handleCancel}
        handleAccept={downloadDialog.handleAccept}
      />
    </React.Fragment>
  );
}

export default connect(
  null,
  { showNotificationMessage }
)(Footer);