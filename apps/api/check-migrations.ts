
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Defined' : 'Undefined');

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
});

AppDataSource.initialize()
  .then(async () => {
    const migrations = await AppDataSource.query('SELECT * FROM migrations ORDER BY id DESC');
    console.log('Executed migrations:', migrations.map((m: any) => m.name));
    await AppDataSource.destroy();
  })
  .catch((error) => console.log(error));
