//
// View / change playback and site settings
//
// https://ultrafunk.com
//


import * as debugLogger             from '../common/debuglogger.js?ver=1.9.1';
import { snackbar }                 from '../common/utils.js?ver=1.9.1';
import { KEY, readJson, writeJson } from '../common/storage.js?ver=1.9.1';
import * as settings                from '../common/settings.js?ver=1.9.1';


const debug          = debugLogger.getInstance('settings');
let playbackSettings = {};
let siteSettings     = {};

const moduleConfig = {
  settingsContainerId:  'settings-container',
  settingsSaveResetId:  'settings-save-reset',
  settingsUpdatedEvent: 'settingsUpdated',
};

const moduleElements = {
  settingsContainer: null,
};


// ************************************************************************************************
//
// ************************************************************************************************

document.addEventListener('DOMContentLoaded', () =>
{ 
  debug.log('DOMContentLoaded');

  moduleElements.settingsContainer = document.getElementById(moduleConfig.settingsContainerId);

  readSettings();

  if ((playbackSettings !== null) && (siteSettings !== null))
  {
    setCurrentValues(playbackSettings.user, settings.playbackSettingsSchema);
    setCurrentValues(siteSettings.user, settings.siteSettingsSchema);

    insertSettingsHtmlTable();

    document.querySelector(`#${moduleConfig.settingsSaveResetId} .settings-save`).addEventListener('click', settingsSaveClick);
    document.querySelector(`#${moduleConfig.settingsSaveResetId} .settings-reset`).addEventListener('click', settingsResetClick);
  }
  else
  {
    readSettingsError();
  }
});

function readSettingsError()
{
  debug.error(`Unable to read / parse Playback: ${KEY.UF_PLAYBACK_SETTINGS} and Site: ${KEY.UF_SITE_SETTINGS} settings JSON data`);

  document.getElementById(`${moduleConfig.settingsSaveResetId}`).style.display = 'none';

  const html = `<h3>An error occurred while reading Playback and Site settings</h3>
                <p>This can be caused by several issues, but most likely it happened because of corrupt or malformed JSON data in the browsers Local Storage.</p>
                <p>Clearing all settings stored locally in the browser will probably fix the problem, click on the button below to do that.
                <b>Note:</b> All Playback and Site settings will be reset to default values.</p>
                <div class="settings-clear"><b>Clear All Settings</b></div>
                <p>If that does not work, another possible fix is to clear all cached data stored in the browser, the following links contain more information about how to do that for
                <a href="https://support.google.com/accounts/answer/32050">Chrome</a> and
                <a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox">Firefox</a>.</p>`;

  if (moduleElements.settingsContainer !== null)
  {
    moduleElements.settingsContainer.insertAdjacentHTML('beforebegin', html);

    document.querySelector('.entry-content .settings-clear').addEventListener('click', () =>
    {
      localStorage.removeItem(KEY.UF_PLAYBACK_SETTINGS);
      localStorage.removeItem(KEY.UF_SITE_SETTINGS);

      readSettings();

      if ((playbackSettings !== null) && (siteSettings !== null))
        snackbar.show('All settings have been cleared', 5, 'Reload', () => location.reload(true), () => location.reload(true));
      else
        snackbar.show('Sorry, unable to clear all settings', 5);
    });
  }
}

// ************************************************************************************************
//
// ************************************************************************************************

function readSettings()
{
  playbackSettings = readJson(KEY.UF_PLAYBACK_SETTINGS, settings.playbackSettings);
  siteSettings     = readJson(KEY.UF_SITE_SETTINGS, settings.siteSettings);
}

function writeSettings()
{
  writeJson(KEY.UF_PLAYBACK_SETTINGS, playbackSettings);
  writeJson(KEY.UF_SITE_SETTINGS, siteSettings);
  document.dispatchEvent(new Event(moduleConfig.settingsUpdatedEvent));
}

function resetSettings(settings, schema)
{
  Object.keys(settings).forEach(key => { if (key in schema) settings[key] = schema[key].default; });
}


// ************************************************************************************************
//
// ************************************************************************************************

function setCurrentValues(settings, schema)
{
  Object.entries(settings).forEach(([key, settingValue]) =>
  {
    if (key in schema)
    {
      schema[key].current = getValueStringsIndex(schema[key], settingValue);

      if (schema[key].current === -1)
        schema[key].current = getValueStringsIndex(schema[key], schema[key].default);
    }
  });
}

function updateSettingsValues(settings, schema)
{
  Object.keys(settings).forEach(key =>
  {
    if (key in schema)
    {
      const valueString = schema[key].valueStrings[getValueStringsIndex(schema[key], settings[key])];
      document.getElementById(key).querySelector('.value-string').textContent = valueString;
    }
  });
}

function getValueStringsIndex(schemaEntry, findValue)
{
  return schemaEntry.values.findIndex(value => value === findValue);
}


// ************************************************************************************************
//
// ************************************************************************************************

function insertSettingsHtmlTable()
{
  let html = `\n<h3>Playback</h3>\n<table class="playback-settings">\n<tbody>`;
  Object.entries(settings.playbackSettingsSchema).forEach(entry => html += addTableRow(entry));

  html += `\n</tbody>\n</table>\n<h3>Site</h3>\n<table class="site-settings">\n<tbody>`;
  Object.entries(settings.siteSettingsSchema).forEach(entry => html += addTableRow(entry));

  html += `\n</tbody>\n</table>\n`;

  if (moduleElements.settingsContainer !== null)
  {
    moduleElements.settingsContainer.insertAdjacentHTML('afterbegin', html);
    Object.keys(settings.playbackSettingsSchema).forEach(key => document.getElementById(key).addEventListener('click', playbackSettingsClick));
    Object.keys(settings.siteSettingsSchema).forEach(key => document.getElementById(key).addEventListener('click', siteSettingsClick));
  }
}

function addTableRow(entry)
{
  const html =
    `\n<tr id="${entry[0]}" class="settings-entry">
      <td class="description">${entry[1].description}</td>
      <td class="value-string">${entry[1].valueStrings[entry[1].current]}</td>
    </tr>`;

  return html;
}


// ************************************************************************************************
//
// ************************************************************************************************

function playbackSettingsClick(event) { updateRowClicked(event, playbackSettings.user, settings.playbackSettingsSchema); }
function siteSettingsClick(event)     { updateRowClicked(event, siteSettings.user,     settings.siteSettingsSchema);     }

function updateRowClicked(event, settings, schema)
{
  const element        = event.target.parentElement;
  const schemaEntry    = schema[element.id];
  schemaEntry.current  = ((schemaEntry.current + 1) < schemaEntry.values.length) ? schemaEntry.current + 1 : schemaEntry.current = 0;
  settings[element.id] = schemaEntry.values[schemaEntry.current];

  element.querySelector('.value-string').textContent = schemaEntry.valueStrings[schemaEntry.current];
}

function settingsSaveClick()
{
  writeSettings();
  snackbar.show('Settings saved successfully', 3);
}

function settingsResetClick()
{
  resetSettings(playbackSettings.user, settings.playbackSettingsSchema);
  updateSettingsValues(playbackSettings.user, settings.playbackSettingsSchema);

  resetSettings(siteSettings.user, settings.siteSettingsSchema);
  updateSettingsValues(siteSettings.user, settings.siteSettingsSchema);

  snackbar.show('All settings reset', 5, 'Undo', () => location.reload(true), () => writeSettings());
}