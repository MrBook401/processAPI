import express from 'express';
import cors from 'cors';
import { routes } from './routes';
import { setupSwagger } from './swagger';

export const app = express();

setupSwagger(app);

app.use(cors());
app.use(express.json());

app.use('/', routes);
