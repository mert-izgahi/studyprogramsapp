import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongoose';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';
import { AuthError } from 'next-auth';

export interface CreateUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: 'user' | 'staff' | 'admin';
    imageUrl?: string;
}

export interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    email?: string;
    imageUrl?: string;
    role?: 'user' | 'staff' | 'admin';
    isActive?: boolean;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
}

export class AuthService {
    /**
     * Get the current authenticated user's session
     */
    static async getSession() {
        try {
            const session = await auth();
            return session;
        } catch (error) {
            console.error('Error getting session:', error);
            return null;
        }
    }

    /**
     * Get the current authenticated user
     */
    static async getCurrentUser() {
        try {
            const session = await auth();

            if (!session?.user?.id) {
                return null;
            }

            await dbConnect();

            const user = await User.findById(session.user.id).select('-password');
            return user;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    /**
     * Get user by ID
     */
    static async getUserById(userId: string) {
        try {
            await dbConnect();

            const user = await User.findById(userId).select('-password');
            return user;
        } catch (error) {
            console.error('Error getting user by ID:', error);
            return null;
        }
    }

    /**
     * Get user by email
     */
    static async getUserByEmail(email: string) {
        try {
            await dbConnect();

            const user = await User.findOne({ email: email.toLowerCase() }).select('-password');
            return user;
        } catch (error) {
            console.error('Error getting user by email:', error);
            return null;
        }
    }

    /**
     * Check if user is authenticated
     */
    static async isAuthenticated(): Promise<boolean> {
        try {
            const session = await auth();
            return !!session?.user;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if user has a specific role
     */
    static async hasRole(role: 'user' | 'staff' | 'admin'): Promise<boolean> {
        try {
            const session = await auth();
            return session?.user?.role === role;
        } catch (error) {
            return false;
        }
    }

    /**
     * Check if user is admin
     */
    static async isAdmin(): Promise<boolean> {
        return this.hasRole('admin');
    }

    /**
     * Check if user is staff or admin
     */
    static async isStaffOrAdmin(): Promise<boolean> {
        try {
            const session = await auth();
            return session?.user?.role === 'staff' || session?.user?.role === 'admin';
        } catch (error) {
            return false;
        }
    }

    /**
     * Create a new user (registration)
     */
    static async createUser(data: CreateUserData) {
        try {
            await dbConnect();

            // Check if user already exists
            const existingUser = await User.findOne({ email: data.email.toLowerCase() });
            if (existingUser) {
                throw new Error('User with this email already exists');
            }

            // Validate password strength
            if (data.password.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(data.password, 10);

            // Create user
            const user = await User.create({
                email: data.email.toLowerCase(),
                password: hashedPassword,
                firstName: data.firstName,
                lastName: data.lastName,
                role: data.role || 'user',
                imageUrl: data.imageUrl,
                isActive: true,
            });

            // Return user without password
            const userObject = user.toObject() as any;
            userObject!.password = undefined;

            return userObject;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    /**
     * Update user profile
     */
    static async updateUser(userId: string, data: UpdateUserData) {
        try {
            await dbConnect();

            // Check if email is being changed and if it's already taken
            if (data.email) {
                const existingUser = await User.findOne({
                    email: data.email.toLowerCase(),
                    _id: { $ne: userId },
                });
                if (existingUser) {
                    throw new Error('Email is already taken');
                }
            }

            const updateData: any = {};
            if (data.firstName) updateData.firstName = data.firstName;
            if (data.lastName) updateData.lastName = data.lastName;
            if (data.email) updateData.email = data.email.toLowerCase();
            if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
            if (data.role) updateData.role = data.role;
            if (data.isActive !== undefined) updateData.isActive = data.isActive;

            const user = await User.findByIdAndUpdate(
                userId,
                { $set: updateData },
                { new: true }
            ).select('-password');

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            console.error('Error updating user:', error);
            throw error;
        }
    }

    /**
     * Update current user's profile
     */
    static async updateCurrentUser(data: UpdateUserData) {
        try {
            const session = await auth();

            if (!session?.user?.id) {
                throw new Error('Not authenticated');
            }

            // Users can't change their own role
            if (data.role) {
                delete data.role;
            }

            return this.updateUser(session.user.id, data);
        } catch (error) {
            console.error('Error updating current user:', error);
            throw error;
        }
    }

    /**
     * Change user password
     */
    static async changePassword(userId: string, data: ChangePasswordData) {
        try {
            await dbConnect();

            // Get user with password
            const user = await User.findById(userId).select('+password');

            if (!user) {
                throw new Error('User not found');
            }

            // Verify current password
            const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);

            if (!isPasswordValid) {
                throw new Error('Current password is incorrect');
            }

            // Validate new password
            if (data.newPassword.length < 8) {
                throw new Error('New password must be at least 8 characters long');
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(data.newPassword, 10);

            // Update password
            user.password = hashedPassword;
            await user.save();

            return { success: true };
        } catch (error) {
            console.error('Error changing password:', error);
            throw error;
        }
    }

    /**
     * Change current user's password
     */
    static async changeCurrentUserPassword(data: ChangePasswordData) {
        try {
            const session = await auth();

            if (!session?.user?.id) {
                throw new Error('Not authenticated');
            }

            return this.changePassword(session.user.id, data);
        } catch (error) {
            console.error('Error changing current user password:', error);
            throw error;
        }
    }

    /**
     * Reset password (admin only)
     */
    static async resetUserPassword(userId: string, newPassword: string) {
        try {
            const session = await auth();

            // Check if current user is admin
            if (session?.user?.role !== 'admin') {
                throw new Error('Unauthorized - Admin access required');
            }

            await dbConnect();

            // Validate new password
            if (newPassword.length < 8) {
                throw new Error('New password must be at least 8 characters long');
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);

            // Update password
            const user = await User.findByIdAndUpdate(
                userId,
                { $set: { password: hashedPassword } },
                { new: true }
            ).select('-password');

            if (!user) {
                throw new Error('User not found');
            }

            return { success: true };
        } catch (error) {
            console.error('Error resetting user password:', error);
            throw error;
        }
    }

    /**
     * Deactivate user account
     */
    static async deactivateUser(userId: string) {
        try {
            const session = await auth();

            // Check if current user is admin or the user themselves
            if (session?.user?.role !== 'admin' && session?.user?.id !== userId) {
                throw new Error('Unauthorized');
            }

            await dbConnect();

            const user = await User.findByIdAndUpdate(
                userId,
                { $set: { isActive: false } },
                { new: true }
            ).select('-password');

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            console.error('Error deactivating user:', error);
            throw error;
        }
    }

    /**
     * Activate user account (admin only)
     */
    static async activateUser(userId: string) {
        try {
            const session = await auth();

            // Check if current user is admin
            if (session?.user?.role !== 'admin') {
                throw new Error('Unauthorized - Admin access required');
            }

            await dbConnect();

            const user = await User.findByIdAndUpdate(
                userId,
                { $set: { isActive: true } },
                { new: true }
            ).select('-password');

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            console.error('Error activating user:', error);
            throw error;
        }
    }

    /**
     * Delete user account (admin only)
     */
    static async deleteUser(userId: string) {
        try {
            const session = await auth();

            // Check if current user is admin
            if (session?.user?.role !== 'admin') {
                throw new Error('Unauthorized - Admin access required');
            }

            await dbConnect();

            const user = await User.findByIdAndDelete(userId);

            if (!user) {
                throw new Error('User not found');
            }

            return { success: true };
        } catch (error) {
            console.error('Error deleting user:', error);
            throw error;
        }
    }

    /**
     * Get all users (admin/staff only)
     */
    static async getAllUsers(options: {
        page?: number;
        limit?: number;
        role?: 'user' | 'staff' | 'admin';
        isActive?: boolean;
        search?: string;
    } = {}) {
        try {
            const session = await auth();

            // Check if current user is staff or admin
            if (session?.user?.role !== 'staff' && session?.user?.role !== 'admin') {
                throw new Error('Unauthorized - Staff or Admin access required');
            }

            await dbConnect();

            const {
                page = 1,
                limit = 20,
                role,
                isActive,
                search,
            } = options;

            const query: any = {};

            if (role) {
                query.role = role;
            }

            if (isActive !== undefined) {
                query.isActive = isActive;
            }

            if (search) {
                query.$or = [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } },
                ];
            }

            const skip = (page - 1) * limit;

            const [users, total] = await Promise.all([
                User.find(query)
                    .select('-password')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(limit)
                    .lean(),
                User.countDocuments(query),
            ]);

            return {
                users,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            console.error('Error getting all users:', error);
            throw error;
        }
    }

    /**
     * Update user role (admin only)
     */
    static async updateUserRole(userId: string, role: 'user' | 'staff' | 'admin') {
        try {
            const session = await auth();

            // Check if current user is admin
            if (session?.user?.role !== 'admin') {
                throw new Error('Unauthorized - Admin access required');
            }

            await dbConnect();

            const user = await User.findByIdAndUpdate(
                userId,
                { $set: { role } },
                { new: true }
            ).select('-password');

            if (!user) {
                throw new Error('User not found');
            }

            return user;
        } catch (error) {
            console.error('Error updating user role:', error);
            throw error;
        }
    }

    /**
     * Verify user credentials (for manual login)
     */
    static async verifyCredentials(email: string, password: string) {
        try {
            await dbConnect();

            const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

            if (!user || !user.password || !user.isActive) {
                return null;
            }

            const isPasswordValid = await bcrypt.compare(password, user.password);

            if (!isPasswordValid) {
                return null;
            }

            // Return user without password
            const userObject = user.toObject() as any;
            delete userObject.password;

            return userObject;
        } catch (error) {
            console.error('Error verifying credentials:', error);
            return null;
        }
    }

    /**
     * Get user statistics (admin only)
     */
    static async getUserStats() {
        try {
            const session = await auth();

            // Check if current user is admin
            if (session?.user?.role !== 'admin') {
                throw new Error('Unauthorized - Admin access required');
            }

            await dbConnect();

            const [
                totalUsers,
                activeUsers,
                inactiveUsers,
                usersByRole,
            ] = await Promise.all([
                User.countDocuments(),
                User.countDocuments({ isActive: true }),
                User.countDocuments({ isActive: false }),
                User.aggregate([
                    {
                        $group: {
                            _id: '$role',
                            count: { $sum: 1 },
                        },
                    },
                ]),
            ]);

            const roleStats = usersByRole.reduce((acc, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {} as Record<string, number>);

            return {
                totalUsers,
                activeUsers,
                inactiveUsers,
                roleStats: {
                    user: roleStats.user || 0,
                    staff: roleStats.staff || 0,
                    admin: roleStats.admin || 0,
                },
            };
        } catch (error) {
            console.error('Error getting user stats:', error);
            throw error;
        }
    }
}