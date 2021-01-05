//
// Term REST data fetch
//
// https://ultrafunk.com
//


import * as debugLogger from '../shared/debuglogger.js';


export {
  fetchTracks,
  fetchMeta,
};


/*************************************************************************************************/


const debug = debugLogger.newInstance('term-rest');


// ************************************************************************************************
// Fetch tracks (posts) for a given termType with termId (taxonomy: category or tag)
// ************************************************************************************************

function fetchTracks(termType, termId, maxItems, callback)
{ 
  debug.log(`fetchTracks() - termType: ${termType} - termId: ${termId} - maxItems: ${maxItems}`);

  fetch(`/wp-json/wp/v2/posts?${termType}=${termId}&per_page=${maxItems}`)
    .then(response => 
    {
      if (!response.ok)
      {
        debug.error(response);
        return null;
      }
      
      return response.json();
    })
    .then(data => callback(data));
}


// ************************************************************************************************
// Merge then fetch metadata for a given termType with termIds (taxonomy: category or tag)
// ************************************************************************************************

function fetchMeta(termData, termId, maxItems, callback)
{
  const channels = [];
  let   artists  = [];

  termData.forEach(item =>
  {
    channels.push.apply(channels, item.categories);
    artists.push.apply(artists, item.tags);
  });

  artists = artists.filter(item => item !== termId);

  fetchMetadata('categories', [...new Set(channels)], maxItems, callback);
  fetchMetadata('tags',       [...new Set(artists)],  maxItems, callback);
}

function fetchMetadata(termType, termIds, maxItems, callback)
{
  debug.log(`fetchMetadata() - termType: ${termType} - termIds: ${(termIds.length > 0) ? termIds : 'Empty'} - maxItems: ${maxItems}`);

  if (termIds.length > 0)
  {
    fetch(`/wp-json/wp/v2/${termType}?include=${termIds.join(',')}&per_page=${maxItems}`)
      .then(response => 
      {
        if (!response.ok)
        {
          debug.error(response);
          return null;
        }
        
        return response.json();
      })
      .then(data => callback(termType, data));
  }
  else
  {
    callback(termType, null);
  }
}
