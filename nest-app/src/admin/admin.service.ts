import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { alchoRepository } from 'src/alcohol/repository/alcho.repository';
import { AlchoRecipteRepository } from 'src/cocktail/repository/AlchoRecipe.repository';
import { CocktailRepository } from 'src/cocktail/repository/Cocktail.repository';
import { JuiceRepository } from 'src/cocktail/repository/Juice.repository';
import { JuiceRecipeRepository } from 'src/cocktail/repository/JuiceRecipe.repository';
import { AlchoEntity } from 'src/entities/alcho.entity';
import { AlchoCategoryEntity } from 'src/entities/alchoCategory.entity';
import { CocktailEntity } from 'src/entities/cocktail.entity';
import { JuiceEntity } from 'src/entities/juice.entity';
import { UnitEntity } from 'src/entities/unit.entity';
import { userStatus } from 'src/user/enumType/userStatus';
import { UserRepository } from 'src/user/repository/user.repository';
import { AlchoCategoryRepository } from './repository/alchoCategory.repository';
import { UnitRepository } from './repository/unit.repository';
import { DataSource } from 'typeorm';
import { AlchoRecipeEntity } from 'src/entities/alchoRecipe.entity';
import { JuiceRecipeEntity } from 'src/entities/juiceRecipe.entity';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);
    constructor(
        private dataSource : DataSource,
        private jwtService :JwtService,
        private readonly cockRepository : CocktailRepository,
        private readonly alchoRepository : alchoRepository,
        private readonly juiceRepository : JuiceRepository,
        private readonly alchoRecipeRepository : AlchoRecipteRepository,
        private readonly juiceRecipeRepository : JuiceRecipeRepository,
        private readonly unitRepository : UnitRepository,
        private readonly alchoCategoryRepository : AlchoCategoryRepository,
        private readonly userRepository :UserRepository,
        
    ){}

    async newCocktail(header){
        try{
            const token = this.jwtService.decode(header);

            const checkUser = await this.checkUser(token['id']);
            if(checkUser['success']){
                const alchoCategory = await this.alchoCategory();
                const unitCategory = await this.unitCategory();
                const juiceCategory = await this.juiceCategory();
    
                const res = {
                    alchoCategory,
                    unitCategory,
                    juiceCategory,
                }
    
                return res;
            }else{
                return {success:false, msg:"권한이 없습니다"};
            }
            
        }catch(err){
            this.logger.error(err);
            return {success:false, msg:"칵테일 입력 페이지 로딩 실패"};
        }
    }
   
    /*유저 권한 체크*/
    async checkUser(id:number):Promise<object>{
        
        try{
            const res = await this.userRepository.createQueryBuilder('user')
                        .where("id=:id",{id:id})
                        .getOne();
            console.log(res);
            console.log(userStatus)
            if(res['userLoginType']===userStatus['admin']){
                return {success:true};
            }else{
                return {success:false};
            }
        }catch(err){
            this.logger.error(err);
            return {success:false ,msg:err};
        }
    }
    

    async alchoCategory():Promise<AlchoEntity[]|object>{
        try{
            const res = await this.alchoRepository.find();
            return res; 
        }catch(err){
            this.logger.error(err);
            return {success: false , msg :"alchoCategory 조회 중 에러"};
        }
    }

    async unitCategory():Promise<UnitEntity[]|object>{
        try{
            const res = await this.unitRepository.find();
            return res;
        }catch(err){
            this.logger.error(err);
            return {success:false, msg : "unitCategory 조회 중 에러"};
        }
    }

    async juiceCategory():Promise<JuiceEntity[]|object>{
        try{
            const res = await this.juiceRepository.find();
            return res;
        }catch(err){
            this.logger.error(err);
            return {success:false, msg: "alcho 조회 중 에러"};
        }
    }

    async insert(insertDto, header){
        try{
            const token = this.jwtService.decode(header);

            const checkUser = await this.checkUser(token['id']);
            console.log(checkUser['success']);
            if(checkUser['success']){
                const res = await this.insertCocktail(insertDto);
                if(res.success){
                    return {success:true};
                }else{
                    return {success:false, msg:"입력 도중 에러 발생"};
                }
            }else{
                return {success:false, msg:"권한이 없습니다"};
            }
            
        }catch(err){
            this.logger.error(err);
            return {success:false, msg:"칵테일 입력 실패"};
        }
    }

    async insertCocktail(insertDto){
        const queryRunner = this.dataSource.createQueryRunner(); //queryRunner 생성
        await queryRunner.connect();  //queryRunner 연결
        await queryRunner.startTransaction(); //트랜잭션 시작

        try{
            const cocktail = new CocktailEntity();
            cocktail.name = insertDto.name;
            cocktail.imgUrl = insertDto.imgUrl;
            cocktail.dosu = insertDto.dosu;

            const res = await queryRunner.query(
                "insert into cocktail(name, dosu, imgUrl) values ('"+cocktail.name+"',"+cocktail.dosu+",'"+cocktail.imgUrl+"')"
            );

            console.log("res : ");
            console.log(res);
            
            const find = await queryRunner.query(
                "select * from cocktail where name='"+cocktail.name+"';"
            ); //같은 queryRunner로 묶어야 롤백이나 select가 됨

            // const find = await this.cockRepository.createQueryBuilder()
            // .where('name=:name',{name:cocktail.name})
            // .getOne();

            console.log(find);
            const id = find[0].id;
            

            const resAlcho = await this.insertAlchoRecipe(id, insertDto.alcho, queryRunner);
            const resJuice = await this.insertJuiceRecipe(id, insertDto.juice, queryRunner);
            
            console.log(resAlcho);
            console.log(resJuice);
            if(resAlcho.success && resJuice.success){
                console.log("트랜잭션 커밋")
                await queryRunner.commitTransaction();
                return {success:true};
            }else{
                console.log("트랜잭션 롤백")
                await queryRunner.rollbackTransaction();
                return {success:false , msg:"칵테일 삽입 중 에러 발생"};
            }

            
        }catch(err){
            console.log("트랜잭션 롤백 캐치")
            await queryRunner.rollbackTransaction();
            this.logger.error(err);
            return {success:false, msg:err};
        }finally{
            await queryRunner.release();
        }
    }

    async insertAlchoRecipe(id,insertDto,queryRunner){
        console.log("cocktail id : "+insertDto);
        console.log("id : "+id);
        
        try{
            await queryRunner.query(
                'insert into alchoRecipe(amount, only, cocktailId, unitNumId, alchoId) '
                +'values ('+insertDto[0].amount+','+insertDto[0].only+','+id+','+insertDto[0].unit+','+insertDto[0].name+')'
            );
            
            return {success:true};

        }catch(err){
          
            this.logger.error(err);
            return {success:false, msg:err};
        }
    }

    async insertJuiceRecipe(id, insertDto,queryRunner){
       
        try{
            const juiceRecipe = new JuiceRecipeEntity();

            console.log(insertDto[0]);
            console.log(insertDto[0].id);

            juiceRecipe.cocktail = id;
            juiceRecipe.amount = insertDto.amount;
            juiceRecipe.juice = insertDto.id;
            juiceRecipe.unitNum = insertDto.unit;
            
            for(let i = 0; i<insertDto.length;i++){
                await queryRunner.query(
                    'insert into juiceRecipe(amount, juiceId, cocktailId, unitNumId) '
                    +'values ('+insertDto[i].amount+','+insertDto[i].name+','+id+','+insertDto[i].unit+')'
                );
            }
            
            
            return {success:true};
        }catch(err){
           
           // this.logger.error(err);
            return {success:false,msg:err};
        }
    }


}
