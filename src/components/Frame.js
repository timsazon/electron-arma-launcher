import React from 'react';
import { remote } from "electron";

import '../assets/css/frame.css';

function Frame() {
  function minimize(e) {
    const window = remote.getCurrentWindow();
    window.minimize();
    e.currentTarget.blur();
  }

  function maximize(e) {
    const window = remote.getCurrentWindow();
    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
    e.currentTarget.blur();
  }

  function close() {
    const window = remote.getCurrentWindow();
    window.close();
  }

  return (
    <div id="frameBar">
      <div id="frameResizableTop" className="frameDragPadder"/>
      <div id="frameMain">
        <div className="frameResizableVert frameDragPadder"/>
        <div id="frameContentWin">
          <div id="frameImageDock">
          </div>
          <div id="frameButtonDockWin">
            <button className="frameButton" id="frameButton_minimize" tabIndex="-1" onClick={minimize}>
              <svg name="TitleBarMinimize" width="10" height="10" viewBox="0 0 12 12">
                <rect stroke="#ffffff" fill="#ffffff" width="10" height="1" x="1" y="6"/>
              </svg>
            </button>
            <button className="frameButton" id="frameButton_restoredown" tabIndex="-1" onClick={maximize}>
              <svg name="TitleBarMaximize" width="10" height="10" viewBox="0 0 12 12">
                <rect width="9" height="9" x="1.5" y="1.5" fill="none" stroke="#ffffff" strokeWidth="1.4px"/>
              </svg>
            </button>
            <button className="frameButton" id="frameButton_close" tabIndex="-1" onClick={close}>
              <svg name="TitleBarClose" width="10" height="10" viewBox="0 0 12 12">
                <polygon stroke="#ffffff" fill="#ffffff" fillRule="evenodd"
                         points="11 1.576 6.583 6 11 10.424 10.424 11 6 6.583 1.576 11 1 10.424 5.417 6 1 1.576 1.576 1 6 5.417 10.424 1"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="frameResizableVert frameDragPadder"/>
      </div>
    </div>
  );
}

export default Frame;