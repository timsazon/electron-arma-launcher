import React, { useEffect, useState } from "react";
import fs from "fs";
import path from "path";
import { remote } from 'electron';

import { getA3Directory } from "../../utils/fs";

const app = remote.app;

const settingsPath = path.resolve(app.getPath('userData'), 'settings.json');
const initialSettings = {
  a3: '',
  a3mods: '',
  flags: {
    window: false,
    skipIntro: true,
    noSplash: true,
    noLogs: false,
    enableHT: false,
    hugePages: false
  }
};

const Context = React.createContext({
  settings: JSON.parse(JSON.stringify(initialSettings)),
  validate: null,
  download: null
});

function Provider(props) {
  const [settings, setSettings] = useState(JSON.parse(JSON.stringify(initialSettings)));

  useEffect(() => {
    _readSettings()
    // eslint-disable-next-line
  }, []);

  async function _readSettings() {
    try {
      const s = JSON.parse(await fs.promises.readFile(settingsPath, 'utf8'));
      if (!s.a3 || s.a3.length < 1) {
        s.a3 = await getA3Directory();
        s.a3mods = s.a3;
        await _saveSettings(settings);
      }
      setSettings(s);
      return s;
    } catch (e) {
      console.error(e.message);
      return reset();
    }
  }

  async function _saveSettings(s) {
    await fs.promises.writeFile(settingsPath, JSON.stringify(s, null, 2), 'utf8');
    return s;
  }

  async function update(s) {
    await _saveSettings(s);
    setSettings(s);
    return s;
  }

  async function reset() {
    const s = JSON.parse(JSON.stringify(initialSettings));
    try {
      s.a3 = await getA3Directory();
      s.a3mods = s.a3;
    } catch (e) {
      console.error(e.message);
    }
    await _saveSettings(s);
    setSettings(s);
    return s;
  }

  return (
    <Context.Provider
      value={{
        settings: settings,
        update: update,
        reset: reset,
      }}
    >
      {props.children}
    </Context.Provider>
  )
}

export {
  Context as SettingsContext,
  Provider as SettingsProvider
}
