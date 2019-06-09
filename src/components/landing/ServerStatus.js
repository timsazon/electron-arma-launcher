import React, { useEffect, useState } from 'react';
import { withStyles } from "@material-ui/core";

const styles = theme => ({
  root: {
    ...theme.typography.button,
    backgroundColor: theme.palette.background.paper,
    padding: theme.spacing(1),
  },
});


function ServerStatus(props) {
  const [info, setInfo] = useState({ status: 'dead', players: 0, maxPlayers: 100 });

  useEffect(() => {
    updateServerInfo();
    setInterval(() => {
      updateServerInfo();
    }, 60000);
    // eslint-disable-next-line
  }, []);

  function updateServerInfo() {
    fetch('https://api.battlemetrics.com/servers/' + props.serverId, {
      method: 'GET',
      headers: {
        "Authorization": "Bearer " + process.env.REACT_APP_BM_TOKEN,
      }
    }).then(res => {
      if (res.ok) {
        res.json().then(json => {
          setInfo({
            status: json.data.attributes.status,
            players: json.data.attributes.players,
            maxPlayers: json.data.attributes.maxPlayers
          });
        });
      } else {
        return res.text().then(m => Promise.reject(new Error(m)));
      }
    }).catch(e => {
      console.log(e.message);
    });
  }

  return (
    <React.Fragment>
      <div className={props.classes.root}>
        {`${props.name}: `}
        {info.status === 'online' ?
          <span style={{ backgroundColor: '#00c90d', width: '13px', height: '13px', display: 'inline-block' }}/> :
          <span style={{ backgroundColor: '#9b0400', width: '13px', height: '13px', display: 'inline-block' }}/>}
        {` ${info.players}/${info.maxPlayers}`}
      </div>
    </React.Fragment>
  );
}

export default withStyles(styles)(ServerStatus);