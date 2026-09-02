import { Router } from 'express';
import authRouter from './auth';
import productRouter from './product';
import imagesRouter from './images';
import settingsRouter from './settings';
import ordersRouter from './orders';

const router = Router();

router.use('/auth', authRouter);
router.use('/products', productRouter);
router.use('/products', imagesRouter); // mount under /products/:id/images
router.use('/settings', settingsRouter);
router.use('/orders', ordersRouter);

export default router;
