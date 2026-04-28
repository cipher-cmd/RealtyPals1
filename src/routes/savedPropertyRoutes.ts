import { Router } from 'express';
import { saveProperty, getSavedProperties, removeSavedProperty } from '../controllers/savedPropertyController';

const router = Router();

router.post('/', saveProperty);
router.get('/', getSavedProperties);
router.delete('/:propertyId', removeSavedProperty);

export default router;
