// Script to add authentication headers to all PayrollService fetch calls
import { readFileSync, writeFileSync } from 'fs';

const filePath = '/Users/blackriis/Dev/nobi_new/apps/web/src/features/payroll/services/payroll.service.ts';
let content = readFileSync(filePath, 'utf8');

// Define the patterns and replacements
const patterns = [
  // Pattern for simple fetch calls without auth
  {
    pattern: /(\s+)const response = await fetch\(([^,]+), \{\s*method: '([^']+)',\s*headers: \{\s*'Content-Type': 'application\/json',\s*\},/g,
    replacement: '$1const authToken = await this.getAuthToken();\n$1const response = await fetch($2, {\n$1  method: \'$3\',\n$1  headers: {\n$1    \'Content-Type\': \'application/json\',\n$1    \'Authorization\': `Bearer ${authToken}`,\n$1  },'
  },
  // Pattern for fetch calls with body
  {
    pattern: /(\s+)const response = await fetch\(([^,]+), \{\s*method: '([^']+)',\s*headers: \{\s*'Content-Type': 'application\/json',\s*\},\s*body: ([^,]+),/g,
    replacement: '$1const authToken = await this.getAuthToken();\n$1const response = await fetch($2, {\n$1  method: \'$3\',\n$1  headers: {\n$1    \'Content-Type\': \'application/json\',\n$1    \'Authorization\': `Bearer ${authToken}`,\n$1  },\n$1  body: $4,'
  }
];

// Apply the patterns
patterns.forEach(({ pattern, replacement }) => {
  content = content.replace(pattern, replacement);
});

writeFileSync(filePath, content, 'utf8');
console.log('✅ Added authentication headers to all PayrollService fetch calls');