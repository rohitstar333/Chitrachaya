const fs = require('fs');
const path = require('path');

const dir = process.cwd();
const filesToInclude = [
  'supabase_schema.sql',
  'supabase_extended_schema.sql',
  'supabase_role_requests.sql',
  'supabase_task_requests.sql',
  'supabase_security_remediation.sql',
  'supabase_final_fixes.sql'
];

let finalSQL = '-- MEGA SETUP SCRIPT FOR NEW SUPABASE PROJECT\n\n';

for (const file of filesToInclude) {
    try {
        const content = fs.readFileSync(path.join(dir, file), 'utf8');
        finalSQL += `-- ==========================================\n`;
        finalSQL += `-- START OF ${file}\n`;
        finalSQL += `-- ==========================================\n\n`;
        finalSQL += content + '\n\n';
    } catch (e) {
        console.error('Missing file: ' + file);
    }
}

fs.writeFileSync(path.join(dir, 'TEMP_PROJECT_SETUP.sql'), finalSQL);
console.log('Successfully created TEMP_PROJECT_SETUP.sql');
