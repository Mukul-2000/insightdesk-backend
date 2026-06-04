export class TextChunker {
    /**
     * Splits a large text string into smaller chunks of words with a sliding window overlap
     * @param text The raw source text document string
     * @param maxWords Maximum words allowed per chunk block
     * @param overlapWords How many words to overlap between consecutive chunks
     */
    static splitText(text: string, maxWords: number = 150, overlapWords: number = 25): string[] {
        const words = text.split(/\s+/);
        const chunks: string[] = [];
        
        if (words.length <= maxWords) {
            return [text.trim()];
        }

        let i = 0;
        while (i < words.length) {
            // Grab a segment of words
            const chunkWords = words.slice(i, i + maxWords);
            chunks.push(chunkWords.join(' ').trim());
            
            // Move index forward by maxWords minus overlap to preserve contextual continuity
            i += (maxWords - overlapWords);
        }

        return chunks;
    }
}