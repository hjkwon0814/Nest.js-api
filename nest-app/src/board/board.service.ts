import { Injectable } from '@nestjs/common';
import { BoardEntity } from './entities/board.entity';
import { BoardRepository } from './repository/board.repository';

@Injectable()
export class BoardService {
    constructor(private readonly repository : BoardRepository){}

    getAll() : Promise<BoardEntity[]>{
        try{
            return this.repository.find();
        }catch(err){
            console.log("게시판 목록 조회 중 에러 발생")
        }
        
    }

    async write(writeData) : Promise<object>{
        const board = new BoardEntity();
        board.title = writeData.title;
        board.contents = writeData.contents;
        board.dateTime = new Date();
        board.isDeleted = false;
        board.isModified = false;
        board.user = writeData.userId;
        board.boardType = writeData.boardType;
        
        try{
            await this.repository.save(board);
            return {success:true};
        }catch(err){
            console.log(err);
            return {success:false, msg : "게시판 글 등록 중 에러발생"}
        }
        
    }
}
