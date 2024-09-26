import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity('email_tracking')
export class EmailTracking {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    email: string;

    @Column()
    status: string;

    @Column({ default: 0 })
    timesOpened: number;
}