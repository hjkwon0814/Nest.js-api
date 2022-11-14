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


@Module({  //데코레이터는 클래스에 함수 기능을 추가할 수 있음
  
  imports: [MoviesModule, UserModule, BoardModule, AlcoholModule,
    
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
      entities: [testEntity],
      synchronize: true,
    }),],
  controllers: [AppController, UserController, BoardController, AlcoholController], //컨트롤러는 express의 라우터 같은 존재 url을 가져오고 함수를 실행함
  providers: [UserService, BoardService, AlcoholService],
})
export class AppModule {}


TypeOrmModule.forRoot({
  type: 'mysql',
  host: process.env.RDS_HOST,
  port: 3306,
  username: process.env.RDS_USER,
  password: process.env.RDS_PSWORD,
  database: process.env.RDS_DATABASE,
  entities: [testEntity],
  synchronize: true,
})