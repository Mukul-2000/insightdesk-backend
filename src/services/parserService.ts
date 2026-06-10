import mammoth from 'mammoth';
import Papa from 'papaparse';
import { createWorker } from 'tesseract.js';
import * as pdfModule from 'pdf-parse'; // 👈 Ensure your PDF parse module is imported here

export class ParserService {
    /**
     * UNIFIED ENTRYPOINT: ROUTES FILE BUFFERS BASED ON EXTENSION / MIME-TYPE
     */
    static async extractText(fileBuffer: Buffer, originalName: string, mimeType: string): Promise<string> {
        const extension = originalName.split('.').pop()?.toLowerCase();

        switch (extension) {
            case 'pdf':
                return this.parsePdf(fileBuffer);
            
            case 'docx':
                return this.parseDocx(fileBuffer);
                
            case 'csv':
                return this.parseCsv(fileBuffer);
                
            case 'md':
            case 'txt':
                return this.parsePlainText(fileBuffer);
                
            case 'png':
            case 'jpg':
            case 'jpeg':
                return this.parseImageOCR(fileBuffer);
                
            default:
                throw new Error(`Unsupported document extension matrix format: .${extension}`);
        }
    }

    /**
     * 📄 EXTRACT MICROSOFT WORD (.docx)
     */
    private static async parseDocx(buffer: Buffer): Promise<string> {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    }

    /**
     * 📊 EXTRACT SPREADSHEETS (.csv)
     */
    private static async parseCsv(buffer: Buffer): Promise<string> {
        const csvString = buffer.toString('utf-8');
        const parsed = Papa.parse(csvString, { header: true, skipEmptyLines: true });
        
        return parsed.data.map((row: any) => {
            return Object.entries(row)
                .map(([column, value]) => `${column}: ${value}`)
                .join(', ');
        }).join('\n');
    }

    /**
     * 📝 EXTRACT MARKDOWN / PLAIN TEXT (.md, .txt)
     */
    private static async parsePlainText(buffer: Buffer): Promise<string> {
        return buffer.toString('utf-8');
    }

    /**
     * 📷 EXTRACT IMAGE OCR VIA WEBASSEMBLY TESSERACT
     */
    private static async parseImageOCR(buffer: Buffer): Promise<string> {
        const worker = await createWorker('eng');
        try {
            const { data: { text } } = await worker.recognize(buffer);
            return text;
        } finally {
            await worker.terminate();
        }
    }

    /**
     * 🛡️ YOUR EXACT CUSTOM PDF PARSING PATHWAY
     */
    private static async parsePdf(buffer: Buffer): Promise<string> {
        const moduleRef: any = pdfModule;

        if (moduleRef.PDFParse) {
            const parser = new moduleRef.PDFParse({ data: buffer });
            const parsedData = await parser.getText();
            return parsedData.text;
        } else {
            const parseFunc = typeof moduleRef === 'function' ? moduleRef : moduleRef.default;
            
            if (typeof parseFunc !== 'function') {
                console.error('--- UNRECOGNIZED PDF MODULE LAYOUT ---', moduleRef);
                throw new Error('The PDF parsing engine failed to locate a valid execution pathway.');
            }
            
            const parsedPdf = await parseFunc(buffer);
            return parsedPdf.text;
        }
    }
}