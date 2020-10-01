//
// View / change playback and site settings
//
// https://ultrafunk.com
//


import * as debugLogger from '../common/debuglogger.js?ver=1.12.4';
import { snackbar }     from '../common/utils.js?ver=1.12.4';
import * as settings    from '../common/settings.js?ver=1.12.4';
import {
  KEY,
  deleteCookie,
  readJson,
  writeJson,
} from '../common/storage.js?ver=1.12.4';


const debug          = debugLogger.getInstance('settings');
let playbackSettings = null;
let siteSettings     = null;

const mConfig = {
  settingsContainerId:  'settings-container',
  settingsSaveResetId:  'settings-save-reset',
  settingsUpdatedEvent: 'settingsUpdated',
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
// Document load init + settings read error handling
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

    readSettings();

    if ((playbackSettings !== null) && (siteSettings !== null))
    {
      setCurrentValues(playbackSettings.user, settings.playbackSettingsSchema);
      setCurrentValues(siteSettings.user, settings.siteSettingsSchema);
  
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
  mElements.settingsContainer.style.opacity = 1;

  document.querySelector(`#${mConfig.settingsContainerId} .settings-clear`).addEventListener('click', () =>
  {
    localStorage.removeItem(KEY.UF_PLAYBACK_SETTINGS);
    localStorage.removeItem(KEY.UF_SITE_SETTINGS);
    deleteCookie(KEY.UF_TRACKS_PER_PAGE);

    readSettings();

    if ((playbackSettings !== null) && (siteSettings !== null))
      snackbar.show('All settings have been cleared', 5, 'Reload', () => { window.location.href = '/settings/'; }, () => { window.location.href = '/settings/'; });
    else
      snackbar.show('Sorry, unable to clear all settings', 5);
  });
}

// ************************************************************************************************
// Read and write settings JSON data from local storage + reset settings to default
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
  document.dispatchEvent(new Event(mConfig.settingsUpdatedEvent));
}

function resetSettings(settings, schema)
{
  Object.keys(settings).forEach(key => { if (key in schema) settings[key] = schema[key].default; });
}


// ************************************************************************************************
// Set current settings values and update values on UI interaction
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

function updateSettingsValues(settings, schema, idPrefix)
{
  Object.keys(settings).forEach(key =>
  {
    if (key in schema)
    {
      const valueString = schema[key].valueStrings[getValueStringsIndex(schema[key], settings[key])];
      document.getElementById(`${idPrefix}:${key}`).querySelector('.value-string').textContent = valueString;
    }
  });
}

function getValueStringsIndex(schemaEntry, findValue)
{
  return schemaEntry.values.findIndex(value => value === findValue);
}


// ************************************************************************************************
// Create HTML content for read settings
// ************************************************************************************************

function insertSettingsHtml()
{
  let html = `\n<h3>Playback</h3>\n<table class="playback-settings">\n<tbody>`;
  Object.entries(settings.playbackSettingsSchema).forEach(entry => html += addTableRow(mConfig.playbackIdPrefix, entry));

  html += `\n</tbody>\n</table>\n<h3>Site</h3>\n<table class="site-settings">\n<tbody>`;
  Object.entries(settings.siteSettingsSchema).forEach(entry => html += addTableRow(mConfig.siteIdPrefix, entry));

  html += `\n</tbody>\n</table>\n`;

  mElements.settingsContainer.insertAdjacentHTML('afterbegin', html);
  Object.keys(settings.playbackSettingsSchema).forEach(key => document.getElementById(`${mConfig.playbackIdPrefix}:${key}`).addEventListener('click', playbackSettingsClick));
  Object.keys(settings.siteSettingsSchema).forEach(key => document.getElementById(`${mConfig.siteIdPrefix}:${key}`).addEventListener('click', siteSettingsClick));
}

function addTableRow(idPrefix, entry)
{
  const html =
    `\n<tr id="${idPrefix}:${entry[0]}" class="settings-entry">
      <td class="description">${entry[1].description}</td>
      <td class="value-string">${entry[1].valueStrings[entry[1].current]}</td>
    </tr>`;

  return html;
}


// ************************************************************************************************
// Update data on UI-events (click), save and reset settings
// ************************************************************************************************

function playbackSettingsClick(event) { updateRowClicked(event, playbackSettings.user, settings.playbackSettingsSchema); }
function siteSettingsClick(event)     { updateRowClicked(event, siteSettings.user,     settings.siteSettingsSchema);     }

function updateRowClicked(event, settings, schema)
{
  const element         = event.target.parentElement;
  const settingsKey     = element.id.split(':')[1];
  const schemaEntry     = schema[settingsKey];
  schemaEntry.current   = ((schemaEntry.current + 1) < schemaEntry.values.length) ? schemaEntry.current + 1 : schemaEntry.current = 0;
  settings[settingsKey] = schemaEntry.values[schemaEntry.current];

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
  updateSettingsValues(playbackSettings.user, settings.playbackSettingsSchema, mConfig.playbackIdPrefix);

  resetSettings(siteSettings.user, settings.siteSettingsSchema);
  updateSettingsValues(siteSettings.user, settings.siteSettingsSchema, mConfig.siteIdPrefix);

  snackbar.show('All settings reset', 5, 'Undo', () => location.reload(), () => writeSettings());
}
