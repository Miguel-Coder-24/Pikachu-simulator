/* unificar.js - Ejecutar con: node unificar.js */
const fs = require('fs');
const path = require('path');

const outputFileName = 'proyecto_completo.txt';
const foldersToExclude = ['node_modules', '.git', 'assets']; // Carpetas a ignorar
const extensionsToInclude = ['.js', '.html', '.css', '.json']; // Archivos a leer

function traverseDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (!foldersToExclude.includes(file)) {
                traverseDir(filePath, fileList);
            }
        } else {
            if (extensionsToInclude.includes(path.extname(file))) {
                fileList.push(filePath);
            }
        }
    });
    return fileList;
}

const allFiles = traverseDir(__dirname);
let outputContent = "--- INICIO DEL PROYECTO ---\n\n";

allFiles.forEach(file => {
    // Ignorar el mismo script de unificación y el output
    if (file.includes('unificar.js') || file.includes(outputFileName)) return;

    const relativePath = path.relative(__dirname, file);
    const content = fs.readFileSync(file, 'utf8');
    
    outputContent += `\n========================================\n`;
    outputContent += `FILE: ${relativePath}\n`;
    outputContent += `========================================\n`;
    outputContent += content + "\n\n";
});

fs.writeFileSync(outputFileName, outputContent);
console.log(`✅ ¡Listo! Abre el archivo '${outputFileName}', copia todo su contenido y pégaselo a Gemini.`);