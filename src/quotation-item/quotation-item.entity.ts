import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
  } from 'typeorm';
  import { Quotation }   from '../quotation/quotation.entity';
  import { BusinessItem } from '../business-item/business-item.entity';
  
  @Entity()
  export class QuotationItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @ManyToOne(() => BusinessItem, { nullable: true })
    businessItem?: BusinessItem;
  
    @Column({ nullable: true })
    businessItemId?: string;
  
    @Column()
    description: string;
  
    @Column('int')
    quantity: number;
  
    @Column('decimal',{ precision:12, scale:2 })
    unitPrice: number;
  
    @Column('decimal',{ precision:12, scale:2 })
    total: number;
  
    @ManyToOne(() => Quotation, q => q.items, { onDelete: 'CASCADE' })
    quotation: Quotation;
  }
  