import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import MaterialTable from "material-table";
import Paper from "@material-ui/core/Paper";

const useStyles = makeStyles(theme => ({
  root: {
    width: '100%',
  }
}));

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Байт';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function AddonsTable(props) {
  const classes = useStyles();
  const [data, setData] = useState([]);

  useEffect(() => {
    const addons = {};
    const files = props.files.slice(0);

    for (const file of files) {
      const parent = file.name.substring(0, file.name.indexOf('\\'));

      if (addons[parent]) {
        addons[parent].size += file.size;
      } else {
        addons[parent] = { name: parent, size: file.size };
      }

      file.parent = parent;
      file.name = file.name.substring(file.name.indexOf('\\') + 1, file.name.length);
      file.size = formatBytes(file.size);
    }

    Object.values(addons).forEach(a => a.size = formatBytes(a.size));
    setData(Object.values(addons).concat(files));
  }, [props.files]);

  return (
    <div className={classes.root}>
      <MaterialTable
        data={data}
        columns={[
          { title: 'Название', field: 'name' },
          { title: 'Размер (сжатый)', field: 'size' }
        ]}
        parentChildData={(row, rows) => rows.find(a => a.name === row.parent)}
        options={{
          search: false,
          toolbar: false,
          paging: false
        }}
        components={{
          Container: props => (
            <Paper {...props} elevation={0}/>
          )
        }}
      />
    </div>
  );
}

export default AddonsTable;