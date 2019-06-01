import React from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import AddonsTable from "./AddonsTable";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function DownloadDialog(props) {
  const { open, handleCancel, handleAccept } = props;

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={handleCancel}
      aria-labelledby="alert-dialog-slide-title"
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle id="alert-dialog-slide-title">{"Скачать аддоны?"}</DialogTitle>
      <DialogContent>
        <AddonsTable files={props.files}/>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel} color="primary">
          Отмена
        </Button>
        <Button onClick={handleAccept} color="primary" variant="outlined">
          Скачать
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default DownloadDialog;