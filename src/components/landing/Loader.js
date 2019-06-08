import React from "react";
import { LinearProgress } from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import { STATUS } from "../providers/FtpProvider";

function Loader(props) {
  const { progress } = props;

  const getMessage = () => {
    switch (progress.status) {
      case STATUS.CONNECTING:
        return 'Соединение с FTP-сервером...';
      case STATUS.VALIDATING:
        return 'Проверка файлов...';
      case STATUS.DOWNLOADING:
        return `Загрузка ${progress.info.name}...`;
      default:
        return '';
    }
  };

  return (
    <React.Fragment>
      <ProgressBar {...props}/>
      <Typography>{getMessage()}</Typography>
    </React.Fragment>
  )
}

function ProgressBar(props) {
  const { progress } = props;

  switch (progress.status) {
    case STATUS.CONNECTING:
    case STATUS.VALIDATING:
      return (
        <LinearProgress
          color="primary"
          style={{ width: '100%', height: '50px' }}
        />
      );
    case STATUS.DOWNLOADING:
      return (
        <LinearProgress
          color="primary"
          variant="determinate"
          value={progress.completed * 100}
          style={{ width: '100%', height: '50px' }}
        />
      );
    default:
      return <React.Fragment/>;
  }
}

export default Loader;