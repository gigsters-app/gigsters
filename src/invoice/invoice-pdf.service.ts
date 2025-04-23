import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import { Invoice } from './entities/invoice.entity';
import * as puppeteer from 'puppeteer';

@Injectable()
export class InvoicePdfService {
  private readonly templatePath: string;

  constructor() {
    // Get the base directory (src in development, dist in production)
    const baseDir = process.env.NODE_ENV === 'production' ? 'dist' : 'src';
    this.templatePath = path.join(process.cwd(), baseDir, 'invoice', 'templates', 'invoice.hbs');
  }

  private formatNumber(value: any): string {
    if (value === null || value === undefined) return '0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  }

  async generatePdf(invoice: Invoice): Promise<Buffer> {
    try {
      // Read the template
      const template = fs.readFileSync(this.templatePath, 'utf-8');
      const compiledTemplate = handlebars.compile(template);

      // Prepare the data for the template
      const templateData = {
        invoiceNumber: invoice.invoiceNumber,
        issueDate: new Date(invoice.issueDate).toLocaleDateString(),
        dueDate: new Date(invoice.dueDate).toLocaleDateString(),
        business: invoice.businessSnapshot,
        client: invoice.clientSnapshot,
        items: invoice.items.map(item => ({
          ...item,
          unitPrice: this.formatNumber(item.unitPrice),
          total: this.formatNumber(item.total)
        })),
        subtotal: this.formatNumber(invoice.subTotal),
        tax: this.formatNumber(invoice.tax),
        discount: this.formatNumber(invoice.discount),
        total: this.formatNumber(invoice.total),
        currency: invoice.currency,
        notes: invoice.notes,
        terms: invoice.terms,
      };

      // Generate HTML from template
      const html = compiledTemplate(templateData);

      // Launch Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      try {
        // Create a new page
        const page = await browser.newPage();

        // Set content to the generated HTML
        await page.setContent(html, {
          waitUntil: 'networkidle0'
        });

        // Generate PDF
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: {
            top: '20px',
            right: '20px',
            bottom: '20px',
            left: '20px'
          }
        });

        return Buffer.from(pdfBuffer);
      } finally {
        // Always close the browser
        await browser.close();
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
} 