import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('music_items')
export class MusicItemEntity {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  type!: 'TRACK' | 'ALBUM' | 'PLAYLIST';

  @Column()
  title!: string;

  @Column({ type: 'text', nullable: true })
  artist!: string | null;

}