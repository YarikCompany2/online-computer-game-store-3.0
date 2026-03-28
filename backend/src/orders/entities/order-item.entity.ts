import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Order } from "./order.entity";
import { Game } from "../../games/entities/game.entity";

@Entity('order_games')
export class OrderItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'order_id', type: 'uuid' })
    orderId: string;

    @Column({ name: 'game_id', type: 'uuid' })
    gameId: string;

    @Column({ name: 'price_at_purchase', type: 'decimal', precision: 10, scale: 2 })
    priceAtPurchase: number;

    @ManyToOne(() => Order, (order) => order.items)
    @JoinColumn({ name: 'order_id' })
    order: Order;

    @ManyToOne(() => Game)
    @JoinColumn({ name: 'game_id' })
    game: Game;
}