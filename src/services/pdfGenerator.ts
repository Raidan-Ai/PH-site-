import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

export async function generateCertificate(traineeName: string, courseName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
    const chunks: Buffer[] = [];
    const stream = new PassThrough();

    doc.pipe(stream);
    
    // Add content
    doc.fontSize(30).text('Certificate of Completion', { align: 'center' });
    doc.moveDown();
    doc.fontSize(20).text(`This is to certify that ${traineeName}`, { align: 'center' });
    doc.moveDown();
    doc.text(`has successfully completed the course: ${courseName}`, { align: 'center' });
    
    doc.end();

    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}
