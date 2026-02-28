"use client"

import React, { useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { useLocale } from "next-intl";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends React.ComponentProps<"input"> { }


function PasswordInput({ value, onChange, ...props }: PasswordInputProps) {
    const [showPassword, setShowPassword] = useState(false);
    const locale = useLocale();
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };


    return (
        <div className="relative">
            <Input
                type={showPassword ? "text" : "password"}
                value={value}
                onChange={onChange}
                {...props}
            />
            <Button
                type="button"
                className={
                    cn("absolute w-6 h-6", {
                        "right-2 top-1/2 -translate-y-1/2": locale === "en",
                        "left-2 top-1/2 -translate-y-1/2": locale === "ar",
                    })
                }
                variant={"ghost"}
                onClick={togglePasswordVisibility}
            >
                {showPassword ? <EyeOff /> : <Eye />}
            </Button>
        </div>
    );
}

export { PasswordInput };