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
    ParseUUIDPipe,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBearerAuth,
    ApiConsumes,
    ApiBody,
    ApiOkResponse,
    ApiNotFoundResponse,
    ApiProduces,
  } from '@nestjs/swagger';
  
  import { InvoiceService } from './invoice.service';
  import { Invoice } from './entities/invoice.entity';
import { CreateInvoiceDto } from './dtos/create-invoice.dto';
import { UpdateInvoiceDto } from './dtos/update-invoice.dto';
import { InvoicePdfService } from './invoice-pdf.service';

import { Response } from 'express';
// import { InvoicePdfService } from './invoice-pdf-json.service';
@ApiBearerAuth('access-token')
  @ApiTags('Invoices')
  @Controller('invoices')
  export class InvoiceController {
    constructor(
      private readonly service: InvoiceService,
      private readonly pdfService: InvoicePdfService,
    ) {}

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
  //
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
  //
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
  //
    @Get(':id')
    @ApiOperation({
      summary: 'Retrieve a single invoice by ID',
      description: 'Returns the invoice including its business-profile snapshot, client-snapshot, and line items',
    })
    @ApiParam({
      name: 'id',
      description: 'UUID of the invoice to retrieve',
      type: String,
      example: '95e11336-60cc-428d-a816-2c14b8e424a7',
    })
    @ApiOkResponse({
      description: 'The invoice record',
      type: Invoice,
    })
    @ApiNotFoundResponse({
      description: 'Invoice not found',
    })
    //
    async findOne(
      @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    ): Promise<Invoice> {
      return this.service.findOne(id);
    }
  
    // @Patch(':id')
    // @ApiOperation({ summary: 'Update an existing invoice' })
    // @ApiParam({
    //   name: 'id',
    //   description: 'UUID of the invoice to update',
    //   example: 'a3f1c5d2-4e6b-11ec-81d3-0242ac130003',
    // })
    // @ApiResponse({
    //   status: 200,
    //   description: 'The invoice has been successfully updated.',
    //   type: Invoice,
    // })
    // @ApiResponse({ status: 404, description: 'Invoice not found.' })
    // async update(
    //   @Param('id') id: string,
    //   @Body() dto: UpdateInvoiceDto,
    // ): Promise<Invoice> {
    //   return this.service.update(id, dto);
    // }
  
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

    @Get(':id/pdf')
    @ApiOperation({ summary: 'Generate PDF version of an invoice' })
    @ApiParam({
      name: 'id',
      description: 'UUID of the invoice to generate PDF for',
      type: String,
    })
    @ApiProduces('application/pdf')
    @Header('Content-Type', 'application/pdf')
    @Header('Content-Disposition', 'attachment; filename=invoice.pdf')
    async generatePdf(
      @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
      @Res() res: Response,
    ): Promise<void> {
      const invoice = await this.service.findOne(id);
      const pdfBuffer = await this.pdfService.generatePdf(invoice);
      res.send(pdfBuffer);
    }
  }
  