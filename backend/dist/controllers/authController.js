"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUsers = exports.updateBudget = exports.loginUser = exports.registerUser = void 0;
const dbService_1 = require("../services/dbService");
const registerUser = async (req, res) => {
    try {
        const { firebaseId, email, name, role } = req.body;
        if (!firebaseId || !email || !name) {
            return res.status(400).json({ error: 'Missing required profile fields.' });
        }
        let user = await dbService_1.dbService.getUser(firebaseId);
        if (user) {
            return res.status(200).json({ message: 'User already registered.', user });
        }
        user = await dbService_1.dbService.createUser({
            firebaseId,
            email,
            name,
            role: role || 'customer',
        });
        res.status(201).json({ message: 'User profile registered successfully.', user });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.registerUser = registerUser;
const loginUser = async (req, res) => {
    try {
        const { firebaseId, email, name, role } = req.body;
        if (!firebaseId) {
            return res.status(400).json({ error: 'Firebase UID is required.' });
        }
        let user = await dbService_1.dbService.getUser(firebaseId);
        // Auto-register if logging in first time with Google/Social Auth
        if (!user) {
            const is_admin = email?.includes('admin') || firebaseId.includes('admin') || role === 'admin';
            user = await dbService_1.dbService.createUser({
                firebaseId,
                email: email || (is_admin ? 'admin@smartcart.com' : 'customer@smartcart.com'),
                name: name || (is_admin ? 'Smart Admin' : 'Smart Customer'),
                role: is_admin ? 'admin' : 'customer',
            });
        }
        res.status(200).json({ message: 'Logged in successfully.', user });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.loginUser = loginUser;
const updateBudget = async (req, res) => {
    try {
        const { firebaseId, budgetLimit } = req.body;
        if (!firebaseId) {
            return res.status(400).json({ error: 'Firebase UID is required.' });
        }
        const updatedUser = await dbService_1.dbService.updateUserBudget(firebaseId, budgetLimit);
        if (!updatedUser) {
            return res.status(404).json({ error: 'User profile not found.' });
        }
        res.status(200).json({ message: 'Budget limit updated.', user: updatedUser });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.updateBudget = updateBudget;
const getUsers = async (req, res) => {
    try {
        const users = await dbService_1.dbService.getUsers();
        res.status(200).json(users);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.getUsers = getUsers;
