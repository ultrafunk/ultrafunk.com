//
// Term REST data fetch and caching
//
// https://ultrafunk.com
//


import * as debugLogger from '../shared/debuglogger.js';
import { KEY }          from '../shared/storage.js';


export {
  fetchPosts,
  fetchMeta,
  readCache,
  writeCache,
  deleteCache,
  hasCache,
};


/*************************************************************************************************/


const debug   = debugLogger.newInstance('term-rest');
let termCache = {};


// ************************************************************************************************
// Fetch tracks (posts) for a given termType with termId (taxonomy: category or tag)
// ************************************************************************************************

function fetchPosts(termType, termId, maxItems, callback)
{ 
  if (termId in termCache)
  {
    callback(termCache[termId].posts);
  }
  else
  {
    debug.log(`fetchPosts() - termType: ${termType} - termId: ${termId} - maxItems: ${maxItems}`);

    fetch(`/wp-json/wp/v2/posts?${termType}=${termId}&per_page=${maxItems}&_fields=title,link,content,tags,categories`)
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
      termCache[termId] = { posts: data };
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
  if (('categories' in termCache[termId]) && ('tags' in termCache[termId]))
  {
    callback('categories', termCache[termId].categories);
    callback('tags',       termCache[termId].tags);
  }
  else
  {
    const categories = [];
    let   tags       = [];
  
    termData.forEach(item =>
    {
      categories.push.apply(categories, item.categories);
      tags.push.apply(tags, item.tags);
    });
  
    tags = tags.filter(item => (item !== termId));
  
    fetchMetadata('categories', termId, [...new Set(categories)], maxItems, callback);
    fetchMetadata('tags',       termId, [...new Set(tags)],       maxItems, callback);
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
      termCache[termId][termType] = data;
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
    termCache[termId][termType] = null;
    callback(termType, null);
  }
}


// ************************************************************************************************
// Term cache functions
// ************************************************************************************************

function readCache()
{
  termCache = JSON.parse(sessionStorage.getItem(KEY.UF_TERMLIST_CACHE));
  
  if (termCache === null)
    termCache = {};
}

function writeCache()
{
  sessionStorage.setItem(KEY.UF_TERMLIST_CACHE, JSON.stringify(termCache));
}

function deleteCache()
{
  sessionStorage.removeItem(KEY.UF_TERMLIST_CACHE);
}

function hasCache()
{
  return (Object.keys(termCache).length > 0);
}
