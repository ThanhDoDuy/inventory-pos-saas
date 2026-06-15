'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import {
  getActiveSectionId,
  getVisibleNavSections,
  isNavActive,
  resolveAppRole,
} from '@/lib/navigation';
import { useTranslation } from '@/lib/i18n/use-translation';
import { ChevronDown, LogOut, Menu, ShoppingCart, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const userRole = resolveAppRole(user);
  const sections = getVisibleNavSections(userRole);

  useEffect(() => {
    const activeSectionId = getActiveSectionId(pathname, sections);
    if (!activeSectionId) return;

    setExpandedSections((prev) => {
      if (prev.has(activeSectionId)) return prev;
      return new Set([...prev, activeSectionId]);
    });
  }, [pathname, sections]);

  useEffect(() => {
    if (sections.length === 0) return;
    setExpandedSections((prev) => {
      if (prev.size > 0) return prev;
      const activeSectionId = getActiveSectionId(pathname, sections);
      return new Set([activeSectionId ?? sections[0].id]);
    });
  }, [sections, pathname]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <>
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-card border-r border-border transition-transform duration-300 z-40 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <ShoppingCart className="w-6 h-6 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-foreground text-sm">{t('app.title')}</h1>
              <p className="text-xs text-muted-foreground truncate">{t('app.subtitle')}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {sections.map((section) => {
            const isExpanded = expandedSections.has(section.id);
            const hasActiveItem = section.items.some((item) =>
              isNavActive(pathname, item.href),
            );

            return (
              <div key={section.id} className="rounded-lg">
                <button
                  type="button"
                  onClick={() => toggleSection(section.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-left transition-colors ${
                    hasActiveItem
                      ? 'bg-secondary/80 text-foreground'
                      : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                  }`}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    {t(section.labelKey)}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`shrink-0 transition-transform duration-200 ${
                      isExpanded ? 'rotate-0' : '-rotate-90'
                    }`}
                  />
                </button>

                <div
                  className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
                    isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="space-y-0.5 pt-0.5 pb-1 pl-2">
                      {section.items.map((item) => {
                        const Icon = item.icon;
                        const active = isNavActive(pathname, item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              active
                                ? 'bg-primary text-primary-foreground'
                                : 'text-foreground hover:bg-secondary'
                            }`}
                          >
                            <Icon size={18} className="shrink-0" />
                            <span className="truncate">{t(item.labelKey)}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="shrink-0 border-t border-border p-4 space-y-3">
          <div className="p-3 bg-secondary rounded-lg">
            <p className="text-sm font-medium text-foreground truncate">{user?.username}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            {user?.tenantName && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{user.tenantName}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {user?.role?.name ?? userRole}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-destructive hover:bg-destructive/10 rounded-lg text-sm font-medium transition-colors"
          >
            <LogOut size={18} />
            <span>{t('common.logout')}</span>
          </button>
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
