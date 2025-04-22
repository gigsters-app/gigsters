// src/quotation/quotation-pdf.service.ts

import { Injectable, NotFoundException } from '@nestjs/common';
import * as PDFDocument                   from 'pdfkit';
import { QuotationService }              from './quotation.service';

@Injectable()
export class QuotationPdfService {
  constructor(private readonly quotationService: QuotationService) {}

  async generatePdfBuffer(id: string): Promise<Buffer> {
    const q = await this.quotationService.findFull(id);
    if (!q) throw new NotFoundException(`Quotation ${id} not found`);
    if (!q.client) throw new NotFoundException(`Quotation ${id} has no client`);
    const client = q.client;

    // Handle date strings
    const issueDateStr = typeof q.issueDate === 'string'
      ? q.issueDate
      : q.issueDate.toISOString().split('T')[0];
    const expDateStr = typeof q.expirationDate === 'string'
      ? q.expirationDate
      : q.expirationDate.toISOString().split('T')[0];

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const bufs: Buffer[] = [];
    doc.on('data', chunk => bufs.push(Buffer.from(chunk)));
    const done = new Promise<Buffer>(res => doc.on('end', () => res(Buffer.concat(bufs))));

    const W = doc.page.width;
    const M = 50;
    const usable = W - M * 2;

    // Header
    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .text(q.businessProfile.displayName, M, M)
      .font('Helvetica')
      .fontSize(10)
      .text(q.businessProfile.legalName, M, doc.y + 2)
      .font('Helvetica-Bold')
      .fontSize(26)
      .text('QUOTATION', M, M, { align: 'right' });

    const boxW = 160, boxX = W - M - boxW;
    doc
      .rect(boxX, M + 5, boxW, 60).stroke()
      .font('Helvetica').fontSize(10)
      .text(`No: ${q.quotationNumber}`,    boxX + 5, M + 10, { width: boxW - 10, align: 'right' })
      .text(`Date: ${issueDateStr}`,       boxX + 5, M + 25, { width: boxW - 10, align: 'right' })
      .text(`Expires: ${expDateStr}`,      boxX + 5, M + 40, { width: boxW - 10, align: 'right' });

    // BusinessProfile address
    let y = M + 80;
    doc.font('Helvetica').fontSize(10)
      .text(`${q.businessProfile.street}${q.businessProfile.street2 ? ', ' + q.businessProfile.street2 : ''}`, M, y);
    y += 12;
    doc.text(`${q.businessProfile.city}, ${q.businessProfile.country}`, M, y);
    y += 20;

    // Bill To
    doc.font('Helvetica-Bold').fontSize(12).text('Bill To:', M, y);
    y += 15;
    doc.font('Helvetica').fontSize(10).text(client.name, M, y);
    y += 12;
    if (client.address) { doc.text(client.address, M, y); y += 12; }
    doc.text(client.country, M, y); y += 12;
    if (client.email) { doc.text(`Email: ${client.email}`, M, y); y += 12; }
    if (client.phone) { doc.text(`Phone: ${client.phone}`, M, y); y += 12; }

    // Items table header
    y += 20;
    const c1 = M;
    const c2 = M + usable * 0.5;
    const c3 = M + usable * 0.75;
    const c4 = M + usable * 0.9;

    doc.font('Helvetica-Bold').fontSize(10)
      .text('Description', c1, y)
      .text('Qty',         c2, y, { width: usable * 0.25, align: 'right' })
      .text('Unit',        c3, y, { width: usable * 0.15, align: 'right' })
      .text('Total',       c4, y, { width: usable * 0.1,  align: 'right' });

    y += 20;
    doc.font('Helvetica').fontSize(10);
    for (const item of q.items) {
      // Coerce decimals
      const qty = item.quantity;
      const unit = Number(item.unitPrice);
      const totalLine = Number(item.total);
      doc
        .text(item.description,        c1, y)
        .text(qty.toString(),          c2, y, { width: usable * 0.25, align: 'right' })
        .text(`${unit.toFixed(2)} ${q.currency}`, c3, y, { width: usable * 0.15, align: 'right' })
        .text(`${totalLine.toFixed(2)} ${q.currency}`, c4, y, { width: usable * 0.1, align: 'right' });
      y += 20;
      if (y > doc.page.height - M - 100) { doc.addPage(); y = M; }
    }

    // Totals (coerce again)
    const sub = Number(q.subTotal);
    const taxAmt = Number(q.tax);
    const disc = Number(q.discount);
    const grand = Number(q.total);

    y += 10;
    doc.font('Helvetica-Bold')
      .text('Subtotal:', c3, y, { continued: true })
      .font('Helvetica')
      .text(` ${sub.toFixed(2)} ${q.currency}`, { align: 'right' });
    y += 15;
    doc.font('Helvetica-Bold')
      .text(`Tax (${q.taxRate}%):`, c3, y, { continued: true })
      .font('Helvetica')
      .text(` ${taxAmt.toFixed(2)} ${q.currency}`, { align: 'right' });
    y += 15;
    doc.font('Helvetica-Bold')
      .text('Discount:', c3, y, { continued: true })
      .font('Helvetica')
      .text(` ${disc.toFixed(2)} ${q.currency}`, { align: 'right' });
    y += 15;
    doc.fontSize(12).font('Helvetica-Bold')
      .text('Total:', c3, y, { continued: true })
      .font('Helvetica')
      .text(` ${grand.toFixed(2)} ${q.currency}`, { align: 'right' });

    // Notes & terms
    y += 30;
    if (q.notes) {
      doc.font('Helvetica-Bold').fontSize(10).text('Notes:', M, y);
      doc.font('Helvetica').fontSize(9).text(q.notes, M, y + 12, { width: usable });
      y = doc.y + 20;
    }
    if (q.terms) {
      doc.font('Helvetica-Bold').fontSize(10).text('Terms:', M, y);
      doc.font('Helvetica').fontSize(9).text(q.terms, M, y + 12, { width: usable });
    }

    doc.end();
    return done;
  }
}
