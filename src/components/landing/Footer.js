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
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import Grid from "@material-ui/core/Grid";
import Tooltip from "@material-ui/core/Tooltip";

function Footer(props) {
  const [ftp, setFtp] = useState(null);
  const [progress, setProgress] = useState({ status: null });
  const [fullCheck, setFullCheck] = useState(false);

  const [downloadDialog, setDownloadDialog] = useState({
    open: false, files: [], handleCancel: () => ({}), handleAccept: () => ({})
  });

  useEffect(() => {
    setFtp(new FTPService());
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

  async function check() {
    try {
      const A3Dir = await getA3Directory();
      if (!A3Dir) throw new Error("ArmA 3 не найдена!");

      const validationInfo = await ftp.validate(fullCheck, setProgress);

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
      const A3Dir = await getA3Directory();
      if (!A3Dir) throw new Error("ArmA 3 не найдена!");

      await check(false);
      const validationInfo = await ftp.validate(false, () => ({}));
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
        <div className="lower" style={{
          gridColumn: 1,
          marginLeft: '20px',
          marginBottom: '20px',
          justifySelf: 'start',
          alignSelf: 'end'
        }}>
          <Grid container direction="column">
            <Grid item style={{ marginLeft: '25px' }}>
              <Tooltip title="Полная проверка MD5" placement="right">
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={fullCheck}
                      onChange={e => setFullCheck(e.target.checked)}
                      value="fullCheck"
                      color="primary"
                    />
                  }
                  label="Полная"
                />
              </Tooltip>
            </Grid>
            <Grid item>
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
            </Grid>
          </Grid>
        </div> :
        <div className="lower" style={{
          gridColumn: '1 / 3',
          marginLeft: '20px',
          marginBottom: '20px',
          justifySelf: 'stretch',
          alignSelf: 'end'
        }}>
          <Loader progress={progress}/>
        </div>}
      <div className="lower"
           style={{ gridColumn: 3, marginRight: '20px', marginBottom: '20px', justifySelf: 'end', alignSelf: 'end' }}>
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