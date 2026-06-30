"use client";

import { useEffect, useState } from 'react';
import { Pencil, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { PageHeader } from '../components/PageHeader';
import { PERMISSION_ACTIONS, PERMISSION_RESOURCES } from '../data/admin-data';
import { ApiRole, getRoles } from '@/lib/roles-api';

// Codex #admin-ui start
export default function AdminRolesPage() {
  const [roles, setRoles] = useState<ApiRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRoles('SYS')
      .then((data) => setRoles(data))
      .catch((err) => console.error('Failed to fetch roles', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        title="Roles"
        description="Manage default admin roles and review permission coverage across key resources."
        action={<CreateRoleDialog />}
      />

      <section className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="border-[#4A5260] bg-[#393E46] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#EEEEEE]">Role List</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {loading ? (
              <div className="text-[#aeb7c2]">Loading roles...</div>
            ) : roles.length === 0 ? (
              <div className="text-[#aeb7c2]">No roles found.</div>
            ) : (
              roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-start justify-between gap-4 rounded-lg border border-[#4A5260] bg-[#0c1219] p-4"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold text-[#EEEEEE]">{role.name}</h2>
                      <Badge className="border-[#4A5260] text-[#aeb7c2]" variant="outline">
                        {role.scope}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[#aeb7c2]">
                      Created: {new Date(role.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE] hover:border-[#FFD369] hover:bg-[#303640]"
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-[#4A5260] bg-[#0c1219] shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-[#EEEEEE]">Permission Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader className="bg-[#1d242d]">
                <TableRow className="border-[#4b535f] hover:bg-[#1d242d]">
                  <TableHead className="text-[#dce7f3]">Resource</TableHead>
                  {PERMISSION_ACTIONS.map((action) => (
                    <TableHead key={action} className="text-center text-[#dce7f3]">
                      {action}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {PERMISSION_RESOURCES.map((resource, rowIndex) => (
                  <TableRow key={resource} className="border-[#4b535f] bg-[#0b1118] hover:bg-[#202832]">
                    <TableCell className="font-medium text-[#EEEEEE]">{resource}</TableCell>
                    {PERMISSION_ACTIONS.map((action, actionIndex) => (
                      <TableCell key={`${resource}-${action}`} className="text-center">
                        <Checkbox
                          defaultChecked={rowIndex < 2 || actionIndex === 1}
                          aria-label={`${action} ${resource}`}
                          className="mx-auto data-checked:border-[#FFD369] data-checked:bg-[#FFD369] data-checked:text-[#222831]"
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
// Codex #admin-ui end

// Codex #admin-ui start
function CreateRoleDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-[#FFD369] text-[#222831] hover:bg-white">
          <Plus className="size-4" />
          Create Role
        </Button>
      </DialogTrigger>
      <DialogContent className="border-[#4A5260] bg-[#222831] text-[#EEEEEE]">
        <DialogHeader>
          <DialogTitle className="text-[#EEEEEE]">Create Role</DialogTitle>
          <DialogDescription className="text-[#aeb7c2]">
            Add a new admin role for platform access control.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="role-name">Role Name</Label>
            <Input
              id="role-name"
              placeholder="Custom Admin Role"
              className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE] placeholder:text-[#8f9aa8] focus-visible:border-[#FFD369] focus-visible:bg-[#414854] focus-visible:ring-[#FFD369]/20"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="role-description">Description</Label>
            <Input
              id="role-description"
              placeholder="Describe this role"
              className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE] placeholder:text-[#8f9aa8] focus-visible:border-[#FFD369] focus-visible:bg-[#414854] focus-visible:ring-[#FFD369]/20"
            />
          </div>
        </div>
        <DialogFooter>
          <Button className="bg-[#FFD369] text-[#222831] hover:bg-white">Save Role</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
// Codex #admin-ui end
