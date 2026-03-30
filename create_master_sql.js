const fs = require('fs');
const path = require('path');

const dir = __dirname;
const files = fs.readdirSync(dir).filter(f => f.startsWith('supabase_') && f.endsWith('.sql') && f !== 'supabase_clear_sample_data.sql');

// Sort files by creation/modification time (oldest first)
files.sort((a, b) => {
    return fs.statSync(path.join(dir, a)).mtimeMs - fs.statSync(path.join(dir, b)).mtimeMs;
});

let combinedSQL = '-- Automatically generated master setup script\n\n';

for (const file of files) {
    combinedSQL += `-- ==========================================\n`;
    combinedSQL += `-- FILE: ${file}\n`;
    combinedSQL += `-- ==========================================\n\n`;
    combinedSQL += fs.readFileSync(path.join(dir, file), 'utf8') + '\n\n';
}

fs.writeFileSync(path.join(dir, 'master_setup.sql'), combinedSQL);
console.log('Created master_setup.sql with ' + files.length + ' files.');
