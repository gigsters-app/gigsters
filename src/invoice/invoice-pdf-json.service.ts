// src/invoice/invoice-pdf-json.service.ts

import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';

export interface InvoiceJson {
  id: string;
  title: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: string;
  currency: string;
  subTotal: string;
  tax: string;
  taxRate: string;
  discount: string;
  total: string;
  notes?: string;
  terms?: string;
  businessProfile: {
    displayName: string;
    legalName: string;
    street: string;
    street2?: string;
    city: string;
    state?: string;
    zip?: string;
    country: string;
    vatNumber?: string;
    crn?: string;
    bankName?: string;
    iban?: string;
    swiftCode?: string;
    companyLogo?: string;      // URL or base64
    stampImage?: string;       // base64
    signatureImage?: string;   // base64
    eSignatureImage?: string;  // base64
  };
  client: {
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    country: string;
    address?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: string;
    total: string;
  }>;
}

@Injectable()
export class InvoicePdfJsonService {
  async generatePdfBuffer(data: InvoiceJson): Promise<Buffer> {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers: Buffer[] = [];
    doc.on('data', (chunk) => buffers.push(chunk));
    const finish = new Promise<Buffer>((resolve) =>
      doc.on('end', () => resolve(Buffer.concat(buffers))),
    );

    // ─── Header & BusinessProfile Info ───────────────────────────────────────
    if (data.businessProfile.companyLogo) {
      try { doc.image(data.businessProfile.companyLogo, 40, 40, { width: 80 }); }
      catch {}
    }

    // Company Name & Legal Name
    doc
      .fontSize(20)
      .text(data.businessProfile.displayName, 140, 50)
      .fontSize(10)
      .text(data.businessProfile.legalName, 140, 75);

    // Business Profile Address & Identifiers
    let y = 100;
    doc
      .font('Helvetica')
      .fontSize(10)
      .text(
        `${data.businessProfile.street}${data.businessProfile.street2 ? ' ' + data.businessProfile.street2 : ''}`,
        140,
        y,
      );
    y += 12;
    doc.text(
      `${data.businessProfile.city}, ${data.businessProfile.state ?? ''} ${data.businessProfile.zip ?? ''}`,
      140,
      y,
    );
    y += 12;
    doc.text(data.businessProfile.country, 140, y);
    y += 12;
    if (data.businessProfile.vatNumber) {
      doc.text(`VAT: ${data.businessProfile.vatNumber}`, 140, y);
      y += 12;
    }
    if (data.businessProfile.crn) {
      doc.text(`CRN: ${data.businessProfile.crn}`, 140, y);
      y += 12;
    }

    // ─── Invoice Meta ──────────────────────────────────────────────────────────
    const metaX = 400;
    doc
      .font('Helvetica-Bold')
      .text('Invoice', metaX, 50)
      .font('Helvetica')
      .text(`No: ${data.invoiceNumber}`, metaX, 70)
      .text(`Date: ${data.issueDate}`, metaX, 85)
      .text(`Due: ${data.dueDate}`, metaX, 100);

    // ─── Bill To ───────────────────────────────────────────────────────────────
    let currentY = y + 20; // continue below businessProfile block
    doc
      .font('Helvetica-Bold')
      .text('Bill To:', 40, currentY)
      .font('Helvetica')
      .text(data.client.name, 40, currentY + 15)
      .text(data.client.address || '', 40, currentY + 30)
      .text(data.client.country, 40, currentY + 45);
    if (data.client.email) {
      doc.text(`Email: ${data.client.email}`, 40, currentY + 60);
    }
    if (data.client.phone) {
      doc.text(`Phone: ${data.client.phone}`, 40, doc.y + 15);
    }

    // ─── Items Table ──────────────────────────────────────────────────────────
    const tableTop = doc.y + 30;
    const colWidths = { desc: 260, qty: 60, unit: 80, total: 80 };
    doc
      .font('Helvetica-Bold')
      .text('Description', 40, tableTop)
      .text('Qty', 40 + colWidths.desc, tableTop, { width: colWidths.qty, align: 'right' })
      .text('Unit Price', 40 + colWidths.desc + colWidths.qty, tableTop, { width: colWidths.unit, align: 'right' })
      .text('Total', 40 + colWidths.desc + colWidths.qty + colWidths.unit, tableTop, { width: colWidths.total, align: 'right' });

    let itemY = tableTop + 20;
    doc.font('Helvetica');
    for (const item of data.items) {
      doc
        .text(item.description, 40, itemY)
        .text(item.quantity.toString(), 40 + colWidths.desc, itemY, { width: colWidths.qty, align: 'right' })
        .text(`${item.unitPrice} ${data.currency}`, 40 + colWidths.desc + colWidths.qty, itemY, {
          width: colWidths.unit,
          align: 'right',
        })
        .text(`${item.total} ${data.currency}`, 40 + colWidths.desc + colWidths.qty + colWidths.unit, itemY, {
          width: colWidths.total,
          align: 'right',
        });
      itemY += 20;
      if (itemY > 700) {
        doc.addPage();
        itemY = 40;
      }
    }

    // ─── Totals ────────────────────────────────────────────────────────────────
    let totalsY = itemY + 20;
    doc
      .font('Helvetica-Bold')
      .text(`Subtotal:`, 350, totalsY, { continued: true })
      .font('Helvetica')
      .text(` ${data.subTotal} ${data.currency}`, { align: 'right' });
    totalsY += 15;
    doc
      .font('Helvetica-Bold')
      .text(`Tax (${data.taxRate}%):`, 350, totalsY, { continued: true })
      .font('Helvetica')
      .text(` ${data.tax} ${data.currency}`, { align: 'right' });
    totalsY += 15;
    doc
      .font('Helvetica-Bold')
      .text(`Discount:`, 350, totalsY, { continued: true })
      .font('Helvetica')
      .text(` ${data.discount} ${data.currency}`, { align: 'right' });
    totalsY += 15;
    doc
      .fontSize(14)
      .font('Helvetica-Bold')
      .text(`Total:`, 350, totalsY, { continued: true })
      .font('Helvetica')
      .text(` ${data.total} ${data.currency}`, { align: 'right' });

    // ─── Payment Details ───────────────────────────────────────────────────────
    if (data.businessProfile.bankName || data.businessProfile.iban || data.businessProfile.swiftCode) {
      totalsY += 30;
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text('Payment Details:', 40, totalsY);
      totalsY += 15;
      doc.font('Helvetica').fontSize(10);
      if (data.businessProfile.bankName) {
        doc.text(`Bank: ${data.businessProfile.bankName}`, 40, totalsY);
        totalsY += 12;
      }
      if (data.businessProfile.iban) {
        doc.text(`IBAN: ${data.businessProfile.iban}`, 40, totalsY);
        totalsY += 12;
      }
      if (data.businessProfile.swiftCode) {
        doc.text(`SWIFT: ${data.businessProfile.swiftCode}`, 40, totalsY);
        totalsY += 12;
      }
    }

    // ─── Notes & Terms ─────────────────────────────────────────────────────────
    if (data.notes) {
      totalsY += 20;
      doc.font('Helvetica-Bold').fontSize(12).text('Notes:', 40, totalsY);
      doc.font('Helvetica').fontSize(10).text(data.notes, 40, doc.y + 5);
    }
    if (data.terms) {
      doc.font('Helvetica-Bold').fontSize(12).text('Terms:', 40, doc.y + 20);
      doc.font('Helvetica').fontSize(10).text(data.terms, 40, doc.y + 5);
    }

    // ─── Stamp & Signatures ────────────────────────────────────────────────────
    if (data.businessProfile.stampImage) {
      try { doc.image(data.businessProfile.stampImage, 40, doc.y + 40, { width: 80 }); }
      catch {}
    }
    if (data.businessProfile.signatureImage) {
      try { doc.image(data.businessProfile.signatureImage, 150, doc.y, { width: 100 }); }
      catch {}
    }
    if (data.businessProfile.eSignatureImage) {
      try { doc.image(data.businessProfile.eSignatureImage, 260, doc.y, { width: 100 }); }
      catch {}
    }

    doc.end();
    return finish;
  }
}
