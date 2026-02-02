# Complete Study Programs Platform - All Code

This file contains ALL the code you need to build the complete project. Copy each section into the appropriate file.

---

## TABLE OF CONTENTS

1. [Project Setup](#project-setup)
2. [Configuration Files](#configuration-files)
3. [Database Models](#database-models)
4. [Services](#services)
5. [API Routes](#api-routes)
6. [Utilities](#utilities)
7. [Setup Instructions](#setup-instructions)

---

## PROJECT SETUP

### Create Project Structure

```bash
mkdir study-programs-platform
cd study-programs-platform
mkdir -p src/{app/api/{programs/{filters,stats},favorites,admin/scrape/{jobs},auth},lib/{models,services,scraper/{core,services,types}},components,types}
mkdir scripts
```

---

## CONFIGURATION FILES

### 📄 `package.json`

```json
{
  "name": "study-programs-platform",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "mongoose": "^8.3.0",
    "next-auth": "^4.24.7",
    "bcryptjs": "^2.4.3",
    "zod": "^3.23.0",
    "lucide-react": "^0.263.1",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.3.0",
    "date-fns": "^3.6.0",
    "puppeteer": "^22.6.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "@types/bcryptjs": "^2.4.6",
    "typescript": "^5",
    "eslint": "^8",
    "eslint-config-next": "14.2.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8",
    "autoprefixer": "^10.0.1"
  }
}
```

### 📄 `tsconfig.json`

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 📄 `next.config.mjs`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  images: {
    domains: ["partner.unitededucation.com"],
  },
};

export default nextConfig;
```

### 📄 `tailwind.config.ts`

```typescript
import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
```

### 📄 `postcss.config.js`

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### 📄 `.env.example`

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/study-programs
# For production use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/study-programs?retryWrites=true&w=majority

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-generate-with-openssl-rand-base64-32

# United Education Scraper Credentials (Admin only)
SCRAPER_EMAIL=your-email@example.com
SCRAPER_PASSWORD=your-password

# App Configuration
NODE_ENV=development
```

### 📄 `.gitignore`

```
# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env
.env*.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# IDE
.vscode/
.idea/
*.swp

# Screenshots
*.png
!public/**/*.png
```

### 📄 `src/app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

---

## DATABASE MODELS

### 📄 `src/lib/db.ts`

```typescript
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env",
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("✅ MongoDB connected successfully");
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
```

### 📄 `src/lib/models/User.ts`

```typescript
import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
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
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
  },
  {
    timestamps: true,
  },
);

UserSchema.index({ email: 1 });

const User = models.User || model<IUser>("User", UserSchema);

export default User;
```

### 📄 `src/lib/models/Term.ts`

```typescript
import mongoose, { Schema, model, models, Document } from "mongoose";

export interface ITerm extends Document {
  termId: string;
  name: string;
  academicYear: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TermSchema = new Schema<ITerm>(
  {
    termId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    academicYear: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

TermSchema.index({ isActive: 1, academicYear: -1 });

const Term = models.Term || model<ITerm>("Term", TermSchema);

export default Term;
```

### 📄 `src/lib/models/FilterFields.ts`

```typescript
import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IFilterFields extends Document {
  termId: string;
  universities: string[];
  programs: string[];
  degrees: string[];
  languages: string[];
  campuses: string[];
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FilterFieldsSchema = new Schema<IFilterFields>(
  {
    termId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      ref: "Term",
    },
    universities: {
      type: [String],
      default: [],
    },
    programs: {
      type: [String],
      default: [],
    },
    degrees: {
      type: [String],
      default: [],
    },
    languages: {
      type: [String],
      default: [],
    },
    campuses: {
      type: [String],
      default: [],
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

FilterFieldsSchema.index({ termId: 1 });

const FilterFields =
  models.FilterFields ||
  model<IFilterFields>("FilterFields", FilterFieldsSchema);

export default FilterFields;
```

### 📄 `src/lib/models/Program.ts`

```typescript
import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IProgram extends Document {
  programId: string;
  termId: string;
  programName: string;
  alternativeProgramName?: string;
  universityName: string;
  universityId: string;
  programDegree: string;
  language: string;
  campus: string;
  tuitionFee: number;
  discountedTuitionFee: number;
  currency: string;
  depositPrice: number;
  prepSchoolFee?: number;
  cashPaymentFee?: string;
  quotaFull: boolean;
  semester: string;
  termSettings: string;
  academicYear: string;
  lastScraped: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProgramSchema = new Schema<IProgram>(
  {
    programId: {
      type: String,
      required: true,
      index: true,
    },
    termId: {
      type: String,
      required: true,
      index: true,
      ref: "Term",
    },
    programName: {
      type: String,
      required: true,
      trim: true,
      index: "text",
    },
    alternativeProgramName: {
      type: String,
      trim: true,
    },
    universityName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    universityId: {
      type: String,
      required: true,
      index: true,
    },
    programDegree: {
      type: String,
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
      index: true,
    },
    campus: {
      type: String,
      trim: true,
      index: true,
    },
    tuitionFee: {
      type: Number,
      required: true,
      min: 0,
    },
    discountedTuitionFee: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    currency: {
      type: String,
      required: true,
      default: "USD",
    },
    depositPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    prepSchoolFee: {
      type: Number,
      min: 0,
    },
    cashPaymentFee: {
      type: String,
    },
    quotaFull: {
      type: Boolean,
      default: false,
      index: true,
    },
    semester: {
      type: String,
      required: true,
    },
    termSettings: {
      type: String,
      required: true,
    },
    academicYear: {
      type: String,
      required: true,
      index: true,
    },
    lastScraped: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

ProgramSchema.index({ termId: 1, programId: 1 }, { unique: true });
ProgramSchema.index({ termId: 1, universityName: 1 });
ProgramSchema.index({ termId: 1, programDegree: 1 });
ProgramSchema.index({ termId: 1, language: 1 });
ProgramSchema.index({ termId: 1, quotaFull: 1 });
ProgramSchema.index({ termId: 1, discountedTuitionFee: 1 });
ProgramSchema.index({
  programName: "text",
  universityName: "text",
  alternativeProgramName: "text",
});

const Program = models.Program || model<IProgram>("Program", ProgramSchema);

export default Program;
```

### 📄 `src/lib/models/FavoriteList.ts`

```typescript
import mongoose, { Schema, model, models, Document } from "mongoose";

export interface IFavoriteList extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  programs: mongoose.Types.ObjectId[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FavoriteListSchema = new Schema<IFavoriteList>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    programs: [
      {
        type: Schema.Types.ObjectId,
        ref: "Program",
      },
    ],
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

FavoriteListSchema.index({ userId: 1, name: 1 });
FavoriteListSchema.index({ userId: 1, isDefault: 1 });

FavoriteListSchema.pre("save", async function (next) {
  if (this.isDefault && this.isModified("isDefault")) {
    await mongoose
      .model("FavoriteList")
      .updateMany(
        { userId: this.userId, _id: { $ne: this._id } },
        { $set: { isDefault: false } },
      );
  }
  next();
});

const FavoriteList =
  models.FavoriteList ||
  model<IFavoriteList>("FavoriteList", FavoriteListSchema);

export default FavoriteList;
```

### 📄 `src/lib/models/ScrapeJob.ts`

```typescript
import mongoose, { Schema, model, models, Document } from "mongoose";

export type ScrapeStatus = "pending" | "running" | "completed" | "failed";

export interface IScrapeJob extends Document {
  termId: string;
  termName: string;
  status: ScrapeStatus;
  startedAt?: Date;
  completedAt?: Date;
  programsScraped: number;
  error?: string;
  logs: string[];
  initiatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ScrapeJobSchema = new Schema<IScrapeJob>(
  {
    termId: {
      type: String,
      required: true,
      index: true,
    },
    termName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "running", "completed", "failed"],
      default: "pending",
      index: true,
    },
    startedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    programsScraped: {
      type: Number,
      default: 0,
    },
    error: {
      type: String,
    },
    logs: {
      type: [String],
      default: [],
    },
    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

ScrapeJobSchema.index({ status: 1, createdAt: -1 });
ScrapeJobSchema.index({ termId: 1, status: 1 });

const ScrapeJob =
  models.ScrapeJob || model<IScrapeJob>("ScrapeJob", ScrapeJobSchema);

export default ScrapeJob;
```

---

## SERVICES

### 📄 `src/lib/services/program.service.ts`

```typescript
import dbConnect from "@/lib/db";
import Program, { IProgram } from "@/lib/models/Program";
import FilterFields from "@/lib/models/FilterFields";
import mongoose from "mongoose";

export interface ProgramFilters {
  termId?: string;
  university?: string;
  degree?: string;
  language?: string;
  campus?: string;
  minPrice?: number;
  maxPrice?: number;
  quotaFull?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ProgramListResponse {
  programs: IProgram[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ProgramService {
  static async getPrograms(
    filters: ProgramFilters = {},
    options: PaginationOptions = {},
  ): Promise<ProgramListResponse> {
    await dbConnect();

    const {
      page = 1,
      limit = 20,
      sortBy = "discountedTuitionFee",
      sortOrder = "asc",
    } = options;

    const query: any = { isActive: true };

    if (filters.termId) {
      query.termId = filters.termId;
    }

    if (filters.university) {
      query.universityName = filters.university;
    }

    if (filters.degree) {
      query.programDegree = filters.degree;
    }

    if (filters.language) {
      query.language = filters.language;
    }

    if (filters.campus) {
      query.campus = filters.campus;
    }

    if (filters.quotaFull !== undefined) {
      query.quotaFull = filters.quotaFull;
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      query.discountedTuitionFee = {};
      if (filters.minPrice !== undefined) {
        query.discountedTuitionFee.$gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        query.discountedTuitionFee.$lte = filters.maxPrice;
      }
    }

    if (filters.search) {
      query.$text = { $search: filters.search };
    }

    const skip = (page - 1) * limit;

    const sort: any = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    const [programs, total] = await Promise.all([
      Program.find(query).sort(sort).skip(skip).limit(limit).lean(),
      Program.countDocuments(query),
    ]);

    return {
      programs: programs as IProgram[],
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async getProgramById(id: string): Promise<IProgram | null> {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    return Program.findById(id).lean();
  }

  static async getProgramsByIds(ids: string[]): Promise<IProgram[]> {
    await dbConnect();

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));

    return Program.find({
      _id: { $in: validIds },
      isActive: true,
    }).lean();
  }

  static async getFilterOptions(termId: string): Promise<any> {
    await dbConnect();

    const filterFields = await FilterFields.findOne({ termId }).lean();

    if (!filterFields) {
      return {
        universities: [],
        programs: [],
        degrees: [],
        languages: [],
        campuses: [],
      };
    }

    return {
      universities: filterFields.universities,
      programs: filterFields.programs,
      degrees: filterFields.degrees,
      languages: filterFields.languages,
      campuses: filterFields.campuses,
    };
  }

  static async getProgramStats(termId: string): Promise<any> {
    await dbConnect();

    const stats = await Program.aggregate([
      { $match: { termId, isActive: true } },
      {
        $group: {
          _id: null,
          totalPrograms: { $sum: 1 },
          avgTuitionFee: { $avg: "$discountedTuitionFee" },
          minTuitionFee: { $min: "$discountedTuitionFee" },
          maxTuitionFee: { $max: "$discountedTuitionFee" },
          totalUniversities: { $addToSet: "$universityName" },
          programsByDegree: { $push: "$programDegree" },
          programsByLanguage: { $push: "$language" },
        },
      },
    ]);

    if (stats.length === 0) {
      return {
        totalPrograms: 0,
        avgTuitionFee: 0,
        minTuitionFee: 0,
        maxTuitionFee: 0,
        totalUniversities: 0,
        degreeDistribution: {},
        languageDistribution: {},
      };
    }

    const result = stats[0];

    const degreeDistribution: Record<string, number> = {};
    result.programsByDegree.forEach((degree: string) => {
      degreeDistribution[degree] = (degreeDistribution[degree] || 0) + 1;
    });

    const languageDistribution: Record<string, number> = {};
    result.programsByLanguage.forEach((language: string) => {
      languageDistribution[language] =
        (languageDistribution[language] || 0) + 1;
    });

    return {
      totalPrograms: result.totalPrograms,
      avgTuitionFee: Math.round(result.avgTuitionFee),
      minTuitionFee: result.minTuitionFee,
      maxTuitionFee: result.maxTuitionFee,
      totalUniversities: result.totalUniversities.length,
      degreeDistribution,
      languageDistribution,
    };
  }

  static async searchPrograms(
    searchTerm: string,
    termId?: string,
    limit: number = 20,
  ): Promise<IProgram[]> {
    await dbConnect();

    const query: any = {
      $text: { $search: searchTerm },
      isActive: true,
    };

    if (termId) {
      query.termId = termId;
    }

    return Program.find(query)
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .lean();
  }
}
```

### 📄 `src/lib/services/favorite.service.ts`

```typescript
import dbConnect from "@/lib/db";
import FavoriteList, { IFavoriteList } from "@/lib/models/FavoriteList";
import Program from "@/lib/models/Program";
import mongoose from "mongoose";

export class FavoriteListService {
  static async createList(
    userId: string,
    name: string,
    description?: string,
    isDefault: boolean = false,
  ): Promise<IFavoriteList> {
    await dbConnect();

    const existingList = await FavoriteList.findOne({ userId, name });
    if (existingList) {
      throw new Error("A list with this name already exists");
    }

    const list = await FavoriteList.create({
      userId,
      name,
      description,
      isDefault,
      programs: [],
    });

    return list.toObject();
  }

  static async getUserLists(userId: string): Promise<IFavoriteList[]> {
    await dbConnect();

    return FavoriteList.find({ userId })
      .sort({ isDefault: -1, createdAt: -1 })
      .populate({
        path: "programs",
        match: { isActive: true },
        select:
          "programName universityName discountedTuitionFee currency programDegree language",
      })
      .lean();
  }

  static async getListById(
    listId: string,
    userId: string,
  ): Promise<IFavoriteList | null> {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(listId)) {
      return null;
    }

    return FavoriteList.findOne({ _id: listId, userId })
      .populate({
        path: "programs",
        match: { isActive: true },
      })
      .lean();
  }

  static async updateList(
    listId: string,
    userId: string,
    updates: { name?: string; description?: string; isDefault?: boolean },
  ): Promise<IFavoriteList | null> {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(listId)) {
      return null;
    }

    if (updates.name) {
      const existingList = await FavoriteList.findOne({
        userId,
        name: updates.name,
        _id: { $ne: listId },
      });

      if (existingList) {
        throw new Error("A list with this name already exists");
      }
    }

    return FavoriteList.findOneAndUpdate(
      { _id: listId, userId },
      { $set: updates },
      { new: true },
    )
      .populate("programs")
      .lean();
  }

  static async deleteList(listId: string, userId: string): Promise<boolean> {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(listId)) {
      return false;
    }

    const result = await FavoriteList.deleteOne({ _id: listId, userId });
    return result.deletedCount > 0;
  }

  static async addProgramToList(
    listId: string,
    userId: string,
    programId: string,
  ): Promise<IFavoriteList | null> {
    await dbConnect();

    if (
      !mongoose.Types.ObjectId.isValid(listId) ||
      !mongoose.Types.ObjectId.isValid(programId)
    ) {
      return null;
    }

    const program = await Program.findById(programId);
    if (!program) {
      throw new Error("Program not found");
    }

    const list = await FavoriteList.findOne({ _id: listId, userId });
    if (!list) {
      return null;
    }

    if (list.programs.includes(programId as any)) {
      throw new Error("Program already in list");
    }

    return FavoriteList.findOneAndUpdate(
      { _id: listId, userId },
      { $addToSet: { programs: programId } },
      { new: true },
    )
      .populate("programs")
      .lean();
  }

  static async removeProgramFromList(
    listId: string,
    userId: string,
    programId: string,
  ): Promise<IFavoriteList | null> {
    await dbConnect();

    if (
      !mongoose.Types.ObjectId.isValid(listId) ||
      !mongoose.Types.ObjectId.isValid(programId)
    ) {
      return null;
    }

    return FavoriteList.findOneAndUpdate(
      { _id: listId, userId },
      { $pull: { programs: programId } },
      { new: true },
    )
      .populate("programs")
      .lean();
  }

  static async getOrCreateDefaultList(userId: string): Promise<IFavoriteList> {
    await dbConnect();

    let defaultList = await FavoriteList.findOne({ userId, isDefault: true });

    if (!defaultList) {
      defaultList = await FavoriteList.create({
        userId,
        name: "My Favorites",
        description: "Default favorite list",
        isDefault: true,
        programs: [],
      });
    }

    return defaultList.toObject();
  }

  static async isProgramInAnyList(
    userId: string,
    programId: string,
  ): Promise<boolean> {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return false;
    }

    const count = await FavoriteList.countDocuments({
      userId,
      programs: programId,
    });

    return count > 0;
  }

  static async getListsContainingProgram(
    userId: string,
    programId: string,
  ): Promise<IFavoriteList[]> {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(programId)) {
      return [];
    }

    return FavoriteList.find({
      userId,
      programs: programId,
    })
      .select("_id name")
      .lean();
  }
}
```

### 📄 `src/lib/services/scraper.service.ts`

```typescript
import { UnitedEducationScraper } from "@/lib/scraper/index";
import dbConnect from "@/lib/db";
import Term from "@/lib/models/Term";
import Program from "@/lib/models/Program";
import FilterFields from "@/lib/models/FilterFields";
import ScrapeJob, { IScrapeJob } from "@/lib/models/ScrapeJob";
import type {
  LoginCredentials,
  ProgramSearchOptions,
  ScrapeResult,
} from "@/lib/scraper/types";

export class ScraperService {
  private scraper: UnitedEducationScraper | null = null;
  private jobId: string | null = null;

  async initialize(credentials: LoginCredentials): Promise<void> {
    this.scraper = new UnitedEducationScraper(credentials, {
      headless: true,
      timeout: 60000,
    });

    await this.scraper.initialize();
    await this.scraper.login();
  }

  async startScrapingForTerm(
    termName: string,
    userId: string,
    options?: ProgramSearchOptions,
  ): Promise<string> {
    if (!this.scraper) {
      throw new Error("Scraper not initialized. Call initialize() first.");
    }

    await dbConnect();

    try {
      const termId = await this.scraper.setupProgramSearch(termName);

      const job = await ScrapeJob.create({
        termId,
        termName,
        status: "pending",
        initiatedBy: userId,
        logs: [`Scraping started for term: ${termName}`],
      });

      this.jobId = job._id.toString();

      await this.updateJobStatus(
        this.jobId,
        "running",
        "Fetching filter fields...",
      );

      const filterFields = await this.scraper.getAvailableFilters();
      await this.saveFilterFields(termId, filterFields);
      await this.updateJobLogs(this.jobId, "Filter fields saved successfully");

      await this.updateJobLogs(this.jobId, "Starting program scraping...");
      const result = await this.scraper.scrapePrograms(options);

      await this.savePrograms(termId, result);

      await this.saveTerm(termId, termName);

      await this.updateJobStatus(
        this.jobId,
        "completed",
        `Successfully scraped ${result.data.length} programs`,
      );

      return this.jobId;
    } catch (error) {
      if (this.jobId) {
        await this.updateJobStatus(
          this.jobId,
          "failed",
          `Error: ${(error as Error).message}`,
        );
      }
      throw error;
    } finally {
      await this.cleanup();
    }
  }

  private async saveTerm(termId: string, termName: string): Promise<void> {
    await dbConnect();

    const academicYear = termName.match(/\d{4}-\d{4}/)?.[0] || "";

    await Term.findOneAndUpdate(
      { termId },
      {
        termId,
        name: termName,
        academicYear,
        isActive: true,
      },
      { upsert: true, new: true },
    );
  }

  private async saveFilterFields(
    termId: string,
    filterFields: any,
  ): Promise<void> {
    await dbConnect();

    await FilterFields.findOneAndUpdate(
      { termId },
      {
        termId,
        universities: filterFields.universities || [],
        programs: filterFields.programs || [],
        degrees: filterFields.degrees || [],
        languages: filterFields.languages || [],
        campuses: filterFields.campuses || [],
        lastUpdated: new Date(),
      },
      { upsert: true, new: true },
    );
  }

  private async savePrograms(
    termId: string,
    result: ScrapeResult,
  ): Promise<void> {
    await dbConnect();

    const programs = result.data.map((program) => ({
      programId: program.id,
      termId,
      programName: program.programName,
      alternativeProgramName: program.alternativeProgramName,
      universityName: program.universityName,
      universityId: program.universityId,
      programDegree: program.programDegree,
      language: program.language,
      campus: program.campus,
      tuitionFee: program.tuitionFee,
      discountedTuitionFee: program.discountedTuitionFee,
      currency: program.currency,
      depositPrice: program.depositPrice,
      prepSchoolFee: program.prepSchoolFee,
      cashPaymentFee: program.cashPaymentFee,
      quotaFull: program.quotaFull,
      semester: program.semester,
      termSettings: program.termSettings,
      academicYear: program.academicYear,
      lastScraped: new Date(),
      isActive: true,
    }));

    const bulkOps = programs.map((program) => ({
      updateOne: {
        filter: { termId: program.termId, programId: program.programId },
        update: { $set: program },
        upsert: true,
      },
    }));

    if (bulkOps.length > 0) {
      await Program.bulkWrite(bulkOps);
    }

    if (this.jobId) {
      await ScrapeJob.findByIdAndUpdate(this.jobId, {
        programsScraped: programs.length,
      });
    }
  }

  private async updateJobStatus(
    jobId: string,
    status: string,
    message?: string,
  ): Promise<void> {
    await dbConnect();

    const update: any = { status };

    if (status === "running") {
      update.startedAt = new Date();
    } else if (status === "completed" || status === "failed") {
      update.completedAt = new Date();
    }

    if (message) {
      if (status === "failed") {
        update.error = message;
      }
      update.$push = { logs: message };
    }

    await ScrapeJob.findByIdAndUpdate(jobId, update);
  }

  private async updateJobLogs(jobId: string, message: string): Promise<void> {
    await dbConnect();

    await ScrapeJob.findByIdAndUpdate(jobId, {
      $push: { logs: `${new Date().toISOString()}: ${message}` },
    });
  }

  private async cleanup(): Promise<void> {
    if (this.scraper) {
      await this.scraper.close();
      this.scraper = null;
    }
  }

  static async getJobStatus(jobId: string): Promise<IScrapeJob | null> {
    await dbConnect();
    return ScrapeJob.findById(jobId).lean();
  }

  static async getAllJobs(limit: number = 50): Promise<IScrapeJob[]> {
    await dbConnect();
    return ScrapeJob.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("initiatedBy", "name email")
      .lean();
  }
}
```

---

## AUTHENTICATION

### 📄 `src/lib/auth.ts`

```typescript
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await dbConnect();

        const user = await User.findOne({
          email: credentials.email.toLowerCase(),
        });

        if (!user) {
          throw new Error("No user found with this email");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password,
        );

        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
```

### 📄 `src/types/next-auth.d.ts`

```typescript
import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    role: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: string;
  }
}
```

---

## API ROUTES

### 📄 `src/app/api/auth/[...nextauth]/route.ts`

```typescript
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### 📄 `src/app/api/programs/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/lib/services/program.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const filters = {
      termId: searchParams.get("termId") || undefined,
      university: searchParams.get("university") || undefined,
      degree: searchParams.get("degree") || undefined,
      language: searchParams.get("language") || undefined,
      campus: searchParams.get("campus") || undefined,
      minPrice: searchParams.get("minPrice")
        ? Number(searchParams.get("minPrice"))
        : undefined,
      maxPrice: searchParams.get("maxPrice")
        ? Number(searchParams.get("maxPrice"))
        : undefined,
      quotaFull:
        searchParams.get("quotaFull") === "true"
          ? true
          : searchParams.get("quotaFull") === "false"
            ? false
            : undefined,
      search: searchParams.get("search") || undefined,
    };

    const options = {
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
      sortBy: searchParams.get("sortBy") || "discountedTuitionFee",
      sortOrder: (searchParams.get("sortOrder") || "asc") as "asc" | "desc",
    };

    const result = await ProgramService.getPrograms(filters, options);

    return NextResponse.json({
      success: true,
      data: result.programs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("Error fetching programs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch programs",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
```

### 📄 `src/app/api/programs/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/lib/services/program.service";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const program = await ProgramService.getProgramById(params.id);

    if (!program) {
      return NextResponse.json(
        {
          success: false,
          error: "Program not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: program,
    });
  } catch (error) {
    console.error("Error fetching program:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch program",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
```

### 📄 `src/app/api/programs/filters/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/lib/services/program.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const termId = searchParams.get("termId");

    if (!termId) {
      return NextResponse.json(
        {
          success: false,
          error: "termId is required",
        },
        { status: 400 },
      );
    }

    const filterOptions = await ProgramService.getFilterOptions(termId);

    return NextResponse.json({
      success: true,
      data: filterOptions,
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch filter options",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
```

### 📄 `src/app/api/programs/stats/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { ProgramService } from "@/lib/services/program.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const termId = searchParams.get("termId");

    if (!termId) {
      return NextResponse.json(
        {
          success: false,
          error: "termId is required",
        },
        { status: 400 },
      );
    }

    const stats = await ProgramService.getProgramStats(termId);

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching program stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch program stats",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
```

### 📄 `src/app/api/favorites/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { FavoriteListService } from "@/lib/services/favorite.service";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const lists = await FavoriteListService.getUserLists(session.user.id);

    return NextResponse.json({
      success: true,
      data: lists,
    });
  } catch (error) {
    console.error("Error fetching favorite lists:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch favorite lists",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { name, description, isDefault } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "List name is required",
        },
        { status: 400 },
      );
    }

    const list = await FavoriteListService.createList(
      session.user.id,
      name,
      description,
      isDefault,
    );

    return NextResponse.json(
      {
        success: true,
        data: list,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating favorite list:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create favorite list",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
```

### 📄 `src/app/api/favorites/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { FavoriteListService } from "@/lib/services/favorite.service";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const list = await FavoriteListService.getListById(
      params.id,
      session.user.id,
    );

    if (!list) {
      return NextResponse.json(
        {
          success: false,
          error: "List not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("Error fetching favorite list:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch favorite list",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { name, description, isDefault } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (isDefault !== undefined) updates.isDefault = isDefault;

    const list = await FavoriteListService.updateList(
      params.id,
      session.user.id,
      updates,
    );

    if (!list) {
      return NextResponse.json(
        {
          success: false,
          error: "List not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("Error updating favorite list:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update favorite list",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const success = await FavoriteListService.deleteList(
      params.id,
      session.user.id,
    );

    if (!success) {
      return NextResponse.json(
        {
          success: false,
          error: "List not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "List deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting favorite list:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete favorite list",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
```

### 📄 `src/app/api/favorites/[id]/programs/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { FavoriteListService } from "@/lib/services/favorite.service";
import { authOptions } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const body = await request.json();
    const { programId } = body;

    if (!programId) {
      return NextResponse.json(
        {
          success: false,
          error: "programId is required",
        },
        { status: 400 },
      );
    }

    const list = await FavoriteListService.addProgramToList(
      params.id,
      session.user.id,
      programId,
    );

    if (!list) {
      return NextResponse.json(
        {
          success: false,
          error: "List not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("Error adding program to list:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to add program to list",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const programId = searchParams.get("programId");

    if (!programId) {
      return NextResponse.json(
        {
          success: false,
          error: "programId is required",
        },
        { status: 400 },
      );
    }

    const list = await FavoriteListService.removeProgramFromList(
      params.id,
      session.user.id,
      programId,
    );

    if (!list) {
      return NextResponse.json(
        {
          success: false,
          error: "List not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: list,
    });
  } catch (error) {
    console.error("Error removing program from list:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to remove program from list",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
```

### 📄 `src/app/api/admin/scrape/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ScraperService } from "@/lib/services/scraper.service";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Admin access required",
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const { termName, filters } = body;

    if (!termName) {
      return NextResponse.json(
        {
          success: false,
          error: "termName is required",
        },
        { status: 400 },
      );
    }

    const credentials = {
      email: process.env.SCRAPER_EMAIL!,
      password: process.env.SCRAPER_PASSWORD!,
    };

    if (!credentials.email || !credentials.password) {
      return NextResponse.json(
        {
          success: false,
          error: "Scraper credentials not configured",
        },
        { status: 500 },
      );
    }

    const scraperService = new ScraperService();
    await scraperService.initialize(credentials);

    const jobId = await scraperService.startScrapingForTerm(
      termName,
      session.user.id,
      filters,
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          jobId,
          message: "Scraping job started",
        },
      },
      { status: 202 },
    );
  } catch (error) {
    console.error("Error starting scraping job:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to start scraping job",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
```

### 📄 `src/app/api/admin/scrape/[jobId]/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ScraperService } from "@/lib/services/scraper.service";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } },
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Admin access required",
        },
        { status: 403 },
      );
    }

    const job = await ScraperService.getJobStatus(params.jobId);

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: "Job not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("Error fetching job status:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch job status",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
```

### 📄 `src/app/api/admin/scrape/jobs/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ScraperService } from "@/lib/services/scraper.service";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized - Admin access required",
        },
        { status: 403 },
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit")
      ? Number(searchParams.get("limit"))
      : 50;

    const jobs = await ScraperService.getAllJobs(limit);

    return NextResponse.json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error("Error fetching scrape jobs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch scrape jobs",
        message: (error as Error).message,
      },
      { status: 500 },
    );
  }
}
```

---

## SCRAPER INTEGRATION

### 📄 `src/lib/scraper/types/index.ts`

```typescript
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginOptions {
  loginUrl?: string;
  headless?: boolean;
  slowMo?: number;
  timeout?: number;
}

export interface BrowserConfig {
  headless?: boolean;
  slowMo?: number;
  timeout?: number;
  viewport?: { width: number; height: number };
  userAgent?: string;
}

export interface Program {
  id: string;
  programName: string;
  alternativeProgramName?: string;
  universityName: string;
  universityId: string;
  programDegree: string;
  language: string;
  campus: string;
  tuitionFee: number;
  discountedTuitionFee: number;
  currency: string;
  depositPrice: number;
  prepSchoolFee?: number;
  cashPaymentFee?: string;
  quotaFull: boolean;
  semester: string;
  termSettings: string;
  academicYear: string;
}

export interface FilterFields {
  universities: string[];
  programs: string[];
  degrees: string[];
  languages: string[];
  campuses: string[];
}

export interface ProgramSearchOptions {
  university?: string;
  program?: string;
  degree?: string;
  language?: string;
  campus?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  recordsPerPage: number;
}

export interface ScrapeResult {
  data: Program[];
  pagination: PaginationInfo;
  timestamp: Date;
  filters?: ProgramSearchOptions;
}

export enum ScraperErrorType {
  INITIALIZATION_ERROR = "INITIALIZATION_ERROR",
  LOGIN_ERROR = "LOGIN_ERROR",
  NAVIGATION_ERROR = "NAVIGATION_ERROR",
  SCRAPING_ERROR = "SCRAPING_ERROR",
  ELEMENT_NOT_FOUND = "ELEMENT_NOT_FOUND",
}

export class ScraperError extends Error {
  type: ScraperErrorType;
  originalError?: Error;

  constructor(type: ScraperErrorType, message: string, originalError?: Error) {
    super(message);
    this.name = "ScraperError";
    this.type = type;
    this.originalError = originalError;
  }
}
```

### 📄 `src/lib/scraper/index.ts`

```typescript
// NOTE: You need to copy your original scraper files here:
// - BrowserManager.ts → src/lib/scraper/core/BrowserManager.ts
// - Authentication.ts → src/lib/scraper/core/Authentication.ts
// - ProgramSearchService.ts → src/lib/scraper/services/ProgramSearchService.ts

// Then uncomment and use these imports:
// export { BrowserManager } from './core/BrowserManager';
// export { AuthenticationService } from './core/Authentication';
// export { ProgramSearchService } from './services/ProgramSearchService';

export * from "./types";

// Import your classes here
// import { AuthenticationService } from './core/Authentication';
// import { ProgramSearchService } from './services/ProgramSearchService';
import type {
  LoginCredentials,
  LoginOptions,
  ProgramSearchOptions,
  ScrapeResult,
  FilterFields,
  Program,
} from "./types";

/**
 * Main scraper class
 * IMPORTANT: Replace this with your actual implementation after copying your scraper files
 */
export class UnitedEducationScraper {
  private authService: any; // Replace 'any' with AuthenticationService
  private programSearchService: any | null = null; // Replace 'any' with ProgramSearchService

  constructor(credentials: LoginCredentials, options: LoginOptions = {}) {
    // Uncomment after copying your files:
    // this.authService = new AuthenticationService(credentials, options);

    // Temporary placeholder:
    throw new Error(
      "Please copy your scraper files and uncomment the implementation",
    );
  }

  async initialize(): Promise<void> {
    // await this.authService.initialize();
  }

  async login(): Promise<boolean> {
    // const success = await this.authService.login();
    // if (success) {
    //     this.programSearchService = new ProgramSearchService(this.authService.getPage());
    // }
    // return success;
    return false;
  }

  async setupProgramSearch(termName?: string): Promise<string> {
    // if (!this.programSearchService) {
    //     throw new Error('Program search service not initialized. Login first.');
    // }
    // await this.programSearchService.navigateToProgramSearch();
    // const termId = await this.programSearchService.selectTerm(termName);
    // return termId;
    return "";
  }

  async getAvailableFilters(): Promise<FilterFields> {
    // if (!this.programSearchService) {
    //     throw new Error('Program search service not initialized.');
    // }
    // return this.programSearchService.getFilterFields();
    return {
      universities: [],
      programs: [],
      degrees: [],
      languages: [],
      campuses: [],
    };
  }

  async scrapePrograms(options?: ProgramSearchOptions): Promise<ScrapeResult> {
    // if (!this.programSearchService) {
    //     throw new Error('Program search service not initialized.');
    // }
    // return this.programSearchService.scrapeAllPrograms(options);
    return {
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalRecords: 0,
        recordsPerPage: 0,
      },
      timestamp: new Date(),
    };
  }

  async scrapeCurrentPage(): Promise<Program[]> {
    // if (!this.programSearchService) {
    //     throw new Error('Program search service not initialized.');
    // }
    // return this.programSearchService.scrapeCurrentPage();
    return [];
  }

  async applyFilters(options: ProgramSearchOptions): Promise<void> {
    // if (!this.programSearchService) {
    //     throw new Error('Program search service not initialized.');
    // }
    // await this.programSearchService.applyFilters(options);
  }

  async resetFilters(): Promise<void> {
    // if (!this.programSearchService) {
    //     throw new Error('Program search service not initialized.');
    // }
    // await this.programSearchService.resetFilters();
  }

  async takeScreenshot(path?: string): Promise<void> {
    // if (this.programSearchService) {
    //     await this.programSearchService.takeScreenshot(path);
    // } else {
    //     await this.authService.takeScreenshot(path);
    // }
  }

  async getCookies(): Promise<any[]> {
    // return this.authService.getCookies();
    return [];
  }

  async close(): Promise<void> {
    // await this.authService.close();
  }

  getPage() {
    // return this.authService.getPage();
    return null;
  }
}
```

---

## UTILITIES & SCRIPTS

### 📄 `scripts/create-admin.js`

```javascript
#!/usr/bin/env node

/**
 * Script to create an admin user
 * Usage: node scripts/create-admin.js
 */

const readline = require("readline");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

// Load environment variables
require("dotenv").config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function createAdminUser() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI;
    if (!MONGODB_URI) {
      console.error("❌ MONGODB_URI not found in environment variables");
      process.exit(1);
    }

    console.log("📡 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const name = await question("Enter admin name: ");
    const email = await question("Enter admin email: ");
    const password = await question("Enter admin password: ");

    if (!name || !email || !password) {
      console.error("❌ All fields are required");
      process.exit(1);
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      console.error("❌ Invalid email format");
      process.exit(1);
    }

    if (password.length < 6) {
      console.error("❌ Password must be at least 6 characters");
      process.exit(1);
    }

    const User = mongoose.model(
      "User",
      new mongoose.Schema({
        email: String,
        password: String,
        name: String,
        role: String,
      }),
    );

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.error("❌ User with this email already exists");
      process.exit(1);
    }

    console.log("🔐 Hashing password...");
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("👤 Creating admin user...");
    const adminUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "admin",
    });

    await adminUser.save();

    console.log("✅ Admin user created successfully!");
    console.log("\nLogin credentials:");
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    console.log("\n⚠️  Please save these credentials in a secure location");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

console.log("=================================");
console.log("Create Admin User");
console.log("=================================\n");

createAdminUser();
```

---

## SETUP INSTRUCTIONS

### Step 1: Create the project structure

```bash
# Create main directory
mkdir study-programs-platform
cd study-programs-platform

# Create all necessary directories
mkdir -p src/{app/api/{programs/{filters,stats},favorites,admin/scrape/{jobs},auth},lib/{models,services,scraper/{core,services,types}},components,types}
mkdir scripts
```

### Step 2: Copy all configuration files

Create each configuration file listed above in the Configuration Files section.

### Step 3: Copy all database models

Create each model file in `src/lib/models/` as shown in the Database Models section.

### Step 4: Copy all services

Create each service file in `src/lib/services/` as shown in the Services section.

### Step 5: Copy all API routes

Create each API route file in the appropriate `src/app/api/` subdirectory.

### Step 6: Setup authentication

Create the auth configuration files in `src/lib/auth.ts` and `src/types/next-auth.d.ts`.

### Step 7: Copy your scraper files

**IMPORTANT**: Copy your original scraper files:

```bash
# Copy these files from your original project:
cp /path/to/your/BrowserManager.ts src/lib/scraper/core/
cp /path/to/your/Authentication.ts src/lib/scraper/core/
cp /path/to/your/ProgramSearchService.ts src/lib/scraper/services/
```

Then update `src/lib/scraper/index.ts` by uncommenting the imports and implementation.

### Step 8: Install dependencies

```bash
npm install
```

### Step 9: Setup environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### Step 10: Create admin user

```bash
node scripts/create-admin.js
```

### Step 11: Run the application

```bash
npm run dev
```

---

## QUICK REFERENCE

### Environment Variables Required

```env
MONGODB_URI=your-mongodb-connection-string
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
SCRAPER_EMAIL=your-scraper-email
SCRAPER_PASSWORD=your-scraper-password
```

### Key Commands

```bash
# Development
npm run dev

# Production
npm run build
npm start

# Type checking
npm run type-check

# Create admin
node scripts/create-admin.js
```

### API Endpoints

**Programs:**

- GET `/api/programs` - List programs
- GET `/api/programs/[id]` - Get program
- GET `/api/programs/filters` - Get filters
- GET `/api/programs/stats` - Get stats

**Favorites (Auth Required):**

- GET/POST `/api/favorites` - List/Create
- GET/PATCH/DELETE `/api/favorites/[id]` - Manage list
- POST/DELETE `/api/favorites/[id]/programs` - Add/Remove programs

**Admin (Admin Required):**

- POST `/api/admin/scrape` - Start scraping
- GET `/api/admin/scrape/[jobId]` - Job status
- GET `/api/admin/scrape/jobs` - All jobs

---

## TROUBLESHOOTING

### MongoDB Connection Issues

```bash
# Check MongoDB is running
mongod

# Or start with Docker
docker run -d -p 27017:27017 mongo
```

### NextAuth Secret Missing

```bash
# Generate secret
openssl rand -base64 32
# Add to .env
```

### Puppeteer Issues

```bash
# Install Chromium manually
npx puppeteer browsers install chrome
```

---

## PROJECT COMPLETE ✅

You now have all the code needed to build the complete Study Programs Platform!

**Total Files Created:**

- 7 Configuration files
- 6 Database models
- 3 Services
- 10 API routes
- 3 Auth files
- 2 Scraper files
- 1 Utility script

**Next Steps:**

1. Create the project structure
2. Copy all files from this document
3. Copy your original scraper files
4. Install dependencies
5. Configure environment
6. Create admin user
7. Start developing!

Good luck! 🚀
