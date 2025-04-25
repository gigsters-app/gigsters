// src/quotation/quotation.controller.ts

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
    UseGuards,
  } from '@nestjs/common';
  import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiBody,
    ApiProduces,
  } from '@nestjs/swagger';
  
  import { QuotationService }    from './quotation.service';
  import { Quotation }           from './quotation.entity';
import { CreateQuotationDto } from './dtos/create-quotation.dto';
import { UpdateQuotationDto } from './dtos/update-quotation.dto';
import { QuotationPdfService } from './quotation-pdf.service';
import { Response } from 'express';
import { QuotationToInvoiceDto } from './dtos/quotation-to-invoice.dto';
import { Invoice } from '../invoice/entities/invoice.entity';
import { AuthGuard } from 'src/auth/auth.guard';
import { QuotationGuard } from './guards/quotation.guard';
import { UserQuotationsGuard } from './guards/user-quotations.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@ApiTags('Quotations')
@Controller('quotations')
@UseGuards(AuthGuard)
export class QuotationController {
  constructor(
    private readonly quotationService: QuotationService,
    private readonly quotationPdfService: QuotationPdfService,
  ) {}

  @Get(':id/full')
  @UseGuards(QuotationGuard)
  @ApiOperation({ summary: 'Get full quotation with profile, client & items' })
  @ApiParam({ name: 'id', description: 'Quotation UUID' })
  @ApiResponse({ status: 200, type: Quotation })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  findFull(@Param('id') id: string): Promise<Quotation> {
    return this.quotationService.findFull(id);
  }

  @Post()
  @UseGuards(QuotationGuard)
  @ApiOperation({ summary: 'Create a new quotation' })
  @ApiBody({ type: CreateQuotationDto })
  @ApiResponse({ status: 201, description: 'Quotation created', type: Quotation })
  create(@Body() dto: CreateQuotationDto): Promise<Quotation> {
    return this.quotationService.create(dto);
  }

  @Get()
  @UseGuards(QuotationGuard)
  @ApiOperation({ summary: 'List all quotations' })
  @ApiResponse({ status: 200, description: 'All quotations', type: [Quotation] })
  findAll(): Promise<Quotation[]> {
    return this.quotationService.findAll();
  }

  @Get('my-quotations')
  @UseGuards(UserQuotationsGuard)
  @ApiOperation({ summary: 'Get all quotations for the current user based on JWT token' })
  @ApiResponse({
    status: 200,
    description: 'List of quotations for the current user.',
    type: [Quotation],
  })
  async findMyQuotations(@CurrentUser() user: any): Promise<Quotation[]> {
    return this.quotationService.findQuotationsByUser(user);
  }

  @Get(':id')
  @UseGuards(QuotationGuard)
  @ApiParam({ name: 'id', description: 'Quotation UUID' })
  @ApiOperation({ summary: 'Get one quotation by ID' })
  @ApiResponse({ status: 200, description: 'The found quotation', type: Quotation })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  findOne(@Param('id') id: string): Promise<Quotation> {
    return this.quotationService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(QuotationGuard)
  @ApiParam({ name: 'id', description: 'Quotation UUID' })
  @ApiBody({ type: UpdateQuotationDto })
  @ApiOperation({ summary: 'Update an existing quotation' })
  @ApiResponse({ status: 200, description: 'Quotation updated', type: Quotation })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateQuotationDto,
  ): Promise<Quotation> {
    return this.quotationService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(QuotationGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: 'Quotation UUID' })
  @ApiOperation({ summary: 'Delete a quotation' })
  @ApiResponse({ status: 204, description: 'Quotation deleted' })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  remove(@Param('id') id: string): Promise<void> {
    return this.quotationService.remove(id);
  }

  @Get(':id/pdf')
  @UseGuards(QuotationGuard)
  @ApiOperation({ summary: 'Download quotation as PDF' })
  @ApiParam({ name: 'id', description: 'Quotation UUID' })
  @ApiProduces('application/pdf')
  @ApiResponse({ status: 200, description: 'PDF file stream' })
  @ApiResponse({ status: 404, description: 'Quotation not found' })
  async downloadPdf(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const buf = await this.quotationPdfService.generatePdfBuffer(id);
    res
      .status(200)
      .setHeader('Content-Type', 'application/pdf')
      .setHeader('Content-Disposition', `attachment; filename="quotation-${id}.pdf"`)
      .send(buf);
  }

  @Post('convert-to-invoice')
  @UseGuards(QuotationGuard)
  @ApiOperation({ summary: 'Convert an approved quotation to an invoice' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Successfully converted quotation to invoice',
    type: Invoice,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Quotation not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Quotation is not in ACCEPTED status',
  })
  async convertToInvoice(@Body() dto: QuotationToInvoiceDto): Promise<Invoice> {
    return this.quotationService.convertToInvoice(dto);
  }
}
  