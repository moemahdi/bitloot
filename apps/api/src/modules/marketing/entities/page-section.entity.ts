import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('page_sections')
export class PageSection {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  sectionKey!: string;

  @Column()
  displayName!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ default: true })
  isEnabled!: boolean;

  @Column({ type: 'int', default: 0 })
  displayOrder!: number;

  @Column({ type: 'jsonb', nullable: true })
  config?: any;

  @Column({ nullable: true })
  scheduleStart?: Date;

  @Column({ nullable: true })
  scheduleEnd?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
