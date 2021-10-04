const fs = require('fs');
const package = require('./package.json');
const childProc = require('child_process');

const rev = childProc.execSync('git rev-parse --short HEAD').toString().trim();

package.version = `0.16.0-${rev}`;

fs.writeFileSync('./package.json', JSON.stringify(package, null, 2));

console.log(`[Version Updater]: Bumped to ${package.version}`);
