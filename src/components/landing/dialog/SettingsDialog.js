import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import ListItem from '@material-ui/core/ListItem';
import List from '@material-ui/core/List';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CloseIcon from '@material-ui/icons/Close';
import FolderIcon from '@material-ui/icons/Folder';
import Slide from '@material-ui/core/Slide';
import TextField from "@material-ui/core/TextField";
import { Formik } from "formik";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { DialogContent } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
  appBar: {
    position: 'relative',
  },
  title: {
    marginLeft: theme.spacing(2),
    flex: 1,
  },
}));

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function SettingsDialog(props) {
  const classes = useStyles();

  const { open, settings, handleClose, handleReset, handleSave } = props;

  return (
    <Dialog fullScreen open={open} onClose={handleClose} TransitionComponent={Transition} style={{ marginTop: '22px' }}>
      <Formik
        initialValues={JSON.parse(JSON.stringify(settings))}
        onSubmit={handleSave}
        render={formik => (
          <React.Fragment>
            <AppBar className={classes.appBar}>
              <Toolbar>
                <IconButton type="button" edge="start" color="inherit" onClick={handleClose} aria-label="Close">
                  <CloseIcon/>
                </IconButton>
                <Typography variant="h6" className={classes.title}>
                  Настройки
                </Typography>
                <Button type="button" color="inherit" onClick={() => handleReset(formik.resetForm)} style={{ marginRight: '10px' }}>
                  Сбросить
                </Button>
                <Button type="submit" color="inherit" variant="outlined" onClick={formik.submitForm}>
                  Сохранить
                </Button>
              </Toolbar>
            </AppBar>
            <DialogContent dividers={true}>
            <List>
              <ListItem>
                <TextField
                  name="a3"
                  label="Директория ArmA 3"
                  fullWidth
                  margin="normal"
                  style={{ marginRight: '10px' }}
                  InputProps={{
                    disabled: true
                  }}
                  value={formik.values.a3}
                />
                <input
                  directory=""
                  webkitdirectory=""
                  style={{ display: 'none' }}
                  id="a3-select"
                  type="file"
                  onChange={e => {
                    if (!e.target.files[0]) return;
                    formik.setFieldValue('a3', e.target.files[0].path);
                    if (formik.values.a3 === formik.values.a3mods) {
                      formik.setFieldValue('a3mods', e.target.files[0].path);
                    }
                  }}
                />
                <label htmlFor="a3-select">
                  <IconButton type="button" component="span">
                    <FolderIcon/>
                  </IconButton>
                </label>
              </ListItem>
              <ListItem>
                <TextField
                  name="a3mods"
                  label="Директория с модами"
                  fullWidth
                  margin="normal"
                  style={{ marginRight: '10px' }}
                  InputProps={{
                    disabled: true
                  }}
                  value={formik.values.a3mods}
                />
                <input
                  directory=""
                  webkitdirectory=""
                  style={{ display: 'none' }}
                  id="a3mods-select"
                  type="file"
                  onChange={e => {
                    if (e.target.files[0]) formik.setFieldValue('a3mods', e.target.files[0].path)
                  }}
                />
                <label htmlFor="a3mods-select">
                  <IconButton type="button" component="span">
                    <FolderIcon/>
                  </IconButton>
                </label>
              </ListItem>
              <ListItem>
                <FormControlLabel
                  name="flags.window"
                  control={
                    <Checkbox
                      checked={formik.values.flags.window}
                      onChange={formik.handleChange}
                      color="primary"
                    />
                  }
                  label="Включить оконный режим (window)"
                />
              </ListItem>
              <ListItem>
                <FormControlLabel
                  name="flags.skipIntro"
                  control={
                    <Checkbox
                      checked={formik.values.flags.skipIntro}
                      onChange={formik.handleChange}
                      color="primary"
                    />
                  }
                  label="Показывать статический фон в меню (skipIntro)"
                />
              </ListItem>
              <ListItem>
                <FormControlLabel
                  name="flags.noSplash"
                  control={
                    <Checkbox
                      checked={formik.values.flags.noSplash}
                      onChange={formik.handleChange}
                      color="primary"
                    />
                  }
                  label="Пропускать логотипы при запуске (noSplash)"
                />
              </ListItem>
              <ListItem>
                <FormControlLabel
                  name="flags.noLogs"
                  control={
                    <Checkbox
                      checked={formik.values.flags.noLogs}
                      onChange={formik.handleChange}
                      color="primary"
                    />
                  }
                  label="Отключить логирование (noLogs)"
                />
              </ListItem>
              <ListItem>
                <FormControlLabel
                  name="flags.enableHT"
                  control={
                    <Checkbox
                      checked={formik.values.flags.enableHT}
                      onChange={formik.handleChange}
                      color="primary"
                    />
                  }
                  label="Включить Hyper-Threading (enableHT)"
                />
              </ListItem>
              <ListItem>
                <FormControlLabel
                  name="flags.hugePages"
                  control={
                    <Checkbox
                      checked={formik.values.flags.hugePages}
                      onChange={formik.handleChange}
                      color="primary"
                    />
                  }
                  label="Включить поддержку больших страниц (hugePages)"
                />
              </ListItem>
            </List>
            </DialogContent>
          </React.Fragment>
        )}
      />
    </Dialog>
  );
}

export default SettingsDialog;