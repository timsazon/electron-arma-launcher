import { SHOW_MESSAGE, HIDE_MESSAGE } from "../actionTypes";

const initialState = {
  message: '',
};

export default function (state = initialState, action) {
  switch (action.type) {
    case SHOW_MESSAGE: {
      return {
        ...state,
        isOpen: true,
        message: action.payload.message
      };
    }
    case HIDE_MESSAGE: {
      return {
        ...state,
        isOpen: false
      };
    }
    default:
      return state;
  }
}
