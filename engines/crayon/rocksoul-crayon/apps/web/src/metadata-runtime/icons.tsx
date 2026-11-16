import { Box, Briefcase, Calendar, CheckSquare, CircleHelp, FileText, FolderKanban, LayoutDashboard, Mail, MessageCircle, Settings, Shield, Sparkles, Users, type LucideIcon } from 'lucide-react'
const icons: Record<string, LucideIcon> = { Box, Briefcase, Calendar, CheckSquare, CircleHelp, FileText, FolderKanban, LayoutDashboard, Mail, MessageCircle, Settings, Shield, Sparkles, Users }
export const resolveIcon = (name?: string): LucideIcon => name ? icons[name] ?? Box : Box
