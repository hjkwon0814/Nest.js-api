import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { alchoRepository } from 'src/alcohol/repository/alcho.repository';
import { commentDto } from 'src/board/dto/comment.Dto';
import { AlchoRecipeEntity } from 'src/entities/alchoRecipe.entity';
import { CocktailEntity } from 'src/entities/cocktail.entity';
import { CocktailCommentEntity } from 'src/entities/cocktailComment.entity';
import { RatingEntity } from 'src/entities/rating.entity';
import { FavoriteRepository } from 'src/user/repository/favorite.repository';

import { AlchoCockDto } from './Dto/alchoCock.Dto';
import { CockInfoDto } from './Dto/CockInfo.Dto';
import { AlchoRecipteRepository } from './repository/AlchoRecipe.repository';
import { CocktailRepository } from './repository/Cocktail.repository';
import { CocktailCommentRepository } from './repository/CocktailComment.repository';
import { JuiceRepository } from './repository/Juice.repository';
import { JuiceRecipeRepository } from './repository/JuiceRecipe.repository';
import { RatingRepository } from './repository/Rating.repository';
import { UserRepository } from './repository/User.repository';

@Injectable()
export class CocktailService {
    private readonly logger = new Logger(CocktailService.name);
    constructor(
        private jwtService: JwtService,
        private readonly cockRepository: CocktailRepository,
        private readonly alchoRecipeRepository: AlchoRecipteRepository,
        private readonly juiceRecipeRepository: JuiceRecipeRepository,
        private readonly juiceRepository: JuiceRepository,
        private readonly alchoRepository: alchoRepository,
        private readonly ratingRepository: RatingRepository,
        private readonly cocktailCommentRepository: CocktailCommentRepository,
        private readonly userRepository: UserRepository,
        private readonly favoriteRepository: FavoriteRepository
    ) { }


    async getAll(): Promise<CocktailEntity[] | object> {
        try {
            this.logger.debug("cache test");
            const res = await this.cockRepository.find();
            return res;
        } catch (err) {
            this.logger.error(err);
            return { success: false, msg: "전체 조회 중 에러발생" }
        }
    }
    async getOne(id: number) {
        try {
            // const res = await this.cockRepository.query(
            //     "select c.id,c.name,c.imgUrl,c.dosu,c.likeOne,j.juiceId,j.amount juiceamout, a.alchoId, a.amount alchoamout "
            //    +"from juiceRecipe j,cocktail c, alchoRecipe a "
            //     +"where j.cocktailId=c.id and c.id=a.cocktailId and c.id=1;"
            // )

            const resCock = await this.cockRepository.createQueryBuilder('cocktail')
                .where("id=:id", { id: id })
                .getOne();

            const resJuice = await this.resJuice(id);

            const resAlcho = await this.resAlcho(id);

            if(resJuice.success===false||resAlcho.success===false){
                return {success :false};
            }

            this.logger.log(resAlcho)

            const res = {
                cocktail: resCock,
                cockJuice: resJuice,
                cockAlcho: resAlcho,
            }

            return res;

        } catch (err) {
            this.logger.error(err);
            return { success: false }
        }
    }

    async resJuice(id:number){
        try{
            const resJuice = await this.juiceRecipeRepository.query(
                "select j.id, j.name, j.type, r.amount, j.imgUrl "
                + "from Juice j, juiceRecipe r "
                + "where j.id=r.juiceId and r.cocktailId=" + id + ";"
            );

            return resJuice;
        }catch(err){
            this.logger.error(err);
            return {success : false};
        }
    }

    async resAlcho(id:number){
        try{
            const resAlcho = await this.alchoRecipeRepository.query(
                "select a.id, a.name, a.category, a.imgUrl, r.amount , r.only "
                + "from Alcho a, alchoRecipe r "
                + "where a.id=r.alchoId and r.cocktailId=" + id + ";"
            );

            return resAlcho;

        }catch(err){
            this.logger.error(err);
            return {success:false};
        }
    }

    async search(text: number) {
        
        try {
            if (text == 0) {
                const res = await this.getAll();
                return res;
            }
            const res = await this.cockRepository.query(
                'select * '
                + 'from alcohol.cocktail c '
                + 'inner join '
                + '(select cocktailId '
                + 'from alcohol.alchoRecipe r, alcohol.Alcho a '
                + 'where a.alchoCategoryId=' + text + ' and r.alchoId=a.id) k '
                + 'on c.id=k.cocktailId;'
            )

            return res;

        } catch (err) {
            this.logger.error(err);
            return { success: false, msg: err };
        }
    }

    async alchoCock(alchoDto: AlchoCockDto): Promise<CockInfoDto[] | object> {
        try {
            
            const res = await this.getCocktailList(alchoDto.id);

            if (res.length>0) {
                const cockArr: Array<CockInfoDto> = [];
                
                res.forEach((element) =>{
                    const cockInfoDto = new CockInfoDto();
                    cockInfoDto.id = element['cocktail'].id;
                    cockInfoDto.name = element['cocktail'].name;
                    cockInfoDto.dosu = element['cocktail'].dosu;
                    cockInfoDto.likeOne = element['cocktail'].likeOne;
                    cockInfoDto.only = element['cocktail'].only;
                    cockInfoDto.imgUrl = element['cocktail'].imgUrl;
                    cockArr.push(cockInfoDto);
                });
            
                return cockArr;
            } else {
                return { success: false, msg: "no", category: alchoDto.category };
            }

        } catch (err) {
            this.logger.error(err);
            return { success: false }
        }
    }

    async getCocktailList(id): Promise<any[]>{
        try{
            const res = await this.alchoRecipeRepository.createQueryBuilder('alchoRecipe')
                        .leftJoinAndSelect('alchoRecipe.cocktail', "cocktail.id")
                        .where("alchoId=:id", { id: id})
                        .getMany();

            return res;
        }catch(err){
            this.logger.error(err);
            return [];
        }
    }

    async likeOne(id: number): Promise<object> {
        try {
            await this.cockRepository.query(
                'update cocktail set likeOne=likeOne+1 where id =' + id
            );

            return { success: true };
        } catch (err) {
            this.logger.error(err);
            return { success: false, msg: "로그인 후 이용 가능합니다" };
        }
    }

    async getCategoryCock(category: string) {
        try {
            const res = await this.alchoRecipeRepository.createQueryBuilder('alchoRecipe')
                .leftJoinAndSelect('alchoRecipe.alcho', 'alcho.id')
                .where("category=:category", { category: category })
                .getMany();
            return res;
        } catch (err) {
            this.logger.error(err);
            return { success: false, msg: "술 종류 별 조회 중 에러 발생" };
        }
    }

    async categoryCock(category): Promise<AlchoRecipeEntity | object> {
        try {
            //서브 쿼리로 갈지 아님 디비를 두번 갈지 나중에 성능보고 결정
            const res = await this.cockRepository.query(
                "select * " +
                'from cocktail c, ' +
                '(select r.cocktailId ' +
                'from alchoRecipe r ' +
                'left join Alcho a ' +
                'on a.id= r.alchoId ' +
                "where a.category='" + category + "') a " +
                'where c.id = a.cocktailId'
            );

            console.log(res);

            const cockArr: Array<CockInfoDto> = [];
            
            res.forEach(element => {
                const cockInfoDto = new CockInfoDto();
                cockInfoDto.id = element.id;
                cockInfoDto.name = element.name;
                cockInfoDto.dosu = element.dosu;
                cockInfoDto.likeOne = element.likeOne;
                cockInfoDto.only =element.only;
                cockInfoDto.imgUrl = element.imgUrl;
                cockArr.push(cockInfoDto);
            });
           
            return cockArr;

        } catch (err) {
            this.logger.error(err);
            return { success: false };
        }
    }

    async rating(rating, header) {
        try {
            const token = this.jwtService.decode(header);

            const res = await this.checkRating(token['id'], rating.cocktailId);

            const ratingEntity = new RatingEntity();


            ratingEntity.cocktail = rating.cocktailId;
            ratingEntity.user = token['id'];
            ratingEntity.rating = rating.rating;
            ratingEntity.date = new Date();

            if (!res.success) {
                await this.ratingRepository.insert(ratingEntity);
                return { success: true };
            } else {
                return { success: false, msg: '이미 평가하신 칵테일입니다' };
            }
        } catch (err) {
            this.logger.error(err);
            return { success: false, msg: '별점 등록 중 에러 발생' };
        }
    }

    async checkRating(userId: number, cocktailId: number) {
        try {
            const res = await this.ratingRepository.createQueryBuilder('Rating')
                .where('userId=:userId', { userId: userId })
                .andWhere('cocktailId=:cocktailId', { cocktailId: cocktailId })
                .getOne();
            if (res) {
                return { success: true };
            } else {
                return { sucess: false };
            }
        } catch (err) {
            this.logger.error(err);
            return { success: false, msg: "별점 등록 확인 중 에러 발생" };
        }
    }

    async ratingDay() {
        try {
            const res = await this.ratingRepository.query(
                'SELECT cocktailId,sum(rating) cnt , imgUrl, c.name '
                + 'FROM rating, cocktail c '
                + 'WHERE date ' +
                'BETWEEN DATE_ADD(NOW(), INTERVAL -15 DAY ) AND NOW() ' +
                'and cocktailId=c.id ' +
                'group by cocktailId ' +
                'order by cnt desc limit 5'
            )
            return res;
        } catch (err) {
            this.logger.error(err);
            return { success: false, msg: "24시간 이내 별점 조회 중 에러 발생" };
        }
    }

    async ratingCount() {
        try {
            const res = await this.ratingRepository.query(
                'select cocktailId,count(*) as count '
                + 'from rating '
                + 'group by cocktailId'
            );

            return res;
        } catch (err) {
            this.logger.error(err);
            return { success: false, msg: "별점 수 조회 중 에러 발생" };
        }
    }

    /**내가 평가한 칵테일 조회 */
    async myCocktailList(header){
        try{
            const token = this.jwtService.decode(header);

            const id = token['id'];

            console.log(id)

            const res = await this.ratingRepository.createQueryBuilder('rating')
                        .leftJoinAndSelect('rating.cocktail','cocktail.id')
                        .where("userId=:id",{id:id})
                        .getMany();
            
            return res;
        }catch(err){
            this.logger.error(err);
            return {success :false, msg : "내가 평가한 칵테일 조회 중 에러 발생"};
        }
    }

    /**칵테일 추천한 개수 세기 */
    async countRecommend(header){
        try{
            const token = await this.jwtService.decode(header);

            const id = token['id'];

            const res = await this.ratingRepository.query(
                'select count(*) as count from rating where userId='+id
            );

            console.log(res[0].count);

            return res[0].count;            
        }catch(err){
            this.logger.error(err);
            return {success:false};
        }

    }
}

