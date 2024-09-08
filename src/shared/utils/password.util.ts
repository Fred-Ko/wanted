import * as bcrypt from 'bcrypt';

if (!process.env.PASSWORD_SALT_ROUNDS || !process.env.PASSWORD_SECRET) {
  throw new Error('PASSWORD_SALT_ROUNDS 또는 PASSWORD_SECRET 환경 변수가 설정되지 않았습니다.');
}

export function hashPassword(password: string): string {
  const saltRounds = parseInt(process.env.PASSWORD_SALT_ROUNDS, 10);
  const salt = bcrypt.genSaltSync(saltRounds);
  const secret = process.env.PASSWORD_SECRET;
  return bcrypt.hashSync(password + secret, salt);
}

export function verifyPassword(inputPassword: string, storedPassword: string): boolean {
  const secret = process.env.PASSWORD_SECRET;
  return bcrypt.compareSync(inputPassword + secret, storedPassword);
}
