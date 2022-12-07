import { Module } from '@nestjs/common';
import { MoviesModule } from './movies/movies.module';
import { AppController } from './app.controller';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { UserModule } from './user/user.module';
import { BoardController } from './board/board.controller';
import { BoardService } from './board/board.service';
import { BoardModule } from './board/board.module';
import { AlcoholController } from './alcohol/alcohol.controller';
import { AlcoholService } from './alcohol/alcohol.service';
import { AlcoholModule } from './alcohol/alcohol.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { testEntity } from './movies/entities/test.entity';
import { ConfigModule } from '@nestjs/config';
import { env } from 'process';
import { UserEntity } from './user/entities/user.entity';
import { BoardEntity } from './board/entities/board.entity';
import { CommentEntity } from './board/entities/comment.entity';
import { ScheduleModule } from '@nestjs/schedule';
import { WeatherService } from './weather/weather.service';
import { WeatherController } from './weather/weather.controller';
import { WeatherModule } from './weather/weather.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './user/jwt/jwt.strategy';
import { RecommandController } from './recommand/recommand.controller';
import { RecommandService } from './recommand/recommand.service';
import { RecommandModule } from './recommand/recommand.module';
import { dataEntity } from './recommand/entities/data.entity';

@Module({  //데코레이터는 클래스에 함수 기능을 추가할 수 있음
  
  imports: [MoviesModule, UserModule, BoardModule, AlcoholModule,WeatherModule, RecommandModule,

    JwtModule.register({
      secret : process.env.secretOrKey,
      signOptions : {expiresIn: '60s'},
    }),

    ConfigModule.forRoot({
      isGlobal:true
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.RDS_HOST,
      port: 3306,
      username: process.env.RDS_USER,
      password: process.env.RDS_PSWORD,
      database: process.env.RDS_DATABASE,
      entities: [testEntity,UserEntity, BoardEntity,CommentEntity, dataEntity],
      synchronize: true,
      logging : true,
    }),
    RecommandModule,
    ], 
  controllers: [AppController,AlcoholController ], //컨트롤러는 express의 라우터 같은 존재 url을 가져오고 함수를 실행함
  providers: [JwtStrategy],
}) 
export class AppModule {}   

