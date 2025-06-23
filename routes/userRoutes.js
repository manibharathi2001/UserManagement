const express = require('express');
const router = express.Router();

const { updateUser } = require('../controllers/userController');
router.post('/update_user', updateUser);

const userController = require('../controllers/userController');

router.post('/create_user', userController.createUser);
router.post('/get_users', userController.getUsers);
router.post('/delete_user', userController.deleteUser);
router.post('/update_user', userController.updateUser);

module.exports = router;
