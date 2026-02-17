const { join } = require('path');

/**
 * @type {import("puppeteer").Configuration}
 */
module.exports = {
  // Chrome viene scaricato nella directory del progetto,
  // accessibile dall'utente www-data senza bisogno di copie manuali.
  cacheDirectory: join(__dirname, '.puppeteer-cache'),
};
