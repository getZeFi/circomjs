import log from 'log';
import fs from 'fs';
import https from 'https';

export const downloadFile = async (fileUrl, outputPath) => {
  log.info('Downloading File: %s', fileUrl);

  const file = fs.createWriteStream(outputPath);
  return new Promise((resolve) => {
    https.get(fileUrl, function (response) {
      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve(true);
      });
    });
  });
};
