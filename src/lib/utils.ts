import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTextWithLineBreaks(text: string, maxCharsPerLine: number = 20): string {
  console.log('🔍 [formatTextWithLineBreaks] Début formatage:');
  console.log('  - Input:', text);
  console.log('  - Max chars per line:', maxCharsPerLine);
  
  if (text.length <= maxCharsPerLine) {
    console.log('  - Texte trop court, pas de formatage nécessaire');
    return text;
  }
  
  const words = text.split(' ');
  console.log('  - Mots:', words);
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const potentialLine = currentLine + (currentLine ? ' ' : '') + word;
    console.log(`    - Test mot "${word}": ligne potentielle "${potentialLine}" (${potentialLine.length} chars)`);
    
    if (potentialLine.length <= maxCharsPerLine) {
      currentLine = potentialLine;
      console.log(`      ✓ Ajouté à la ligne courante: "${currentLine}"`);
    } else {
      if (currentLine) {
        lines.push(currentLine);
        console.log(`      📝 Ligne terminée: "${currentLine}"`);
        currentLine = word;
        console.log(`      🆕 Nouvelle ligne: "${currentLine}"`);
      } else {
        // Mot trop long, on le coupe
        const truncated = word.substring(0, maxCharsPerLine);
        lines.push(truncated);
        console.log(`      ✂️ Mot trop long, coupé: "${truncated}"`);
        currentLine = word.substring(maxCharsPerLine);
        console.log(`      🆕 Reste du mot: "${currentLine}"`);
      }
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
    console.log(`  📝 Dernière ligne: "${currentLine}"`);
  }
  
  const result = lines.join('\n');
  console.log('  - Lignes finales:', lines);
  console.log('  - Résultat final:', result);
  console.log('  - Caractères de retour à la ligne:', result.split('').map(c => c === '\n' ? '\\n' : c).join(''));
  
  return result;
}
