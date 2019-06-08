import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import MaterialTable from "material-table";
import Paper from "@material-ui/core/Paper";
import path from "path";

const useStyles = makeStyles(() => ({
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

function getTree(files) {
  const tree = [];

  for (const file of files) {
    const p = file.name.split(path.sep);
    let currentLevel = tree;
    for (const part of p) {
      const existingPath = findWhere(currentLevel, 'name', part);

      if (existingPath) {
        existingPath.size += file.size;
        currentLevel = existingPath.children;
      } else {
        const newPart = {
          name: part,
          size: file.size,
          children: []
        };

        currentLevel.push(newPart);
        currentLevel = newPart.children;
      }
    }
  }

  return tree;

  function findWhere(array, key, value) {
    let t = 0;
    while (t < array.length && array[t][key] !== value) {
      t++;
    }

    if (t < array.length) {
      return array[t];
    } else {
      return false;
    }
  }
}

function flatTree(tree) {
  const list = [];

  function flatNode(node, parent) {
    list.push({ name: node.name, size: formatBytes(node.size), parent: parent });
    for (const child of node.children) {
      const p = path.join(parent, node.name);
      if (child.children) {
        flatNode(child, p);
      } else {
        list.push({ name: child.name, size: formatBytes(child.size), parent: p });
      }
    }
  }

  tree.forEach(n => flatNode(n, ''));

  return list;
}

function AddonsTable(props) {
  const classes = useStyles();
  const [data, setData] = useState([]);

  useEffect(() => {
    const data = flatTree(getTree(props.files));
    setData(data);
  }, [props.files]);

  return (
    <div className={classes.root}>
      <MaterialTable
        data={data}
        columns={[
          { title: 'Название', field: 'name' },
          { title: 'Размер (сжатый)', field: 'size' }
        ]}
        parentChildData={(row, rows) => rows.find(a => path.join(a.parent, a.name) === row.parent)}
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