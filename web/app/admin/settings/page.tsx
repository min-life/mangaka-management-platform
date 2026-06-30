import { Image as ImageIcon, LockKeyhole, Save, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

import { PageHeader } from '../components/PageHeader';

// Codex #admin-ui start
export default function AdminSettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure platform identity, security defaults, and authentication options."
        action={
          <Button className="bg-[#FFD369] text-[#222831] hover:bg-white">
            <Save className="size-4" />
            Save Changes
          </Button>
        }
      />

      <section className="grid gap-4">
        <Card className="border-[#4A5260] bg-[#393E46] shadow-sm">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-[#FFD369] text-[#222831]">
              <ImageIcon className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg text-[#EEEEEE]">General Settings</CardTitle>
              <p className="mt-1 text-sm text-[#aeb7c2]">Platform name and logo shown in admin UI.</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="platform-name">Platform Name</Label>
              <Input
                id="platform-name"
                defaultValue="MangaStudio"
                className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE] focus-visible:border-[#FFD369] focus-visible:bg-[#414854] focus-visible:ring-[#FFD369]/20"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="platform-logo">Platform Logo</Label>
              <div className="flex gap-2">
                <Input
                  id="platform-logo"
                  defaultValue="BookOpen"
                  className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE] focus-visible:border-[#FFD369] focus-visible:bg-[#414854] focus-visible:ring-[#FFD369]/20"
                />
                <Button
                  variant="outline"
                  className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE] hover:border-[#FFD369] hover:bg-[#303640]"
                >
                  Upload
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#4A5260] bg-[#393E46] shadow-sm">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-[#0c1219] text-[#FFD369]">
              <LockKeyhole className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg text-[#EEEEEE]">Security Settings</CardTitle>
              <p className="mt-1 text-sm text-[#aeb7c2]">Session timeout and password requirements.</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-2">
            <div className="grid gap-2">
              <Label>Session Timeout</Label>
              <Select defaultValue="30">
                <SelectTrigger className="w-full border-[#4A5260] bg-[#393E46] text-[#EEEEEE] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20">
                  <SelectValue placeholder="Session timeout" />
                </SelectTrigger>
                <SelectContent className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE]">
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">1 hour</SelectItem>
                  <SelectItem value="240">4 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Password Policy</Label>
              <Select defaultValue="standard">
                <SelectTrigger className="w-full border-[#4A5260] bg-[#393E46] text-[#EEEEEE] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20">
                  <SelectValue placeholder="Password policy" />
                </SelectTrigger>
                <SelectContent className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE]">
                  <SelectItem value="standard">Standard: 8+ chars</SelectItem>
                  <SelectItem value="strict">Strict: 12+ chars and symbols</SelectItem>
                  <SelectItem value="enterprise">Enterprise: rotation required</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#4A5260] bg-[#393E46] shadow-sm">
          <CardHeader className="flex flex-row items-start gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-[#0c1219] text-[#FFD369]">
              <Shield className="size-5" />
            </div>
            <div>
              <CardTitle className="text-lg text-[#EEEEEE]">Authentication Settings</CardTitle>
              <p className="mt-1 text-sm text-[#aeb7c2]">Login methods and verification controls.</p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-5">
            <div className="grid gap-2 md:grid-cols-[220px_1fr] md:items-center">
              <div>
                <Label>Login Methods</Label>
                <p className="mt-1 text-sm text-[#aeb7c2]">Enabled methods for admin sign in.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="border-[#FFD369] bg-[#FFD369]/25 text-[#222831]">
                  Email/Password
                </Button>
                <Button
                  variant="outline"
                  className="border-[#4A5260] bg-[#393E46] text-[#EEEEEE] hover:border-[#FFD369] hover:bg-[#303640]"
                >
                  Google SSO
                </Button>
              </div>
            </div>
            <div className="grid gap-2 rounded-lg border border-[#4A5260] bg-[#0c1219] p-4 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <Label htmlFor="email-verification">Email Verification Toggle</Label>
                <p className="mt-1 text-sm text-[#aeb7c2]">Require new staff to verify email before access.</p>
              </div>
              <Switch
                id="email-verification"
                defaultChecked
                className="data-checked:bg-[#FFD369] [&_[data-slot=switch-thumb]]:data-checked:bg-[#222831]"
              />
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
// Codex #admin-ui end
