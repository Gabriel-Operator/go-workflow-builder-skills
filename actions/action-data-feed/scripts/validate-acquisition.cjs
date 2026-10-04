const fs=require('node:fs');
const {validateFeedAcquisitionDefinition}=require('./acquisition.cjs');
try {
  if(process.argv.length!==3)throw new Error('Usage: node validate-acquisition.cjs <definition.json>');
  const definition=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
  if(!definition||typeof definition!=='object'||Array.isArray(definition))throw new Error('A feed definition must be an object.');
  validateFeedAcquisitionDefinition(definition);
  process.stdout.write('Data Feed acquisition contract valid.\n');
} catch(error) {process.stderr.write(`${error.message}\n`);process.exitCode=1;}
