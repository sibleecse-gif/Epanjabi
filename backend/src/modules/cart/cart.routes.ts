import { Router } from 'express';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from './cart.controller';
import { validate } from '../../middleware/validate.middleware';
import { addToCartSchema, updateCartItemSchema } from './cart.validation';

const router = Router();

router.get('/', getCart);
router.post('/', validate(addToCartSchema), addToCart);
router.patch('/:id', validate(updateCartItemSchema), updateCartItem);
router.delete('/:id', removeFromCart);
router.delete('/', clearCart);

export default router;