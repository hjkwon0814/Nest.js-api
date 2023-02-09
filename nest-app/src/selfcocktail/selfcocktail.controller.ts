import { Controller, Get, Logger, Post , Headers, Body, UseGuards} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { InsertCocktailDto } from 'src/admin/dto/insertCocktail.Dto';
import { JwtAuthGuard } from 'src/user/jwt/jwt.guard';
import { getToken } from 'src/util/token';
import { SelfcocktailService } from './selfcocktail.service';

@Controller('selfcocktail')
export class SelfcocktailController {
    constructor(private readonly selfcocktailService : SelfcocktailService){}
    private readonly logger = new Logger(SelfcocktailController.name);

    @ApiOperation({summary:'자작 레시피 공개'})
    @Get('/')
    async findAll(){
        this.logger.log("---------------select all self cocktail ");
        return await this.selfcocktailService.findAll();
    }

    @ApiOperation({summary : "새로운 칵테일 레시피 입력"})
    @Post('/insert')
    async insert(@Body() insertDto:InsertCocktailDto, @Headers() header){
        return await this.selfcocktailService.insert(insertDto,getToken(header));
    }

    @ApiOperation({summary : "카테고리 리스트 조회"})
    @UseGuards(JwtAuthGuard)
    @Get('/category')
    async getCategory(){
        return await this.selfcocktailService.getCategory();
    }
}
