import { HttpException, Injectable } from '@nestjs/common';
import { UsersService } from 'src/modules/users/services/users.service';
import { AuthFormDto } from '../dto/auth.dto';
import { RegisterFormDto } from '../dto/register.dto';
import { compare, hash } from 'bcrypt';
import { createToken } from '../utils/token.utils';
import { TokenService } from './token.service';
import {
  UserWithSimpleTokenSerializer,
  UserWithTokenSerializer,
  getUserWithTokenSerializer,
} from '../entities/user.serializer';
import { UserWithRoles } from 'src/modules/users/entities/user.entity';
import { getUserSerializer } from 'src/modules/users/entities/user.serializer';
import { RolesService } from 'src/modules/roles/services/roles.service';
import { ROLE_USER } from 'src/modules/roles/dto/role.dto';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../constants';

@Injectable()
export class AuthService {
  constructor(
    private _usersService: UsersService,
    private tokenService: TokenService,
    private rolesService: RolesService,
    private _jwtService : JwtService
  ) {}

  async signUp(authFormDto : AuthFormDto) : Promise<UserWithTokenSerializer> {
    const user = await this._usersService.findByEmail(authFormDto.email);
    if (!user) {
      throw new HttpException(
        `User with email ${authFormDto.email} not found`,
        409,
      );
    }

    const isPasswordMatching: boolean = await compare(
      authFormDto.password,
      user.password,
    );
    if (!isPasswordMatching)
      throw new HttpException('Password is not match', 409);

    const accessToken = await this._jwtService.signAsync({sub : user.id, email : user.email})
    const refreshToken = await this._jwtService.signAsync({sub : user.id, email : user.email})
    const userToken = await this.tokenService.findByUser(user);
    if (userToken === null) {
      await this.tokenService.create(user, refreshToken);
    } else {
      await this.tokenService.update(user, refreshToken);
    }
    return {
      ... getUserSerializer(user), 
      token : {
        accessToken : accessToken,
        refreshToken : refreshToken,
        expireIn :  30 * 24 * 60 * 60
      }
    }
  }

  async refreshToken() {
    
  }

  async register(
    registerFormDto: RegisterFormDto,
    roleName: string = ROLE_USER,
  ) {
    const user = await this._usersService.findByEmail(registerFormDto.email);
    if (user) {
      throw new HttpException(
        `This email ${registerFormDto.email} already used`,
        409,
      );
    }

    const role = await this.rolesService.findAndCreate({ name: roleName });

    const newUser = await this._usersService.createWithRole(
      registerFormDto,
      role,
    );

    return getUserSerializer(newUser);
  }
}
