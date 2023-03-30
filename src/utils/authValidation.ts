import Joi from "joi";

// password validation
export interface PasswordErrors {
    noPasswordServer: boolean;
    noLength: boolean;
    noUppercase: boolean;
    noLowercase: boolean;
    noNumber: boolean;
    noSymbol: boolean;
}

export const passwordFormSchema = Joi.string()
    .pattern(new RegExp("^.{8,19}$"), "length")
    .pattern(new RegExp("[0-9]"), "number")
    .pattern(new RegExp("[a-z]"), "lowercase")
    .pattern(new RegExp("[A-Z]"), "uppercase")
    .pattern(new RegExp("[^a-zA-Z0-9s\n]"), "special");

export const checkPasswordErrors = (password: string): PasswordErrors => {
    let intErrors = {
        noPasswordServer: false,
        noLength: false,
        noUppercase: false,
        noLowercase: false,
        noNumber: false,
        noSymbol: false,
    };
    Object.keys(intErrors).forEach(
        (k) => (intErrors[k as keyof PasswordErrors] = false)
    );
    const validationRes = passwordFormSchema.validate(password, {
        abortEarly: false,
    });
    if (typeof validationRes.error === "undefined") {
        return intErrors;
    } else if (validationRes.error.details[0].type === "string.empty") {
        intErrors.noLength = true;
    } else {
        validationRes.error.details.forEach((d) => {
            if ((d.context?.name as string) === "length") {
                intErrors.noLength = true;
            }
            if ((d.context?.name as string) === "number") {
                intErrors.noNumber = true;
            }
            if ((d.context?.name as string) === "lowercase") {
                intErrors.noLowercase = true;
            }
            if ((d.context?.name as string) === "uppercase") {
                intErrors.noUppercase = true;
            }
            if ((d.context?.name as string) === "special") {
                intErrors.noSymbol = true;
            }
        });
    }
    return intErrors;
};

export const validatePassword = (errors: PasswordErrors): boolean => {
    for (const err in errors) {
        if (Object.prototype.hasOwnProperty.call(errors, err)) {
            if (errors[err as keyof PasswordErrors]) return false;
        }
    }
    return true;
};

// Email validation
export interface EmailErrors {
    noEmailServer: boolean;
    invalidEmailForm: boolean;
}

export const emailFormSchema = Joi.string().email({
    tlds: { allow: false },
});

export const checkEmailErrors = (email: string): EmailErrors => {
    let intErrors = {
        noEmailServer: false,
        invalidEmailForm: false,
    };
    Object.keys(intErrors).forEach(
        (k) => (intErrors[k as keyof EmailErrors] = false)
    );
    const validationRes = emailFormSchema.validate(email);
    if (typeof validationRes.error === "undefined") {
        return intErrors;
    } else {
        intErrors.invalidEmailForm = true;
        return intErrors;
    }
};

export const validateEmail = (errors: EmailErrors): boolean => {
    for (const err in errors) {
        if (Object.prototype.hasOwnProperty.call(errors, err)) {
            if (errors[err as keyof EmailErrors]) return false;
        }
    }
    return true;
};
