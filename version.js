const fs = require('fs');
const package = require('./package.json');

package.version = `0.16.0-${Date.now()}`;

fs.writeFileSync('./package.json', JSON.stringify(package, null, 2));

console.log(`[Version Updater]: Bumped to ${package.version}`);
