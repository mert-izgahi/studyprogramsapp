import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: "user" | "staff" | "admin";
    imageUrl?: string;
    isVerified: boolean;
    verificationToken?: string;
    resetPasswordToken?: string;
    resetPasswordExpires?: Date;
    isActive: boolean;
    preferences: {
        language: string;
        notifications: {
            email: boolean;
            push: boolean;
            sms: boolean;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}

export interface UserModelType extends Model<IUser> {
    findByCredentials(email: string, password: string): Promise<IUser | null>;
    findByEmail(email: string): Promise<IUser | null>;
    softDeleteById(id: string): Promise<IUser | null>;
}

const UserSchema = new Schema<IUser>(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
        },
        firstName: {
            type: String,
            required: [true, "FirstName is required"],
            trim: true,
        },
        lastName: {
            type: String,
            required: [true, "LastName is required"],
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        imageUrl: {
            type: String,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        verificationToken: {
            type: String,
        },
        resetPasswordToken: {
            type: String,
        },
        resetPasswordExpires: {
            type: Date,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        preferences: {
            language: {
                type: String,
                default: "en",
                enum: ["en", "ar"],
            },
            notifications: {
                email: {
                    type: Boolean,
                    default: true,
                },
                push: {
                    type: Boolean,
                    default: true,
                },
                sms: {
                    type: Boolean,
                    default: true,
                },
            },
        },
        role: {
            type: String,
            enum: ["user", "staff", "admin"],
            default: "user",
        },
    },
    {
        timestamps: true,
    },
);

UserSchema.index({ email: 1 });

UserSchema.methods.findByCredentials = async function (
    email: string,
    password: string,
) {
    const user = await this.findOne({ email });
    if (!user) return null;
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return null;
    return user;
};

UserSchema.methods.findByEmail = async function (email: string) {
    const user = await this.findOne({ email });
    if (!user) return null;
    return user;
};

UserSchema.methods.softDeleteById = async function (id: string) {
    const user = await this.findById(id);
    if (!user) return null;
    user.isActive = false;
    await user.save();
    return user;
};

function createUserModel(): UserModelType {
    // Check if the model already exists
    if (mongoose.models && mongoose.models.User) {
        return mongoose.models.User as UserModelType;
    }

    // Create new model if it doesn't exist
    return mongoose.model<IUser, UserModelType>("User", UserSchema);
}

export const User = createUserModel();