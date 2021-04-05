//
// View / change playback and site settings
//
// https://ultrafunk.com
//


import * as debugLogger from './debuglogger.js?ver=1.19.4';
import * as settings    from './settings.js?ver=1.19.4';
import { showSnackbar } from './snackbar.js?ver=1.19.4';

import {
  KEY,
  deleteCookie,
  readJson,
  writeJson,
} from '../shared/storage.js?ver=1.19.4';


/*************************************************************************************************/


const debug          = debugLogger.newInstance('settings-ui');
let playbackSettings = null;
let siteSettings     = null;

const mConfig = {
  settingsContainerId:  'settings-container',
  settingsSaveResetId:  'settings-save-reset',
  settingsUpdatedEvent:  new Event('settingsUpdated'),
  playbackIdPrefix:     'playback', // Used to prevent HTML element ID collisions
  siteIdPrefix:         'site',     // Used to prevent HTML element ID collisions
};

const mElements = {
  settingsContainer: null,
};

const settingsErrorTemplate = `<h3>An error occurred while reading Playback and Site settings</h3>
  <p>This can be caused by several issues, but most likely it happened because of corrupt or malformed JSON data in the browsers Local Storage.</p>
  <p>Clearing all settings stored locally in the browser will probably fix the problem, click on the button below to do that.
  <b>Note:</b> All Playback and Site settings will be reset to default values.</p>
  <div class="settings-clear"><b>Clear All Settings</b></div>
  <p>If that does not work, another possible fix is to clear all cached data stored in the browser, the following links contain more information about how to do that for
  <a href="https://support.google.com/accounts/answer/32050">Chrome</a> and
  <a href="https://support.mozilla.org/en-US/kb/clear-cookies-and-site-data-firefox">Firefox</a>.</p>`;


// ************************************************************************************************
// Document loaded init + settings read error handling
// ************************************************************************************************

document.addEventListener('DOMContentLoaded', () =>
{ 
  debug.log('DOMContentLoaded');

  mElements.settingsContainer = document.getElementById(mConfig.settingsContainerId);

  if (mElements.settingsContainer !== null)
  {
    // For quick access to the Clear All Settings page...
    if (document.URL.includes('?clear=true'))
    {
      readSettingsError();
      return;
    }

    readSettings(false);

    if ((playbackSettings !== null) && (siteSettings !== null))
    {
      setCurrentSettings(playbackSettings.user, settings.playbackSchema.user);
      setCurrentSettings(siteSettings.user,     settings.siteSchema.user);
  
      insertSettingsHtml();
      mElements.settingsContainer.style.opacity = 1;
  
      document.querySelector(`#${mConfig.settingsSaveResetId} .settings-save`).addEventListener('click', settingsSaveClick);
      document.querySelector(`#${mConfig.settingsSaveResetId} .settings-reset`).addEventListener('click', settingsResetClick);
    }
    else
    {
      readSettingsError();
    }
  }
  else
  {
    debug.error(`Unable to getElementById() for '#${mConfig.settingsContainerId}'`);
  }
});

function readSettingsError()
{
  document.getElementById(mConfig.settingsSaveResetId).style.display = 'none';

  mElements.settingsContainer.insertAdjacentHTML('afterbegin', settingsErrorTemplate);
  mElements.settingsContainer.style.minHeight = '100%';
  mElements.settingsContainer.style.opacity = 1;

  document.querySelector(`#${mConfig.settingsContainerId} .settings-clear`).addEventListener('click', () =>
  {
    localStorage.removeItem(KEY.UF_PLAYBACK_SETTINGS);
    localStorage.removeItem(KEY.UF_SITE_SETTINGS);
    deleteCookie(KEY.UF_TRACKS_PER_PAGE);

    readSettings(true);

    if ((playbackSettings !== null) && (siteSettings !== null))
      showSnackbar('All settings have been cleared', 5, 'Reload', () => { window.location.href = '/settings/'; }, () => { window.location.href = '/settings/'; });
    else
      showSnackbar('Sorry, unable to clear all settings', 5);
  });
}


// ************************************************************************************************
// Read and write settings JSON data
// ************************************************************************************************

function readSettings(setDefault = false)
{
  playbackSettings = readJson(KEY.UF_PLAYBACK_SETTINGS, setDefault ? settings.playbackSettings : null, setDefault);
  siteSettings     = readJson(KEY.UF_SITE_SETTINGS,     setDefault ? settings.siteSettings     : null, setDefault);
}

function writeSettings()
{
  writeJson(KEY.UF_PLAYBACK_SETTINGS, playbackSettings);
  writeJson(KEY.UF_SITE_SETTINGS, siteSettings);
  document.dispatchEvent(mConfig.settingsUpdatedEvent);
}


// ************************************************************************************************
// Set current (read) and default settings values
// ************************************************************************************************

function setCurrentSettings(settings, schema)
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

function setDefaultSettings(settings, schema)
{
  Object.keys(settings).forEach(key =>
  {
    if (key in schema)
    {
      settings[key]       = schema[key].default;
      schema[key].current = getValueStringsIndex(schema[key], schema[key].default);
    }
  });
}

function getValueStringsIndex(schemaEntry, findValue)
{
  return schemaEntry.values.findIndex(value => value === findValue);
}


// ************************************************************************************************
// Create HTML table content for settings
// ************************************************************************************************

function insertSettingsHtml()
{
  let html = `\n<h3>Playback</h3>\n<table id="playback-settings">\n<tbody>`;
  Object.entries(settings.playbackSchema.user).forEach(entry => html += addTableRow(mConfig.playbackIdPrefix, entry));

  html += `\n</tbody>\n</table>\n<h3>Site</h3>\n<table id="site-settings">\n<tbody>`;
  Object.entries(settings.siteSchema.user).forEach(entry => html += addTableRow(mConfig.siteIdPrefix, entry));

  mElements.settingsContainer.insertAdjacentHTML('afterbegin', html + '\n</tbody>\n</table>\n');

  document.getElementById('playback-settings').addEventListener('click', playbackSettingsClick);
  document.getElementById('site-settings').addEventListener('click', siteSettingsClick);
}

function addTableRow(idPrefix, entry)
{
  const html =
    `\n<tr id="${idPrefix}:${entry[0]}" class="settings-entry">
      <td class="description">${entry[1].description}</td>
      <td class="${getTypeValueClasses(entry[1])}">${entry[1].valueStrings[entry[1].current]}</td>
    </tr>`;

  return html;
}

function getTypeValueClasses(entry)
{
  switch (entry.type)
  {
    case settings.TYPE_INTEGER: return 'value-string type-integer';
    case settings.TYPE_BOOLEAN: return `value-string type-boolean current-value-${(entry.values[entry.current] === true) ? 'true' : 'false'}`;
    case settings.TYPE_STRING:  return 'value-string type-string';
  }
}


// ************************************************************************************************
// Update row data and DOM
// ************************************************************************************************

function updateRowData(event, settings, schema)
{
  const element         = event.target.parentElement;
  const settingsKey     = element.id.split(':')[1];
  const schemaEntry     = schema[settingsKey];
  schemaEntry.current   = ((schemaEntry.current + 1) < schemaEntry.values.length) ? schemaEntry.current + 1 : schemaEntry.current = 0;
  settings[settingsKey] = schemaEntry.values[schemaEntry.current];

  updateRowDOM(element.querySelector('.value-string'), schemaEntry);
}

function updateRowDOM(element, schemaEntry)
{
  element.classList   = getTypeValueClasses(schemaEntry);
  element.textContent = schemaEntry.valueStrings[schemaEntry.current];
}

function updateSettingsDOM(settings, schema, idPrefix)
{
  Object.keys(settings).forEach(key =>
  {
    if (key in schema)
      updateRowDOM(document.getElementById(`${idPrefix}:${key}`).querySelector('.value-string'), schema[key]);
  });
}


// ************************************************************************************************
// Update data and DOM on UI-events (click)
// ************************************************************************************************

function playbackSettingsClick(event) { updateRowData(event, playbackSettings.user, settings.playbackSchema.user); }
function siteSettingsClick(event)     { updateRowData(event, siteSettings.user,     settings.siteSchema.user);     }

function settingsSaveClick()
{
  writeSettings();
  showSnackbar('All settings saved', 3);
}

function settingsResetClick()
{
  setDefaultSettings(playbackSettings.user, settings.playbackSchema.user);
  updateSettingsDOM(playbackSettings.user, settings.playbackSchema.user, mConfig.playbackIdPrefix);

  setDefaultSettings(siteSettings.user, settings.siteSchema.user);
  updateSettingsDOM(siteSettings.user, settings.siteSchema.user, mConfig.siteIdPrefix);

  showSnackbar('All settings reset', 5, 'Undo', () => location.reload(), () => writeSettings());
}
