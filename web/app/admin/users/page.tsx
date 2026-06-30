"use client";

import { useEffect, useState } from 'react';
import { Eye, KeyRound, MoreHorizontal, Search, Trash2 } from 'lucide-react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { ADMIN_ROLES } from '../data/admin-data';
import { ApiUser, getUsers } from '@/lib/users-api';

// Codex #admin-ui start
export default function AdminUsersPage() {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsers()
      .then((data) => setUsers(data))
      .catch((err) => console.error('Failed to fetch users', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        title="Users"
        description="Search, filter, and manage admin staff with role and status visibility."
        action={
          <Button className="bg-[#FFD369] text-[#222831] hover:bg-white">Create Staff</Button>
        }
      />

      <Card className="border-[#4A5260] bg-[#393E46] shadow-sm">
        <CardContent className="grid gap-3 pt-1 md:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8f9aa8]" />
            <Input
              className="h-10 border-[#4A5260] bg-[#393E46] pl-9 text-[#EEEEEE] placeholder:text-[#8f9aa8] focus-visible:border-[#FFD369] focus-visible:bg-[#414854] focus-visible:ring-[#FFD369]/20"
              placeholder="Search by name or email"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="h-10 w-full border-[#4A5260] bg-[#393E46] text-[#EEEEEE] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE]">
              <SelectItem value="all">All Roles</SelectItem>
              {ADMIN_ROLES.map((role) => (
                <SelectItem key={role.name} value={role.name}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="h-10 w-full border-[#4A5260] bg-[#393E46] text-[#EEEEEE] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE]">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="invited">Invited</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-[#4A5260] bg-[#0c1219] shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg text-[#EEEEEE]">Staff Table</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-[#1d242d]">
              <TableRow className="border-[#4b535f] hover:bg-[#1d242d]">
                <TableHead className="text-[#dce7f3]">Avatar</TableHead>
                <TableHead className="text-[#dce7f3]">Name</TableHead>
                <TableHead className="text-[#dce7f3]">Email</TableHead>
                <TableHead className="text-[#dce7f3]">Role</TableHead>
                <TableHead className="text-[#dce7f3]">Status</TableHead>
                <TableHead className="text-[#dce7f3]">Created Date</TableHead>
                <TableHead className="text-right text-[#dce7f3]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-[#aeb7c2] h-24">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-[#aeb7c2] h-24">
                    No users found.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="border-[#4b535f] bg-[#0b1118] hover:bg-[#202832]">
                    <TableCell>
                      <Avatar>
                        <AvatarFallback className="bg-[#393E46] text-[#EEEEEE]">
                          {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </TableCell>
                    <TableCell className="font-medium text-[#EEEEEE]">{user.displayName || 'Unknown'}</TableCell>
                    <TableCell className="text-[#aeb7c2]">{user.email}</TableCell>
                    <TableCell>
                      <Badge className="border-[#4A5260] bg-[#393E46] text-[#aeb7c2]" variant="outline">
                        {user.roles && user.roles.length > 0 ? user.roles[0].name : 'User'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={user.isActive ? 'Active' : 'Disabled'} />
                    </TableCell>
                    <TableCell className="text-[#aeb7c2]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <UserDetailModal user={user} />
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE] hover:border-[#FFD369] hover:bg-[#303640]"
                        >
                          <KeyRound className="size-3.5" />
                          Reset Password
                        </Button>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="size-3.5" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
// Codex #admin-ui end

// Codex #admin-ui start
function UserDetailModal({ user }: { user: ApiUser }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE] hover:border-[#FFD369] hover:bg-[#303640]"
        >
          <Eye className="size-3.5" />
          View
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full border-[#4A5260] bg-[#222831] text-[#EEEEEE] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#EEEEEE]">Staff Detail</DialogTitle>
          <DialogDescription className="text-[#aeb7c2]">
            Profile, roles, and recent activity for {user.displayName || user.email}.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 grid gap-6">
          <section>
            <h3 className="text-sm font-semibold text-[#EEEEEE]">Profile Information</h3>
            <div className="mt-3 rounded-lg border border-[#4A5260] bg-[#393E46] p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-[#FFD369] text-[#222831]">
                    {user.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-[#EEEEEE]">{user.displayName || 'Unknown'}</p>
                  <p className="text-sm text-[#aeb7c2]">{user.email}</p>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-[#EEEEEE]">Assigned Roles</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {user.roles && user.roles.length > 0 ? (
                user.roles.map((role) => (
                  <Badge key={role.id} className="bg-[#FFD369] text-[#222831]">
                    {role.name}
                  </Badge>
                ))
              ) : (
                <Badge className="bg-[#FFD369] text-[#222831]">User</Badge>
              )}
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-[#EEEEEE]">System Info</h3>
            <div className="mt-3 space-y-3 text-sm text-[#aeb7c2]">
              <p>Account status: {user.isActive ? 'Active' : 'Inactive'}</p>
              <p>Created on: {new Date(user.createdAt).toLocaleString()}</p>
              <p>Last updated: {new Date(user.updatedAt).toLocaleString()}</p>
            </div>
          </section>

          <Button
            variant="outline"
            className="w-full border-[#4A5260] bg-[#393E46] text-[#EEEEEE] hover:border-[#FFD369] hover:bg-[#303640]"
          >
            <MoreHorizontal className="size-4" />
            More Actions
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
// Codex #admin-ui end
