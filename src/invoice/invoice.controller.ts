// src/invoice/invoice.controller.ts

import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    HttpCode,
    HttpStatus,
    Res,
    Header,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
  } from '@nestjs/swagger';
  
  import { InvoiceService } from './invoice.service';
  import { Invoice } from './invoice.entity';
import { CreateInvoiceDto } from './dtos/create-invoice.dto';
import { UpdateInvoiceDto } from './dtos/update-invoice.dto';
import { InvoiceJson, InvoicePdfJsonService } from './invoice-pdf-json.service';
import { Response } from 'express';
@ApiBearerAuth('access-token')
  @ApiTags('Invoices')
  @Controller('invoices')
  export class InvoiceController {
    constructor(private readonly service: InvoiceService,private readonly pdfService: InvoicePdfJsonService) {}

    @Get(':id/full')
    @ApiOperation({ summary: 'Get full invoice details' })
    @ApiParam({
      name: 'id',
      description: 'UUID of the invoice to retrieve',
      example: 'a3f1c5d2-4e6b-11ec-81d3-0242ac130003',
    })
    @ApiResponse({
      status: 200,
      description: 'Invoice with businessProfile, client & items',
      type: Invoice,
    })
    @ApiResponse({ status: 404, description: 'Invoice not found.' })
    async findFull(@Param('id') id: string): Promise<Invoice> {
      return this.service.findFull(id);
    }
  
    @Post()
    @ApiOperation({ summary: 'Create a new invoice' })
    @ApiResponse({
      status: 201,
      description: 'The invoice has been successfully created.',
      type: Invoice,
    })
    async create(@Body() dto: CreateInvoiceDto): Promise<Invoice> {
      return this.service.create(dto);
    }
  
    @Get()
    @ApiOperation({ summary: 'Retrieve all invoices' })
    @ApiResponse({
      status: 200,
      description: 'List of all invoices.',
      type: [Invoice],
    })
    async findAll(): Promise<Invoice[]> {
      return this.service.findAll();
    }
  
    @Get(':id')
    @ApiOperation({ summary: 'Get a single invoice by ID' })
    @ApiParam({
      name: 'id',
      description: 'UUID of the invoice to retrieve',
      example: 'a3f1c5d2-4e6b-11ec-81d3-0242ac130003',
    })
    @ApiResponse({
      status: 200,
      description: 'The found invoice.',
      type: Invoice,
    })
    @ApiResponse({ status: 404, description: 'Invoice not found.' })
    async findOne(@Param('id') id: string): Promise<Invoice> {
      return this.service.findOne(id);
    }
  
    @Patch(':id')
    @ApiOperation({ summary: 'Update an existing invoice' })
    @ApiParam({
      name: 'id',
      description: 'UUID of the invoice to update',
      example: 'a3f1c5d2-4e6b-11ec-81d3-0242ac130003',
    })
    @ApiResponse({
      status: 200,
      description: 'The invoice has been successfully updated.',
      type: Invoice,
    })
    @ApiResponse({ status: 404, description: 'Invoice not found.' })
    async update(
      @Param('id') id: string,
      @Body() dto: UpdateInvoiceDto,
    ): Promise<Invoice> {
      return this.service.update(id, dto);
    }
  
    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Delete an invoice' })
    @ApiParam({
      name: 'id',
      description: 'UUID of the invoice to delete',
      example: 'a3f1c5d2-4e6b-11ec-81d3-0242ac130003',
    })
    @ApiResponse({
      status: 204,
      description: 'The invoice has been successfully deleted.',
    })


    @ApiResponse({ status: 404, description: 'Invoice not found.' })
    async remove(@Param('id') id: string): Promise<void> {
      await this.service.remove(id);
    }

    @Post('generate-pdf')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Generate a PDF invoice from full JSON payload' })
    @ApiConsumes('application/json')
    @ApiBody({
      description: 'Complete invoice JSON (includes businessProfile, client & items)',
      schema: {
        type: 'object',
        example: {
          id: '73626189-6b80-4173-b2d8-1e5d478daac9',
          title: 'Web Development Services – April 2025',
          invoiceNumber: 'INV-2025-0045',
          issueDate: '2025-04-18',
          dueDate: '2025-05-02',
          status: 'PENDING',
          currency: 'USD',
          subTotal: '1320.00',
          tax: '66.00',
          taxRate: '5.00',
          discount: '50.00',
          total: '1336.00',
          notes: 'Thank you for your business!',
          terms: 'Payment due within 14 days',
          businessProfile: { /* …full profile object… */ },
          client: { /* …client object… */ },
          items: [ /* …array of items… */ ],
        },
      },
    })
    @ApiResponse({
      status: 200,
      description: 'PDF file stream',
      content: {
        'application/pdf': {
          schema: { type: 'string', format: 'binary' },
        },
      },
    })
    async generatePdf(
      @Body() invoice: InvoiceJson,
      @Res() res: Response,
    ) {
      const pdfBuffer = await this.pdfService.generatePdfBuffer(invoice);
  
      // Ensure correct headers for binary download
      res
        .status(HttpStatus.OK)
        .setHeader('Content-Type', 'application/pdf')
        .setHeader(
          'Content-Disposition',
          `attachment; filename="${invoice.invoiceNumber}.pdf"`,
        )
        .send(pdfBuffer);
    }
  }
  