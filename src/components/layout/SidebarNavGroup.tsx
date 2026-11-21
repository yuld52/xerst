import type { RemixiconComponentType } from "@remixicon/react";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  icon: RemixiconComponentType;
  url: string;
}

interface SidebarNavGroupProps {
  items: NavItem[];
  currentPath: string;
  onNavigate: (url: string) => void;
}

export function SidebarNavGroup({ items, currentPath, onNavigate }: SidebarNavGroupProps) {
  return (
    <SidebarGroup className="p-0">
      <SidebarMenu className="gap-1">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              variant="neutral"
              isActive={currentPath === item.url}
              onClick={() => onNavigate(item.url)}
              className="cursor-pointer h-10 px-4 gap-3 text-sm font-medium rounded-lg transition-colors"
            >
              <item.icon className="size-5 shrink-0" />
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
