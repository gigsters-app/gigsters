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
    UseGuards,
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
import { UpdateInvoiceNumberFormatDto } from './dtos/update-invoice-number-format.dto';
import { CreateInvoiceNumberFormatDto } from './dtos/create-invoice-number-format.dto';
import { InvoiceGuard } from './guards/invoice.guard';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { UserInvoicesGuard } from './guards/user-invoices.guard';

import { Response } from 'express';
// import { InvoicePdfService } from './invoice-pdf-json.service';
@ApiBearerAuth('access-token')
  @ApiTags('Invoices')
  @Controller('invoices')
  @UseGuards(AuthGuard)
  export class InvoiceController {
    constructor(
      private readonly service: InvoiceService,
      private readonly pdfService: InvoicePdfService,
    ) {}

    @Get(':id/full')
    @UseGuards(InvoiceGuard)
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
    @UseGuards(InvoiceGuard)
    @ApiOperation({ summary: 'Create a new invoice' })
    @ApiBody({ type: CreateInvoiceDto })
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
    @UseGuards(InvoiceGuard)
    @ApiOperation({ summary: 'Get all invoices' })
    @ApiResponse({
      status: 200,
      description: 'List of invoices.',
      type: [Invoice],
    })
    async findAll(): Promise<Invoice[]> {
      return this.service.findAll();
    }
  
    @Get('my-invoices')
    @UseGuards(UserInvoicesGuard)
    @ApiOperation({ summary: 'Get all invoices for the current user based on JWT token' })
    @ApiResponse({
      status: 200,
      description: 'List of invoices for the current user.',
      type: [Invoice],
    })
    async findMyInvoices(@CurrentUser() user: any): Promise<Invoice[]> {
      return this.service.findInvoicesByUser(user);
    }
  //
    @Get(':id')
    @UseGuards(InvoiceGuard)
    @ApiOperation({ summary: 'Get an invoice by ID' })
    @ApiParam({
      name: 'id',
      description: 'UUID of the invoice',
      example: 'b4f2a6e3-5f7c-11ec-81d3-0242ac130003',
    })
    @ApiResponse({
      status: 200,
      description: 'The invoice has been found.',
      type: Invoice,
    })
    @ApiResponse({ status: 404, description: 'Invoice not found.' })
    async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Invoice> {
      return this.service.findOne(id);
    }
  
    @Patch(':id')
    @UseGuards(InvoiceGuard)
    @ApiOperation({ summary: 'Update an existing invoice' })
    @ApiParam({
      name: 'id',
      description: 'UUID of the invoice to update',
      example: 'b4f2a6e3-5f7c-11ec-81d3-0242ac130003',
    })
    @ApiBody({ type: UpdateInvoiceDto })
    @ApiResponse({
      status: 200,
      description: 'The invoice has been successfully updated.',
      type: Invoice,
    })
    @ApiResponse({ status: 404, description: 'Invoice not found.' })
    async update(
      @Param('id', ParseUUIDPipe) id: string,
      @Body() dto: UpdateInvoiceDto,
    ): Promise<Invoice> {
      return this.service.update(id, dto);
    }
  
    @Delete(':id')
    @UseGuards(InvoiceGuard)
    @ApiOperation({ summary: 'Delete an invoice' })
    @ApiParam({
      name: 'id',
      description: 'UUID of the invoice to delete',
      example: 'b4f2a6e3-5f7c-11ec-81d3-0242ac130003',
    })
    @ApiResponse({
      status: 200,
      description: 'The invoice has been successfully deleted.',
    })
    @ApiResponse({ status: 404, description: 'Invoice not found.' })
    @HttpCode(HttpStatus.OK)
    async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
      await this.service.remove(id);
    }

    @Get(':id/pdf')
    @ApiOperation({ summary: 'Generate PDF for an invoice' })
    @ApiParam({
      name: 'id',
      description: 'UUID of the invoice',
      example: 'b4f2a6e3-5f7c-11ec-81d3-0242ac130003',
    })
    @ApiProduces('application/pdf')
    @ApiOkResponse({
      description: 'PDF file of the invoice',
      content: {
        'application/pdf': {
          schema: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    })
    @ApiNotFoundResponse({ description: 'Invoice not found.' })
    @Header('Content-Type', 'application/pdf')
    @Header('Content-Disposition', 'attachment; filename=invoice.pdf')
    async generatePdf(
      @Param('id', ParseUUIDPipe) id: string,
      @Res() res: Response,
    ): Promise<void> {
      const invoice = await this.service.findOne(id);
      const pdf = await this.pdfService.generatePdf(invoice);
      res.send(pdf);
    }

    @Get('number-format/:businessProfileId')
    @ApiOperation({ summary: 'Get invoice number format for a business profile' })
    @ApiParam({ name: 'businessProfileId', type: 'string', format: 'uuid' })
    @ApiOkResponse({ description: 'Returns the invoice number format' })
    async getInvoiceNumberFormat(
      @Param('businessProfileId', ParseUUIDPipe) businessProfileId: string,
    ) {
      return this.service.getInvoiceNumberFormat(businessProfileId);
    }

    @Patch('number-format/:businessProfileId')
    @ApiOperation({ summary: 'Update invoice number format for a business profile' })
    @ApiParam({ name: 'businessProfileId', type: 'string', format: 'uuid' })
    @ApiBody({ type: UpdateInvoiceNumberFormatDto })
    @ApiOkResponse({ description: 'Returns the updated invoice number format' })
    async updateInvoiceNumberFormat(
      @Param('businessProfileId', ParseUUIDPipe) businessProfileId: string,
      @Body() dto: UpdateInvoiceNumberFormatDto,
    ) {
      return this.service.updateInvoiceNumberFormat(businessProfileId, dto);
    }

    @Post('number-format/:businessProfileId')
    @ApiOperation({ 
      summary: 'Create initial invoice number format for a business profile', 
      description: 'Creates a new invoice number format configuration for a business profile. Supports fiscal year configuration for custom invoice numbers based on your fiscal year calendar.' 
    })
    @ApiParam({ name: 'businessProfileId', type: 'string', format: 'uuid' })
    @ApiBody({ type: CreateInvoiceNumberFormatDto })
    @ApiOkResponse({ description: 'Returns the created invoice number format' })
    async createInvoiceNumberFormat(
      @Param('businessProfileId', ParseUUIDPipe) businessProfileId: string,
      @Body() dto: CreateInvoiceNumberFormatDto,
    ) {
      return this.service.createInvoiceNumberFormat(businessProfileId, dto);
    }
  }
  