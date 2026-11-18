"use client";

import * as React from "react";
import { cn } from "../../lib/utils";
import type { SkinName } from "../../skin/compositions";
import { Field, FieldControl, FieldDescription, FieldError, FieldLabel } from "./field";
import { useComponentSkin } from "./skin-adapter";

export type FormErrors = Record<string, string | undefined>;

interface FormContextValue {
  errors: FormErrors;
  getError: (name: string) => string | undefined;
}

const FormContext = React.createContext<FormContextValue>({
  errors: {},
  getError: () => undefined,
});

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  errors?: FormErrors;
  skin?: SkinName;
}

const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, errors = {}, skin, ...props }, ref) => {
    const { skin: resolvedSkin, dnaId } = useComponentSkin(skin);
    const value = React.useMemo<FormContextValue>(
      () => ({
        errors,
        getError: (name: string) => errors[name],
      }),
      [errors],
    );
    return (
      <FormContext.Provider value={value}>
        <form
          ref={ref}
          data-skin={resolvedSkin}
          data-dna={dnaId}
          className={cn("space-y-4", className)}
          {...props}
        />
      </FormContext.Provider>
    );
  },
);
Form.displayName = "Form";

export interface FormFieldProps {
  name: string;
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: string;
  children: React.ReactElement;
  className?: string;
}

function FormField({ name, label, description, error, children, className }: FormFieldProps) {
  const form = React.useContext(FormContext);
  const resolvedError = error ?? form.getError(name);
  return (
    <Field error={resolvedError} className={className}>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <FieldControl>{children}</FieldControl>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
    </Field>
  );
}

const FormItem = Field;
const FormLabel = FieldLabel;
const FormControl = FieldControl;
const FormDescription = FieldDescription;
const FormMessage = FieldError;

export { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage };
