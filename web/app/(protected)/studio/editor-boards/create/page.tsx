'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  ImageIcon,
  Search,
  Settings,
  Upload,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const leadEditors = [
  { id: '1', name: 'Hana Nguyen' },
  { id: '2', name: 'Tuan Anh' },
  { id: '3', name: 'Linh K.' },
] as const;

const thresholdOptions = [
  { label: 'Single Approval', value: 'SINGLE' },
  { label: 'Two Approvals', value: 'TWO_APPROVALS' },
  { label: 'Lead Editor Approval', value: 'LEAD_EDITOR' },
] as const;

const deadlineOptions = [
  { label: '24 Hours', value: '24H' },
  { label: '48 Hours', value: '48H' },
  { label: '72 Hours', value: '72H' },
] as const;

const fieldClassName =
  'h-10 rounded-[4px] border-[#4b535f] bg-[#151c25] px-3 text-sm font-medium text-white placeholder:text-[#8b94a1] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20';

const labelClassName =
  'text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]';

export default function CreateEditorBoardPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leadEditorId, setLeadEditorId] = useState('1');
  const [logoUrl, setLogoUrl] = useState('');
  const [approvalThreshold, setApprovalThreshold] = useState('SINGLE');
  const [reviewDeadline, setReviewDeadline] = useState('24H');
  const [isActive, setIsActive] = useState(true);
  const [autoArchive, setAutoArchive] = useState(true);

  const canSubmit = name.trim().length > 0;
  const leadEditorName = leadEditors.find((editor) => editor.id === leadEditorId)?.name;

  return (
    <main className="min-h-screen bg-[#222831] text-[#eeeeee]">
      <header className="flex h-16 items-center justify-between border-b border-[#393E46] px-5">
        <div className="flex items-center gap-6">
          <img alt="Inkly" className="h-10 w-auto object-contain" src="/brand/1.png" />
          <span className="h-6 w-px bg-[#5b626d]" />
          <div className="hidden h-8 w-[320px] items-center gap-3 rounded-[4px] border border-[#4b535f] bg-[#393E46] px-3 text-[#aeb7c2] md:flex">
            <Search className="size-4 text-white" />
            <span className="text-xs">Search boards, editors...</span>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <button className="relative text-white" type="button">
            <Bell className="size-5" />
            <span className="absolute -right-0.5 -top-1 size-2 rounded-full bg-[#FFD369]" />
          </button>
          <Settings className="size-5 text-white" />
          <span className="grid size-8 place-items-center rounded-full border border-[#FFD369] bg-[#151c25] text-xs font-black text-white">
            TA
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-[1120px] px-8 py-8">
        <Link
          className="mb-7 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-[#8b94a1] hover:text-[#FFD369]"
          href="/studio"
        >
          <ArrowLeft className="size-4" />
          Back to Workspace
        </Link>

        <form className="overflow-hidden rounded-[7px] border border-[#393E46] bg-[#0c1219]">
          <div className="border-b border-[#393E46] px-8 py-7">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#FFD369]">
              Create Board
            </p>
            <h1 className="mt-2 text-[28px] font-bold leading-8 text-white">
              Create Editor Board
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-medium text-[#aeb7c2]">
              Set up an editorial review team, assign a lead editor, and configure approval rules
              for upcoming serializations.
            </p>
          </div>

          <div className="grid gap-8 px-8 py-8 lg:grid-cols-[1fr_320px]">
            <section className="space-y-6">
              <div className="space-y-2">
                <label className={labelClassName} htmlFor="board_name">
                  Board Name
                </label>
                <Input
                  className={fieldClassName}
                  id="board_name"
                  name="board_name"
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Weekly Shonen Review Alpha"
                  value={name}
                />
                <p className="text-[11px] font-bold text-[#8b94a1]">
                  This title will be visible to your workspace and project leads.
                </p>
              </div>

              <div className="space-y-2">
                <label className={labelClassName} htmlFor="description">
                  Board Description
                </label>
                <Textarea
                  className="min-h-[124px] rounded-[4px] border-[#4b535f] bg-[#151c25] px-3 py-3 text-sm font-medium text-white placeholder:text-[#8b94a1] focus-visible:border-[#FFD369] focus-visible:ring-[#FFD369]/20"
                  id="description"
                  name="description"
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Briefly describe the editorial focus and team goals..."
                  value={description}
                />
              </div>

              <div className="space-y-2">
                <label className={labelClassName}>Lead Editor</label>
                <Select onValueChange={setLeadEditorId} value={leadEditorId}>
                  <SelectTrigger className={`${fieldClassName} w-full`}>
                    <SelectValue placeholder="Select a Lead Editor..." />
                  </SelectTrigger>
                  <SelectContent className="border-[#4b535f] bg-[#151c25] text-white">
                    {leadEditors.map((editor) => (
                      <SelectItem key={editor.id} value={editor.id}>
                        {editor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className={labelClassName} htmlFor="logo_url">
                  Board Logo URL
                </label>
                <div className="rounded-[7px] border border-dashed border-[#5b626d] bg-[#070d14] p-5">
                  <div className="grid min-h-[132px] place-items-center rounded-[5px] border border-[#202832] bg-[#0b1118] text-center">
                    <div>
                      <span className="mx-auto grid size-10 place-items-center rounded-[7px] bg-[#27313d] text-[#dce7f3]">
                        <Upload className="size-5" />
                      </span>
                      <p className="mt-3 text-xs font-black text-white">Paste or upload a logo</p>
                      <p className="mt-1 text-[10px] font-bold text-[#8b94a1]">
                        JPG, PNG or SVG. Recommended: 1:1 ratio.
                      </p>
                    </div>
                  </div>
                  <div className="relative mt-3">
                    <ImageIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#8b94a1]" />
                    <Input
                      className={`${fieldClassName} pl-10`}
                      id="logo_url"
                      name="logo_url"
                      onChange={(event) => setLogoUrl(event.target.value)}
                      placeholder="https://images.example.com/editor-board-logo.svg"
                      type="url"
                      value={logoUrl}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={labelClassName}>Approval Threshold</label>
                  <Select onValueChange={setApprovalThreshold} value={approvalThreshold}>
                    <SelectTrigger className={`${fieldClassName} w-full`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[#4b535f] bg-[#151c25] text-white">
                      {thresholdOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className={labelClassName}>Review Deadline</label>
                  <Select onValueChange={setReviewDeadline} value={reviewDeadline}>
                    <SelectTrigger className={`${fieldClassName} w-full`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="border-[#4b535f] bg-[#151c25] text-white">
                      {deadlineOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelClassName}>Board Status</label>
                <div className="grid h-10 grid-cols-2 overflow-hidden rounded-[4px] border border-[#4b535f] bg-[#151c25] p-1">
                  <button
                    className={`rounded-[3px] text-xs font-bold ${
                      isActive ? 'bg-[#243b31] text-[#9df2c7]' : 'text-[#aeb7c2]'
                    }`}
                    onClick={() => setIsActive(true)}
                    type="button"
                  >
                    Active
                  </button>
                  <button
                    className={`rounded-[3px] text-xs font-bold ${
                      !isActive ? 'bg-[#30270d] text-[#ffd35b]' : 'text-[#aeb7c2]'
                    }`}
                    onClick={() => setIsActive(false)}
                    type="button"
                  >
                    Inactive
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-[#aeb7c2]">
                <Checkbox
                  checked={autoArchive}
                  className="border-[#4b535f] data-[state=checked]:border-[#FFD369] data-[state=checked]:bg-[#FFD369] data-[state=checked]:text-[#222831]"
                  onCheckedChange={(checked) => setAutoArchive(checked === true)}
                />
                Automatically archive completed reviews after 30 days
              </label>
            </section>

            <aside className="h-fit rounded-[7px] border border-[#393E46] bg-[#101820] p-5">
              <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#dce7f3]">
                Board Preview
              </p>
              <div className="mt-4 rounded-[7px] border border-[#393E46] bg-[#0b1118] p-4">
                <div className="flex items-center gap-3">
                  {logoUrl ? (
                    <img
                      alt=""
                      className="size-12 rounded-[6px] border border-[#393E46] object-cover"
                      src={logoUrl}
                    />
                  ) : (
                    <span className="grid size-12 place-items-center rounded-[6px] border border-[#393E46] bg-[#151c25] text-[#8b94a1]">
                      <ImageIcon className="size-5" />
                    </span>
                  )}
                  <div>
                    <h2 className="text-sm font-black text-white">{name || 'Untitled Board'}</h2>
                    <p className="mt-1 text-xs font-bold text-[#aeb7c2]">{leadEditorName}</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-xs font-bold">
                  <div className="rounded-[5px] border border-[#393E46] bg-[#151c25] p-3">
                    <p className="text-[#8b94a1]">Approval</p>
                    <p className="mt-1 text-white">
                      {
                        thresholdOptions.find((option) => option.value === approvalThreshold)
                          ?.label
                      }
                    </p>
                  </div>
                  <div className="rounded-[5px] border border-[#393E46] bg-[#151c25] p-3">
                    <p className="text-[#8b94a1]">Deadline</p>
                    <p className="mt-1 text-white">
                      {deadlineOptions.find((option) => option.value === reviewDeadline)?.label}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs font-bold">
                  <span className="text-[#8b94a1]">Status</span>
                  <span className={isActive ? 'text-[#9df2c7]' : 'text-[#ffd35b]'}>
                    {isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <dl className="mt-5 space-y-3 text-xs font-bold">
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#8b94a1]">DB base field</dt>
                  <dd className="text-white">name</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#8b94a1]">Extra fields</dt>
                  <dd className="text-white">ready to add</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#8b94a1]">Auto archive</dt>
                  <dd className="text-white">{autoArchive ? 'Enabled' : 'Disabled'}</dd>
                </div>
              </dl>
            </aside>
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-[#393E46] bg-[#101820] px-8 py-5">
            <Button
              asChild
              className="h-9 rounded-[4px] border-[#4b535f] bg-[#101820] px-5 text-xs font-black text-white hover:bg-[#393E46]"
              variant="outline"
            >
              <Link href="/studio">Cancel</Link>
            </Button>
            <Button
              className="h-9 rounded-[4px] bg-[#FFD369] px-5 text-xs font-black text-[#222831] hover:bg-[#eac04f]"
              disabled={!canSubmit}
              type="submit"
            >
              Create Board
              <ArrowRight className="size-4" />
            </Button>
          </footer>
        </form>
      </section>
    </main>
  );
}
