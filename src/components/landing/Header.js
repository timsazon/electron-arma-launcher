import React from 'react';
import { connect } from "react-redux";
import { showNotificationMessage } from "../../redux/actions";
import TeamSpeak from "./TeamSpeak";
import ServerStatus from "./ServerStatus";

function Header() {
  return (
    <React.Fragment>
      <div className="upper center-h" style={{ gridColumn: 2, marginTop: '20px' }}>
        <ServerStatus/>
      </div>
      <div className="upper" style={{ gridColumn: 3, justifySelf: 'end', marginTop: '20px', marginRight: '20px' }}>
        <TeamSpeak/>
      </div>
    </React.Fragment>
  );
}

export default connect(
  null,
  { showNotificationMessage }
)(Header);