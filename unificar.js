/* unificar.js - Ejecutar con: node unificar.js */
const fs = require('fs');
const path = require('path');

const outputFileName = 'proyecto_completo.txt';

// Carpetas a ignorar (agregadas específicas de Windows)
const foldersToExclude = ['node_modules', '.git', 'assets', '.vscode', 'dist', 'build'];
const filesToExclude = ['unificar.js', outputFileName, 'package-lock.json'];

// Extensiones a incluir
const extensionsToInclude = ['.js', '.html', '.css', '.json', '.md', '.txt', '.jsx', '.ts', '.tsx'];

function traverseDir(dir, fileList = []) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        
        try {
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                // Convertir a minúsculas para comparación case-insensitive (Windows)
                const folderNameLower = file.toLowerCase();
                const excluded = foldersToExclude.some(excludedFolder => 
                    folderNameLower === excludedFolder.toLowerCase()
                );
                
                if (!excluded) {
                    traverseDir(filePath, fileList);
                }
            } else {
                const ext = path.extname(file).toLowerCase();
                const fileName = path.basename(file);
                
                // Verificar si el archivo está en la lista de exclusión
                const isExcludedFile = filesToExclude.some(excludedFile => 
                    fileName.toLowerCase() === excludedFile.toLowerCase()
                );
                
                if (!isExcludedFile && extensionsToInclude.includes(ext)) {
                    fileList.push(filePath);
                }
            }
        } catch (err) {
            console.warn(`⚠️  No se pudo acceder a: ${filePath} - ${err.message}`);
        }
    });
    
    return fileList;
}

function main() {
    console.log('📁 Escaneando proyecto...\n');
    
    const allFiles = traverseDir(__dirname);
    
    if (allFiles.length === 0) {
        console.log('❌ No se encontraron archivos para procesar.');
        return;
    }
    
    console.log(`📄 Encontrados ${allFiles.length} archivos:`);
    allFiles.forEach((file, index) => {
        const relativePath = path.relative(__dirname, file);
        console.log(`  ${index + 1}. ${relativePath}`);
    });
    
    let outputContent = "--- INICIO DEL PROYECTO ---\n\n";
    outputContent += `Fecha de generación: ${new Date().toLocaleString()}\n`;
    outputContent += `Total archivos: ${allFiles.length}\n\n`;

    allFiles.forEach(file => {
        const relativePath = path.relative(__dirname, file);
        const fileName = path.basename(file);
        
        // Verificación adicional por si acaso
        const isExcludedFile = filesToExclude.some(excludedFile => 
            fileName.toLowerCase() === excludedFile.toLowerCase()
        );
        
        if (isExcludedFile) return;

        try {
            const content = fs.readFileSync(file, 'utf8');
            
            outputContent += `\n${'='.repeat(60)}\n`;
            outputContent += `ARCHIVO: ${relativePath}\n`;
            outputContent += `${'='.repeat(60)}\n`;
            outputContent += content + "\n\n";
        } catch (err) {
            console.warn(`⚠️  Error leyendo ${relativePath}: ${err.message}`);
            outputContent += `\n${'='.repeat(60)}\n`;
            outputContent += `ARCHIVO: ${relativePath} (ERROR DE LECTURA)\n`;
            outputContent += `${'='.repeat(60)}\n`;
            outputContent += `[No se pudo leer el contenido del archivo]\n\n`;
        }
    });

    outputContent += "\n--- FIN DEL PROYECTO ---";
    
    try {
        fs.writeFileSync(outputFileName, outputContent, 'utf8');
        console.log(`\n✅ ¡Listo! Archivo '${outputFileName}' generado exitosamente.`);
        console.log(`📋 Copia todo su contenido y pégaselo a Gemini/IA.\n`);
        console.log(`📏 Tamaño del archivo: ${(outputContent.length / 1024).toFixed(2)} KB`);
        console.log(`📂 Ubicación: ${path.resolve(outputFileName)}`);
    } catch (err) {
        console.error(`❌ Error al escribir el archivo: ${err.message}`);
    }
}

// Manejar argumentos de línea de comandos
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
    console.log('\nUso: node unificar.js [opciones]');
    console.log('\nOpciones:');
    console.log('  --help, -h      Muestra esta ayuda');
    console.log('  --output=<name> Especifica nombre del archivo de salida');
    console.log('\nEjemplo:');
    console.log('  node unificar.js --output=mi_proyecto.txt');
    return;
}

// Verificar si se especificó un nombre de salida
args.forEach(arg => {
    if (arg.startsWith('--output=')) {
        outputFileName = arg.split('=')[1];
    }
});

// Ejecutar el programa
main();