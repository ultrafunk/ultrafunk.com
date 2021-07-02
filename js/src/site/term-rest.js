//
// Term REST data fetch and caching
//
// https://ultrafunk.com
//


import * as debugLogger from '../shared/debuglogger.js';
import { KEY }          from '../shared/storage.js';


export {
  fetchTracks,
  fetchMeta,
  readCache,
  writeCache,
  deleteCache,
  hasCache,
};


/*************************************************************************************************/


const debug = debugLogger.newInstance('term-rest');

const m = {
  termCache: {},
};


// ************************************************************************************************
// Fetch tracks for a given termType with termId (taxonomy: channel or artist)
// ************************************************************************************************

function fetchTracks(termType, termId, maxItems, callback)
{ 
  if (termId in m.termCache)
  {
    callback(m.termCache[termId].tracks);
  }
  else
  {
    debug.log(`fetchTracks() - termType: ${termType} - termId: ${termId} - maxItems: ${maxItems}`);

    fetch(`/wp-json/wp/v2/tracks?${termType}=${termId}&per_page=${maxItems}&_fields=link,artists,channels,meta`)
    .then(response => 
    {
      if (!response.ok)
      {
        debug.error(response);
        return null;
      }
      
      return response.json();
    })
    .then(data =>
    {
      m.termCache[termId] = { tracks: data };
      callback(data);
    })
    .catch(reason =>
    {
      debug.warn(reason);
      callback(null);
    });
  }
}


// ************************************************************************************************
// Merge then fetch metadata for a given termType with termIds (taxonomy: category or tag)
// ************************************************************************************************

function fetchMeta(termData, termId, maxItems, callback)
{
  if (('channels' in m.termCache[termId]) && ('artists' in m.termCache[termId]))
  {
    callback('channels', m.termCache[termId].channels);
    callback('artists',  m.termCache[termId].artists);
  }
  else
  {
    const channels = [];
    let   artists  = [];
  
    termData.forEach(item =>
    {
      channels.push.apply(channels, item.channels);
      artists.push.apply(artists, item.artists);
    });
  
    artists = artists.filter(item => (item !== termId));
  
    fetchMetadata('channels', termId, [...new Set(channels)], maxItems, callback);
    fetchMetadata('artists',  termId, [...new Set(artists)],  maxItems, callback);
  }
}

function fetchMetadata(termType, termId, termIds, maxItems, callback)
{
  /*
  if ((termId in termCache) === false)
    termCache[termId] = {};
  */

  if (termIds.length > 0)
  {
    debug.log(`fetchMetadata() - termType: ${termType} - termIds: ${(termIds.length > 0) ? termIds : 'Empty'} - maxItems: ${maxItems}`);

    fetch(`/wp-json/wp/v2/${termType}?include=${termIds.join(',')}&per_page=${maxItems}&_fields=link,name`)
    .then(response => 
    {
      if (!response.ok)
      {
        debug.error(response);
        return null;
      }
      
      return response.json();
    })
    .then(data =>
    {
      m.termCache[termId][termType] = data;
      callback(termType, data);
    })
    .catch(reason =>
    {
      debug.warn(reason);
      callback(null);
    });
  }
  else
  {
    m.termCache[termId][termType] = null;
    callback(termType, null);
  }
}


// ************************************************************************************************
// Term cache functions
// ************************************************************************************************

function readCache()
{
  m.termCache = JSON.parse(sessionStorage.getItem(KEY.UF_TERMLIST_CACHE));
  
  if (m.termCache === null)
    m.termCache = {};
}

function writeCache()
{
  sessionStorage.setItem(KEY.UF_TERMLIST_CACHE, JSON.stringify(m.termCache));
}

function deleteCache()
{
  sessionStorage.removeItem(KEY.UF_TERMLIST_CACHE);
}

function hasCache()
{
  return (Object.keys(m.termCache).length > 0);
}
