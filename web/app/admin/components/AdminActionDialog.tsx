'use client';

import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type AdminActionDialogField = {
  id: string;
  label: string;
  placeholder?: string;
  type?: 'email' | 'number' | 'password' | 'text' | 'textarea';
  defaultValue?: string;
};

type AdminActionDialogProps = {
  trigger: ReactNode;
  title: string;
  description: string;
  fields: AdminActionDialogField[];
  submitLabel?: string;
};

// Codex #admin-ui start
export function AdminActionDialog({
  trigger,
  title,
  description,
  fields,
  submitLabel = 'Save',
}: AdminActionDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="admin-dialog-content">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {fields.map((field) => (
            <div className="grid gap-2" key={field.id}>
              <Label htmlFor={field.id}>{field.label}</Label>
              {field.type === 'textarea' ? (
                <Textarea
                  className="admin-control min-h-24"
                  defaultValue={field.defaultValue}
                  id={field.id}
                  placeholder={field.placeholder}
                />
              ) : (
                <Input
                  className="admin-control"
                  defaultValue={field.defaultValue}
                  id={field.id}
                  placeholder={field.placeholder}
                  type={field.type ?? 'text'}
                />
              )}
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button className="admin-primary-button">{submitLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// Codex #admin-ui end
