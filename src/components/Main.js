import React from 'react';
import Frame from "./Frame";
import Landing from "./Landing";
import Snackbar from "@material-ui/core/Snackbar";
import { hideNotificationMessage } from "../redux/actions";
import { connect } from "react-redux";
import { getNotification } from "../redux/selectors";
import Slide from "@material-ui/core/Slide";

function SlideTransition(props) {
  return <Slide {...props} direction="right" />;
}

function Main(props) {
  return (
    <React.Fragment>
      <Frame/>
      <Landing/>
      <Snackbar
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        TransitionComponent={SlideTransition}
        open={props.isNotificationMessageOpen}
        autoHideDuration={3000}
        onClose={props.hideNotificationMessage}
        message={props.notificationMessage}
      />
    </React.Fragment>
  );
}

const mapStateToProps = state => {
  const notification = getNotification(state);
  return {
    isNotificationMessageOpen: notification.isOpen,
    notificationMessage: notification.message
  };
};

export default connect(
  mapStateToProps,
  { hideNotificationMessage }
)(Main);