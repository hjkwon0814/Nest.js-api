import { UserEntity } from 'src/user/entities/user.entity';
import { Column, Entity,OneToMany, ManyToMany, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';
import { CommentEntity } from './comment.entity';
enum STATUS{
    ALCOHOL = "A",
    FREE ="F",
    RECEIPE="R"
}
@Entity('board')
export class BoardEntity {

    @PrimaryGeneratedColumn('increment')
    id : bigint;

    @Column({length : 50})
    title : string;

    @Column({length : 10000})
    contents : string;

    @Column()
    dateTime : Date;
    
    @Column({type :'enum', enum:STATUS})
    boardType :STATUS; 

    @Column()
    isDeleted : Boolean;

    @Column()
    isModified : Boolean;

    @Column()
    recommend : number;

    @ManyToOne((type) => UserEntity,(userEntity)=>userEntity.boardEntitys)
    user : UserEntity;

    @OneToMany((type)=>CommentEntity, (commentEntity)=>commentEntity.board)
    commentEntitys : CommentEntity[];
}