const fs = require('fs');
const path = require('path');

function fixBadButtons(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixBadButtons(fullPath);
        } else if (fullPath.endsWith('.html')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const newContent = content.replace(/<button(?![^>]*\btype=)[^>]*>/gi, match => {
                return match.replace(/<button/i, '<button type="button"');
            });
            if (newContent !== content) {
                fs.writeFileSync(fullPath, newContent);
                console.log('Fixed buttons in:', fullPath);
            }
        }
    }
}

fixBadButtons('c:/laragon/www/Course_Angular_2025/Contable/appContable/src/app');
