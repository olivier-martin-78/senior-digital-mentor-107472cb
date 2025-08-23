import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTextWithLineBreaks(text: string, maxCharsPerLine: number = 20): string {
  if (!text) return '';
  
  if (text.length <= maxCharsPerLine) {
    return text;
  }

  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const potentialLine = currentLine + (currentLine ? ' ' : '') + word;
    
    if (potentialLine.length <= maxCharsPerLine) {
      currentLine = potentialLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Word too long, truncate it
        const truncated = word.substring(0, maxCharsPerLine);
        lines.push(truncated);
        currentLine = word.substring(maxCharsPerLine);
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  const result = lines.join('\n');
  console.log('🔍 [formatTextWithLineBreaks]', text, '→', result.replace(/\n/g, '\\n'));
  
  return result;
}
