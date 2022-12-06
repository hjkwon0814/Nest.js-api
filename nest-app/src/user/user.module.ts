import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmExModule } from 'src/movies/repository/typeorm-ex.module';
import { JwtStrategy } from './jwt/jwt.strategy';
import { UserRepository } from './repository/user.repository';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
    imports:[TypeOrmExModule.forCustomRepository([UserRepository]),
        // session을 사용하지 않을 예정이기 때문에 false
        PassportModule.register({ defaultStrategy: 'jwt', session: false }),
        // jwt 생성할 때 사용할 시크릿 키와 만료일자 적어주기
        JwtModule.register({
        secret: 'secret',
        signOptions: { expiresIn: '1y' },
        }),],
    controllers :[UserController],
    providers : [UserService,JwtStrategy]
})
export class UserModule {}
