import { Request, Response } from 'express';
import { dbService } from '../services/dbService';

export const registerUser = async (req: Request, res: Response) => {
  try {
    const { firebaseId, email, name, role } = req.body;
    
    if (!firebaseId || !email || !name) {
      return res.status(400).json({ error: 'Missing required profile fields.' });
    }

    let user = await dbService.getUser(firebaseId);
    if (user) {
      return res.status(200).json({ message: 'User already registered.', user });
    }

    user = await dbService.createUser({
      firebaseId,
      email,
      name,
      role: role || 'customer',
    });

    res.status(201).json({ message: 'User profile registered successfully.', user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  try {
    const { firebaseId, email, name, role } = req.body;

    if (!firebaseId) {
      return res.status(400).json({ error: 'Firebase UID is required.' });
    }

    let user = await dbService.getUser(firebaseId);
    
    // Auto-register if logging in first time with Google/Social Auth
    if (!user) {
      const is_admin = email?.includes('admin') || firebaseId.includes('admin') || role === 'admin';
      user = await dbService.createUser({
        firebaseId,
        email: email || (is_admin ? 'admin@smartcart.com' : 'customer@smartcart.com'),
        name: name || (is_admin ? 'Smart Admin' : 'Smart Customer'),
        role: is_admin ? 'admin' : 'customer',
      });
    }

    res.status(200).json({ message: 'Logged in successfully.', user });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateBudget = async (req: Request, res: Response) => {
  try {
    const { firebaseId, budgetLimit } = req.body;
    
    if (!firebaseId) {
      return res.status(400).json({ error: 'Firebase UID is required.' });
    }

    const updatedUser = await dbService.updateUserBudget(firebaseId, budgetLimit);
    if (!updatedUser) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    res.status(200).json({ message: 'Budget limit updated.', user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await dbService.getUsers();
    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
