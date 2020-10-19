//
// Create JS chunk name PHP file
//
// https://ultrafunk.com
//


import { readdirSync, lstatSync, writeFile } from "fs";
import { join } from "path";


/*************************************************************************************************/


const jsChunksPath      = './js/dist/';
const jsChunkFilesRegEx = /chunk\..*\.js$/i;


// ************************************************************************************************
//
// ************************************************************************************************

const getMostRecentFile = (dir) =>
{
  const files = orderReccentFiles(dir);
  return files.length ? files[0] : undefined;
};

const orderReccentFiles = (dir) =>
{
  return readdirSync(dir)
    .filter((file) => lstatSync(join(dir, file)).isFile())
    .filter((file) => file.match(jsChunkFilesRegEx))
    .map((file) => ({ file, mtime: lstatSync(join(dir, file)).mtime }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
};


// ************************************************************************************************
//
// ************************************************************************************************

const newestChunk = getMostRecentFile(jsChunksPath);
const isProdBuild = (process.argv[2].toLowerCase() === 'prod') ? true : false; // eslint-disable-line no-undef

const template =
`<?php

$ultrafunk_is_prod_build    = ${isProdBuild};
$ultrafunk_js_preload_chunk = '/js/dist/${newestChunk['file']}';

?>
`;

if ((newestChunk !== undefined) && (process.argv.length === 3)) // eslint-disable-line no-undef
{
  writeFile('./inc/preload-chunk.php', template, (error) =>
  {
    if (error)
      return console.error(error);
  });
}
else
{
  console.error('getMostRecentFile() failed for: ' + jsChunksPath);
}
