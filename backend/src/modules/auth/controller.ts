import { Request, Response } from 'express';
import { loginUser, getUserById, updateUserProfile } from './service';
import { sendSuccess, sendError } from '../../utils/response';

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;
    const result = await loginUser(email, password);
    sendSuccess(res, result, 'Login successful');
  } catch (error: any) {
    sendError(res, error.message || 'Login failed', error.statusCode || 500);
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    const user = await getUserById(req.user.userId);
    sendSuccess(res, user, 'User profile retrieved');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to get user', error.statusCode || 500);
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      sendError(res, 'Not authenticated', 401);
      return;
    }
    const updatedUser = await updateUserProfile(req.user.userId, req.body);
    sendSuccess(res, updatedUser, 'Profile updated successfully');
  } catch (error: any) {
    sendError(res, error.message || 'Failed to update profile', error.statusCode || 500);
  }
}
