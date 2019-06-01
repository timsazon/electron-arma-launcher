import {
  HIDE_MESSAGE,
  SHOW_MESSAGE,
} from "./actionTypes";

export const showNotificationMessage = message => ({
  type: SHOW_MESSAGE,
  payload: {
    message: message
  }
});

export const hideNotificationMessage = () => ({
  type: HIDE_MESSAGE
});