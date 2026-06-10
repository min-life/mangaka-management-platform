'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Info, Save, Shield, ShieldCheck, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  deleteRole,
  getPermissions,
  getRole,
  updateRole,
  type ApiRole,
  type RoleScope,
} from '@/lib/roles-api';
import { FormField } from './components/form-field';
import { PermissionGroup } from './components/permission-group';
import { RoleDetailSidebar } from './components/role-detail-sidebar';
import { RoleDetailTopbar } from './components/role-detail-topbar';
import {
  companyOptions,
  permissionGroups,
  projectOptions,
  roleDetail,
  scopeOptions,
} from './const';

export default function RoleDetailPage() {
  const router = useRouter();
  const [role, setRole] = useState<ApiRole | null>(null);
  const [roleName, setRoleName] = useState(roleDetail.roleName);
  const [scope, setScope] = useState<RoleScope>('SYS');
  const [apiPermissionGroups, setApiPermissionGroups] = useState(permissionGroups);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const roleId = new URLSearchParams(window.location.search).get('roleId');

    if (!roleId) {
      queueMicrotask(() => {
        setError('Missing roleId in URL.');
        setIsLoading(false);
      });
      return;
    }

    let mounted = true;

    getRole(roleId)
      .then(async (data) => {
        if (!mounted) {
          return;
        }

        setRole(data);
        setRoleName(data.name);
        setScope(data.scope);
        setError('');

        try {
          const permissions = await getPermissions(data.scope);

          if (mounted && permissions.length > 0) {
            setApiPermissionGroups([
              {
                title: `${data.scope} Permissions`,
                permissions: permissions.map((permission) => ({
                  label: permission.name,
                  checked: false,
                })),
              },
            ]);
          }
        } catch {
          setApiPermissionGroups(permissionGroups);
        }
      })
      .catch(() => {
        if (mounted) {
          setError('Unable to load role detail from local API.');
        }
      })
      .finally(() => {
        if (mounted) {
          setIsLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  const visiblePermissionGroups = apiPermissionGroups.length
    ? apiPermissionGroups
    : permissionGroups;
  const leftPermissionGroups = useMemo(
    () => visiblePermissionGroups.slice(0, Math.ceil(visiblePermissionGroups.length / 2)),
    [visiblePermissionGroups],
  );
  const rightPermissionGroups = useMemo(
    () => visiblePermissionGroups.slice(Math.ceil(visiblePermissionGroups.length / 2)),
    [visiblePermissionGroups],
  );

  async function handleSave() {
    if (!role) {
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const updatedRole = await updateRole(role.id, {
        name: roleName.trim(),
        scope,
      });
      setRole(updatedRole);
      setRoleName(updatedRole.name);
      setScope(updatedRole.scope);
    } catch {
      setError('Unable to save role changes.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!role) {
      return;
    }

    setError('');

    try {
      await deleteRole(role.id);
      router.push('/role-management');
    } catch {
      setError('Unable to delete this role.');
    }
  }

  return (
    <div className="dark min-h-screen bg-[#0f0f0f] pb-24 text-[#ecdfe2]">
      <RoleDetailSidebar />
      <RoleDetailTopbar />

      <main className="ml-[260px] min-h-screen p-6 pb-32 pt-[72px]">
        <div className="mx-auto max-w-7xl">
          <section className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div className="flex flex-col gap-2">
              <a
                className="flex items-center gap-1 text-[12px] font-semibold uppercase leading-4 tracking-[0.05em] text-[#c4c7c7] transition-colors hover:text-[#e2e2e2]"
                href="/role-management"
              >
                <ArrowLeft className="size-[18px]" />
                Back to Roles
              </a>
              <h1 className="text-[32px] font-bold leading-10 tracking-normal text-[#e2e2e2]">
                Role Detail
              </h1>
            </div>

            <Button
              className="h-[36px] rounded-sm bg-[#ffb4ab] px-6 py-2 text-[12px] font-bold uppercase tracking-wider text-[#690005] hover:bg-[#ffb4ab]/90"
              disabled={!role}
              onClick={handleDelete}
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
          </section>

          <div className="grid grid-cols-1 gap-4">
            <Card className="rounded-sm border border-[#333333] bg-[#1b1b1b] p-6 py-6 text-[#ecdfe2] shadow-sm ring-0">
              <div className="mb-6 flex items-center gap-2 border-b border-[#444748] pb-4">
                <Info className="size-6 text-[#e2e2e2]" />
                <h2 className="text-[24px] font-semibold leading-8">Basic Information</h2>
              </div>

              <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2">
                <FormField label="Role Name">
                  <Input
                    className="h-[46px] rounded-sm border-[#333333] bg-[#120d0e] p-3 text-[14px] leading-5 text-[#ecdfe2] focus-visible:border-[#c6c6c6] focus-visible:ring-0"
                    disabled={isLoading}
                    onChange={(event) => setRoleName(event.target.value)}
                    placeholder="Enter role name"
                    value={roleName}
                  />
                </FormField>

                <FormField label="Role ID">
                  <Input
                    className="h-[46px] rounded-sm border-[#333333] bg-[#120d0e] p-3 text-[14px] leading-5 text-[#ecdfe2] focus-visible:border-[#c6c6c6] focus-visible:ring-0"
                    disabled
                    value={role ? `#${role.id}` : ''}
                  />
                </FormField>

                <FormField label="Scope">
                  <Select value={scope} onValueChange={(value) => setScope(value as RoleScope)}>
                    <SelectTrigger className="h-[46px] w-full rounded-sm border-[#333333] bg-[#120d0e] p-3 text-[14px] leading-5 text-[#ecdfe2] focus-visible:border-[#c6c6c6] focus-visible:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-sm border-[#333333] bg-[#1b1b1b] text-[#ecdfe2]">
                      {scopeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Company">
                  <Select value={role?.companyId ?? 'none'}>
                    <SelectTrigger className="h-[46px] w-full rounded-sm border-[#333333] bg-[#120d0e] p-3 text-[14px] leading-5 text-[#ecdfe2] focus-visible:border-[#c6c6c6] focus-visible:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-sm border-[#333333] bg-[#1b1b1b] text-[#ecdfe2]">
                      <SelectItem value="none">None</SelectItem>
                      {companyOptions.map((company) => (
                        <SelectItem key={company} value={company}>
                          {company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>

                <FormField label="Project">
                  <Select value={role?.projectId ?? 'none'}>
                    <SelectTrigger className="h-[46px] w-full rounded-sm border-[#333333] bg-[#120d0e] p-3 text-[14px] leading-5 text-[#ecdfe2] focus-visible:border-[#c6c6c6] focus-visible:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-sm border-[#333333] bg-[#1b1b1b] text-[#ecdfe2]">
                      <SelectItem value="none">None</SelectItem>
                      {projectOptions.map((project) => (
                        <SelectItem key={project} value={project}>
                          {project}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              {error ? <p className="mt-4 text-[12px] leading-4 text-[#ffb4ab]">{error}</p> : null}
            </Card>

            <Card className="rounded-sm border border-[#333333] bg-[#1b1b1b] p-6 py-6 text-[#ecdfe2] shadow-sm ring-0">
              <div className="mb-8 flex items-center gap-2 border-b border-[#444748] pb-4">
                <Shield className="size-6 text-[#e2e2e2]" />
                <h2 className="text-[24px] font-semibold leading-8">Role Permissions</h2>
              </div>

              <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                <div className="flex flex-col gap-8">
                  {leftPermissionGroups.map((group) => (
                    <PermissionGroup
                      key={group.title}
                      permissions={group.permissions}
                      title={group.title}
                    />
                  ))}
                </div>
                <div className="flex flex-col gap-8">
                  {rightPermissionGroups.map((group) => (
                    <PermissionGroup
                      key={group.title}
                      permissions={group.permissions}
                      title={group.title}
                    />
                  ))}
                </div>
              </div>
            </Card>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Card className="rounded-sm border border-[#333333] bg-[#1b1b1b] p-6 py-6 shadow-sm ring-0 md:col-span-2">
                <div
                  aria-label="Manga Production Overview"
                  className="h-48 w-full rounded-sm bg-cover bg-center opacity-60 grayscale transition-all duration-700 hover:grayscale-0"
                  role="img"
                  style={{ backgroundImage: `url(${roleDetail.productionImage})` }}
                />
              </Card>

              <Card className="flex items-center justify-center gap-4 rounded-sm border border-dashed border-[#e2e2e2]/20 bg-[#1b1b1b] p-6 py-6 text-center shadow-sm ring-0">
                <ShieldCheck className="size-12 text-[#e2e2e2]/40" />
                <div>
                  <p className="text-[12px] font-semibold uppercase leading-4 tracking-[0.05em] text-[#c4c7c7]">
                    Current Status
                  </p>
                  <p className="text-[24px] font-bold leading-8 text-emerald-400">
                    {roleDetail.status}
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 left-0 z-50 flex h-16 w-full items-center justify-center border border-[#333333] bg-[rgba(27,27,27,0.8)] px-6 backdrop-blur-xl">
        <div className="flex w-full max-w-7xl items-center justify-end gap-4">
          <Button
            className="h-[36px] rounded-sm px-6 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#c4c7c7] hover:text-[#e2e2e2]"
            variant="ghost"
            onClick={() => router.push('/role-management')}
          >
            Cancel
          </Button>
          <Button
            className="h-[36px] rounded-sm bg-[#e2e2e2] px-8 py-2 text-[12px] font-bold uppercase tracking-wider text-[#2f3131] shadow-lg shadow-black/20 hover:bg-[#e2e2e2]/90"
            disabled={!role || isSaving}
            onClick={handleSave}
          >
            <Save className="size-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </footer>
    </div>
  );
}
