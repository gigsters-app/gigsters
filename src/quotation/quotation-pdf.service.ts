// src/quotation/quotation-pdf.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';
import { Quotation } from './quotation.entity';
import { QuotationService } from './quotation.service';

@Injectable()
export class QuotationPdfService {
  private readonly templatePath: string;

  constructor(private readonly quotationService: QuotationService) {
    // Get the base directory (src in development, dist in production)
    const baseDir = process.env.NODE_ENV === 'production' ? 'dist' : 'src';
    this.templatePath = path.join(process.cwd(), baseDir, 'quotation', 'templates', 'quotation.hbs');
  }

  private formatNumber(value: any): string {
    if (value === null || value === undefined) return '0.00';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? '0.00' : num.toFixed(2);
  }

  async generatePdf(id: string): Promise<Buffer> {
    try {
      // Fetch the full quotation
      const quotation = await this.quotationService.findFull(id);
      if (!quotation) {
        throw new NotFoundException(`Quotation ${id} not found`);
      }

      // Read the template
      const template = fs.readFileSync(this.templatePath, 'utf-8');
      const compiledTemplate = handlebars.compile(template);

      // Format dates
      const issueDate = quotation.issueDate instanceof Date 
        ? quotation.issueDate.toLocaleDateString() 
        : new Date(quotation.issueDate).toLocaleDateString();

      const expirationDate = quotation.expirationDate instanceof Date 
        ? quotation.expirationDate.toLocaleDateString() 
        : new Date(quotation.expirationDate).toLocaleDateString();

      // Prepare the data for the template
      const templateData = {
        quotationNumber: quotation.quotationNumber,
        issueDate: issueDate,
        expirationDate: expirationDate,
        status: quotation.status,
        business: quotation.businessProfile || quotation.businessSnapshot,
        client: quotation.client || quotation.clientSnapshot,
        items: quotation.items.map(item => ({
          ...item,
          unitPrice: this.formatNumber(item.unitPrice),
          total: this.formatNumber(item.total)
        })),
        subtotal: this.formatNumber(quotation.subTotal),
        tax: this.formatNumber(quotation.tax),
        taxRate: quotation.taxRate,
        discount: this.formatNumber(quotation.discount),
        total: this.formatNumber(quotation.total),
        currency: quotation.currency,
        notes: quotation.notes,
        terms: quotation.terms,
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

  async generatePdfBuffer(id: string): Promise<Buffer> {
    return this.generatePdf(id);
  }
}
