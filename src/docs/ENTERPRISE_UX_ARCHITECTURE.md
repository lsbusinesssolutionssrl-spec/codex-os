# Codex OS - Enterprise UX Architecture

## Overview

Premium enterprise UX design system inspired by Salesforce, ServiceNow, Monday Enterprise, HubSpot, and Stripe Developer Platform.

---

## 1. Design Philosophy

### 1.1 Core Principles

**Modular:**
- Composable UI components
- Configurable layouts
- Plugin-based features
- Widget-based dashboards
- Customizable workflows

**Scalable:**
- Consistent patterns at any scale
- Performance-first design
- Progressive disclosure
- Efficient navigation for large datasets
- Multi-workspace support

**Extensible:**
- API-first UI components
- Extension points throughout
- Custom field support
- Webhook UI builders
- Embedded third-party apps

**Premium:**
- Polished micro-interactions
- Smooth animations (60fps)
- Thoughtful empty states
- Delightful loading states
- Professional typography

**Ecosystem-Driven:**
- Marketplace integration
- App switching
- Unified notifications
- Cross-app search
- Shared components

---

## 2. Visual Design System

### 2.1 Color Palette

```css
/* Primary - Codex Blue */
--codex-blue-50: #E8F0FE;
--codex-blue-100: #D0E0FD;
--codex-blue-200: #A5C1FA;
--codex-blue-300: #7BA2F7;
--codex-blue-400: #5B8AF4;
--codex-blue-500: #3B72F1; /* Primary */
--codex-blue-600: #3366E6;
--codex-blue-700: #2954D4;
--codex-blue-800: #2344BD;
--codex-blue-900: #1A3299;

/* Enterprise Navy */
--enterprise-navy-50: #F0F4F8;
--enterprise-navy-100: #D9E2EC;
--enterprise-navy-200: #BCCCDC;
--enterprise-navy-300: #9FB3C8;
--enterprise-navy-400: #829AB1;
--enterprise-navy-500: #627D98;
--enterprise-navy-600: #486581;
--enterprise-navy-700: #334E68; /* Primary Dark */
--enterprise-navy-800: #243B53;
--enterprise-navy-900: #102A43;

/* Success - Green */
--success-50: #F6FEF9;
--success-500: #12B76A;
--success-700: #079455;

/* Warning - Amber */
--warning-50: #FFFAEB;
--warning-500: #F79009;
--warning-700: #B5470D;

/* Error - Red */
--error-50: #FEF3F2;
--error-500: #F04438;
--error-700: #B42318;

/* Neutral Grays */
--gray-25: #FCFCFD;
--gray-50: #F9FAFB;
--gray-100: #F2F4F7;
--gray-200: #E4E7EC;
--gray-300: #D0D5DD;
--gray-400: #98A2B3;
--gray-500: #667085;
--gray-600: #475467;
--gray-700: #344054;
--gray-800: #1D2939;
--gray-900: #101828;
```

### 2.2 Typography

```css
/* Primary Font: Inter (Clean, Professional) */
--font-inter: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Headings */
--heading-2xl: 30px/38px; /* Bold */
--heading-xl: 24px/32px; /* Bold */
--heading-lg: 20px/30px; /* SemiBold */
--heading-md: 18px/28px; /* SemiBold */
--heading-sm: 16px/24px; /* SemiBold */

/* Body */
--body-lg: 16px/24px; /* Regular */
--body-md: 14px/20px; /* Regular */
--body-sm: 13px/20px; /* Regular */

/* Utility */
--caption: 12px/18px; /* Regular */
--overline: 11px/16px; /* SemiBold, Uppercase */
--mono: 13px/20px; /* JetBrains Mono (code) */
```

### 2.3 Spacing System

```css
/* 4px Base Grid */
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-7: 28px;
--space-8: 32px;
--space-9: 36px;
--space-10: 40px;
--space-12: 48px;
--space-14: 56px;
--space-16: 64px;
--space-20: 80px;
--space-24: 96px;
```

### 2.4 Elevation & Shadows

```css
/* Subtle elevation for cards */
--shadow-xs: 0 1px 2px rgba(16, 24, 40, 0.05);
--shadow-sm: 0 1px 3px rgba(16, 24, 40, 0.1), 0 1px 2px rgba(16, 24, 40, 0.06);
--shadow-md: 0 4px 8px rgba(16, 24, 40, 0.1), 0 2px 4px rgba(16, 24, 40, 0.06);
--shadow-lg: 0 12px 24px rgba(16, 24, 40, 0.1), 0 4px 8px rgba(16, 24, 40, 0.06);
--shadow-xl: 0 20px 40px rgba(16, 24, 40, 0.12), 0 8px 16px rgba(16, 24, 40, 0.08);

/* Interactive states */
--shadow-focus: 0 0 0 3px rgba(59, 114, 241, 0.2);
--shadow-active: 0 1px 2px rgba(16, 24, 40, 0.08), inset 0 1px 2px rgba(16, 24, 40, 0.1);
```

### 2.5 Border Radius

```css
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
--radius-2xl: 16px;
--radius-full: 9999px;
```

---

## 3. Component Library

### 3.1 Enterprise Components

**Data Grid (Advanced Table)**
```jsx
// features:
- Virtual scrolling (10K+ rows)
- Column resizing, reordering, pinning
- Advanced filtering (multi-condition)
- Bulk actions
- Inline editing
- Export (CSV, Excel, PDF)
- Saved views
- Column customization
- Grouping & aggregation
- Pivot tables

// Example usage
<EnterpriseDataGrid
  data={projects}
  columns={projectColumns}
  features={[
    'virtualScroll',
    'columnResize',
    'columnPin',
    'advancedFilter',
    'bulkActions',
    'inlineEdit',
    'savedViews',
    'export',
    'grouping',
  ]}
  onRowClick={(row) => navigate(`/projects/${row.id}`)}
  onBulkAction={(action, rows) => handleBulk(action, rows)}
  savedViewsKey="projects-views"
/>
```

**Command Palette**
```jsx
// Global search + actions (Cmd+K)
<CommandPalette
  triggers={['mod+k', '/']}
  sections={[
    {
      title: 'Navigation',
      items: [
        { label: 'Dashboard', icon: Dashboard, shortcut: 'G D', action: () => navigate('/') },
        { label: 'Projects', icon: Folder, shortcut: 'G P', action: () => navigate('/projects') },
      ]
    },
    {
      title: 'Actions',
      items: [
        { label: 'Create Project', icon: Plus, action: () => openCreateProject() },
        { label: 'Create Estimate', icon: FileText, action: () => openCreateEstimate() },
      ]
    },
    {
      title: 'Recent',
      items: recentItems.map(item => ({
        label: item.name,
        icon: getIcon(item.type),
        action: () => navigate(item.path),
      }))
    }
  ]}
/>
```

**Quick Actions Bar**
```jsx
// Contextual actions (like Stripe)
<QuickActions
  context="project"
  actions={[
    { label: 'Edit', icon: Edit, action: editProject },
    { label: 'Duplicate', icon: Copy, action: duplicateProject },
    { label: 'Generate Report', icon: FileText, action: generateReport },
    { label: 'Share', icon: Share, action: shareProject },
    { label: 'Archive', icon: Archive, action: archiveProject, variant: 'destructive' },
  ]}
  dropdownActions={[
    { label: 'Export Data', action: exportData },
    { label: 'View Audit Log', action: viewAuditLog },
  ]}
/>
```

**Status Badge (Advanced)**
```jsx
<StatusBadge
  status="in_progress"
  variant="solid" // solid | outline | subtle
  size="md" // sm | md | lg
  showDot
  animate={isLive}
  tooltip="Work in progress"
/>

// Status configurations
const statusConfig = {
  // Project statuses
  lead: { color: 'gray', label: 'Lead', icon: null },
  survey: { color: 'blue', label: 'Survey', icon: Clipboard },
  estimate: { color: 'blue', label: 'Estimate', icon: FileText },
  approved: { color: 'green', label: 'Approved', icon: CheckCircle },
  in_progress: { color: 'blue', label: 'In Progress', icon: Clock },
  testing: { color: 'amber', label: 'Testing', icon: Beaker },
  delivered: { color: 'green', label: 'Delivered', icon: CheckCircle2 },
  guardian_active: { color: 'purple', label: 'Guardian Active', icon: Shield },
  archived: { color: 'gray', label: 'Archived', icon: Archive },
  
  // Priority badges
  low: { color: 'gray', label: 'Low' },
  medium: { color: 'blue', label: 'Medium' },
  high: { color: 'amber', label: 'High' },
  urgent: { color: 'red', label: 'Urgent', animate: true },
};
```

**Avatar Stack**
```jsx
<AvatarStack
  users={project.team_members}
  max={4}
  size="md"
  showTooltip
  onOverflowClick={(remaining) => openTeamModal(remaining)}
/>

// With add button
<AvatarStack
  users={team}
  showAdd
  onAdd={() => openAddMember()}
/>
```

**Activity Timeline**
```jsx
<ActivityTimeline
  activities={projectActivities}
  groupBy="day" // day | week | month | user
  showAvatars
  collapsible
  loadMore={() => loadMoreActivities()}
  onActivityClick={(activity) => openActivityDetail(activity)}
/>

// Activity item
<ActivityItem
  type="status_change"
  user={activity.user}
  timestamp={activity.created_date}
  description={<>Changed status from <Badge>Estimate</Badge> to <Badge>Approved</Badge></>}
  metadata={{ ip: activity.ip_address, location: 'Rome, IT' }}
/>
```

**Empty States (Premium)**
```jsx
<EmptyState
  variant="illustration" // illustration | simple | minimal
  icon={FolderOpen}
  title="No projects yet"
  description="Get started by creating your first project. You can also import from a template."
  primaryAction={{
    label: 'Create Project',
    icon: Plus,
    action: () => openCreateProject(),
    variant: 'primary',
  }}
  secondaryAction={{
    label: 'Import Template',
    icon: Download,
    action: () => openTemplateLibrary(),
    variant: 'outline',
  }}
  links={[
    { label: 'Learn about projects', href: '/docs/projects' },
    { label: 'Watch tutorial', href: '/tutorials/projects' },
  ]}
/>
```

**Loading States**
```jsx
// Skeleton loaders
<Skeleton className="h-32 w-full rounded-xl" />
<Skeleton className="h-4 w-3/4" />
<Skeleton className="h-4 w-1/2" />

// Content loader
<ContentLoader
  speed={2}
  backgroundColor="#F2F4F7"
  foregroundColor="#FFFFFF"
>
  <rect x="0" y="0" width="100%" height="200" rx="12" />
  <rect x="0" y="220" width="60%" height="16" rx="4" />
  <rect x="0" y="244" width="40%" height="16" rx="4" />
</ContentLoader>

// Optimistic loading
<OptimisticList
  items={items}
  isLoading={isFetching}
  skeleton={<ItemSkeleton />}
  empty={<EmptyState />}
>
  {items.map(item => <ItemCard key={item.id} item={item} />)}
</OptimisticList>
```

### 3.2 Form Components

**Smart Input**
```jsx
<SmartInput
  label="Project Name"
  value={form.title}
  onChange={(value) => setForm({ ...form, title: value })}
  placeholder="Enter project name"
  required
  autoFocus
  autoComplete="off"
  features={[
    'clearButton',
    'characterCount',
    'suggestions',
    'validation',
  ]}
  suggestions={projectNameSuggestions}
  validation={{
    minLength: 3,
    maxLength: 100,
    pattern: /^[a-zA-Z0-9\s-]+$/,
  }}
  error={errors.title}
/>
```

**Advanced Select**
```jsx
<AdvancedSelect
  label="Client"
  value={form.client_id}
  onChange={(value) => setForm({ ...form, client_id: value })}
  options={clients.map(c => ({ value: c.id, label: c.name, meta: c.email }))}
  searchable
  creatable
  onCreate={(query) => handleCreateClient(query)}
  groupBy="type"
  renderOption={(option) => (
    <div className="flex items-center gap-3">
      <Avatar name={option.label} size="sm" />
      <div>
        <div className="font-medium">{option.label}</div>
        <div className="text-sm text-gray-500">{option.meta}</div>
      </div>
    </div>
  )}
/>
```

**Date Range Picker**
```jsx
<DateRangePicker
  value={dateRange}
  onChange={setDateRange}
  presets={[
    { label: 'Last 7 days', value: last7Days },
    { label: 'Last 30 days', value: last30Days },
    { label: 'This month', value: thisMonth },
    { label: 'This quarter', value: thisQuarter },
    { label: 'This year', value: thisYear },
  ]}
  shortcuts
  showTimeSelect
  timezone="Europe/Rome"
/>
```

**File Upload (Drag & Drop)**
```jsx
<FileUpload
  accept={['image/*', '.pdf', '.doc', '.docx']}
  multiple
  maxSize={10 * 1024 * 1024} // 10MB
  onUpload={handleUpload}
  preview
  progress
  features={[
    'dragDrop',
    'paste',
    'camera',
    'progress',
    'preview',
    'retry',
  ]}
/>
```

---

## 4. Layout Patterns

### 4.1 App Shell

```jsx
<AppShell
  header={
    <TopNav
      logo={<CodexLogo />}
      search={<GlobalSearch />}
      actions={
        <>
          <NotificationBell />
          <HelpMenu />
          <UserMenu />
        </>
      }
      brandSelector={<BrandSelector />}
    />
  }
  sidebar={
    <Sidebar
      navigation={mainNav}
      collapsible
      variant="fixed" // fixed | floating | push
      width={280}
      footer={
        <>
          <UpgradeBanner />
          <VersionInfo />
        </>
      }
    />
  }
  secondarySidebar={
    <ContextSidebar
      context={currentPage}
      quickActions={contextActions}
      recentItems={recentItems}
    />
  }
>
  <PageContent />
</AppShell>
```

### 4.2 Dashboard Layout

```jsx
<DashboardLayout
  header={
    <DashboardHeader
      title="Project Overview"
      description="Track your project performance and metrics"
      actions={
        <>
          <DateRangePicker />
          <ExportButton />
          <CustomizeButton />
        </>
      }
    />
  }
  widgets={[
    { id: 'kpi-summary', component: <KPISummary />, size: 'full' },
    { id: 'chart-revenue', component: <RevenueChart />, size: 'large' },
    { id: 'chart-projects', component: <ProjectTrends />, size: 'large' },
    { id: 'list-recent', component: <RecentProjects />, size: 'medium' },
    { id: 'list-tasks', component: <UpcomingTasks />, size: 'medium' },
    { id: 'chart-team', component: <TeamWorkload />, size: 'small' },
    { id: 'chart-status', component: <StatusDistribution />, size: 'small' },
  ]}
  editable
  saveLayout
/>
```

### 4.3 Detail Page Layout

```jsx
<DetailPageLayout
  header={
    <PageHeader
      breadcrumb={breadcrumb}
      title={project.title}
      subtitle={project.client_name}
      avatar={<ProjectAvatar />}
      status={<StatusBadge status={project.status} />}
      actions={
        <>
          <QuickActions />
          <PrimaryAction label="Edit" action={editProject} />
        </>
      }
      tabs={tabs}
    />
  }
  content={
    <TwoColumnLayout
      main={
        <>
          <Section title="Overview">
            <ProjectDetails />
          </Section>
          <Section title="Timeline">
            <ProjectTimeline />
          </Section>
          <Section title="Documents">
            <DocumentList />
          </Section>
        </>
      }
      sidebar={
        <>
          <Card title="Properties">
            <PropertyList />
          </Card>
          <Card title="Team Members">
            <TeamList />
          </Card>
          <Card title="Activity">
            <ActivityFeed />
          </Card>
        </>
      }
    />
  }
/>
```

### 4.4 Workspace Layout

```jsx
<WorkspaceLayout
  workspaces={[
    { id: 'projects', label: 'Projects', icon: Folder, count: 45 },
    { id: 'estimates', label: 'Estimates', icon: FileText, count: 23 },
    { id: 'clients', label: 'Clients', icon: Users, count: 67 },
    { id: 'guardian', label: 'Guardian', icon: Shield, count: 34 },
  ]}
  activeWorkspace="projects"
  onSwitch={(workspace) => navigate(`/${workspace}`)}
  canCreate
  onCreate={(workspace) => handleCreateWorkspace(workspace)}
/>
```

---

## 5. Navigation Patterns

### 5.1 Global Navigation

```jsx
<GlobalNav
  items={[
    { 
      label: 'Dashboard', 
      icon: LayoutDashboard, 
      path: '/',
      shortcut: 'G D',
      badge: null,
    },
    { 
      label: 'Projects', 
      icon: FolderKanban, 
      path: '/projects',
      shortcut: 'G P',
      badge: projects.length,
      children: [
        { label: 'All Projects', path: '/projects' },
        { label: 'Active', path: '/projects?status=active' },
        { label: 'Archived', path: '/projects?status=archived' },
      ]
    },
    { 
      label: 'Estimates', 
      icon: FileText, 
      path: '/estimates',
      shortcut: 'G E',
      badge: estimates.length,
    },
    { 
      label: 'Clients', 
      icon: Users, 
      path: '/clients',
      shortcut: 'G C',
    },
    { 
      label: 'Guardian', 
      icon: Shield, 
      path: '/guardian',
      shortcut: 'G G',
      premium: true,
    },
    { 
      label: 'AI', 
      icon: Bot, 
      path: '/ai',
      shortcut: 'G A',
      beta: true,
    },
  ]}
  footer={
    <>
      <NavItem label="Settings" icon: Settings path="/settings" />
      <UpgradePrompt />
    </>
  }
/>
```

### 5.2 Breadcrumb Navigation

```jsx
<Breadcrumb
  items={[
    { label: 'Projects', path: '/projects' },
    { label: 'Active', path: '/projects?status=active' },
    { label: 'Villa Rosa', path: '/projects/123', current: true },
  ]}
  actions={
    <>
      <BreadcrumbAction icon: Edit action={editProject} />
      <BreadcrumbAction icon: MoreVertical action={openMenu} />
    </>
  }
/>
```

### 5.3 Tab Navigation

```jsx
<TabNavigation
  variant="underline" // underline | pills | enclosed
  tabs={[
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'timeline', label: 'Timeline', icon: Clock, badge: 5 },
    { id: 'documents', label: 'Documents', icon: FileText, count: 23 },
    { id: 'financial', label: 'Financial', icon: DollarSign, premium: true },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]}
  activeTab={activeTab}
  onChange={setActiveTab}
  scrollable
/>
```

---

## 6. Premium Features

### 6.1 Keyboard Shortcuts

```javascript
// Global shortcuts
const shortcuts = {
  // Navigation
  'G D': 'Go to Dashboard',
  'G P': 'Go to Projects',
  'G E': 'Go to Estimates',
  'G C': 'Go to Clients',
  'G G': 'Go to Guardian',
  'G A': 'Go to AI',
  
  // Actions
  'N P': 'New Project',
  'N E': 'New Estimate',
  'N C': 'New Client',
  'N T': 'New Ticket',
  
  // Search
  'Cmd+K': 'Command Palette',
  'Cmd+F': 'Search in page',
  '/': 'Quick search',
  
  // UI
  'Cmd+B': 'Toggle sidebar',
  'Cmd+J': 'Toggle notifications',
  'Cmd+,': 'Open settings',
  'Esc': 'Close modal / Cancel',
};

<KeyboardShortcuts
  shortcuts={shortcuts}
  showHint
  onPress={(shortcut) => handleShortcut(shortcut)}
/>
```

### 6.2 Micro-interactions

```jsx
// Hover effects
<HoverCard
  content={<PreviewContent />}
  delay={200}
  side="right"
>
  <ProjectRow />
</HoverCard>

// Button press
<Button
  variant="primary"
  pressEffect="scale" // scale | ripple | none
  soundEffect="click" // optional
>
  Create Project
</Button>

// Success animation
<SuccessAnimation
  type="confetti" // confetti | checkmark | celebration
  duration={2000}
  onComplete={() => navigate('/projects')}
/>

// Page transitions
<PageTransition
  type="fade" // fade | slide | scale
  duration={200}
>
  <NewPage />
</PageTransition>
```

### 6.3 Real-time Updates

```jsx
<RealtimeProvider
  channel={`projects:${companyId}`}
  onEvent={(event) => handleProjectUpdate(event)}
>
  <ProjectList />
  
  {/* Live indicator */}
  <LiveIndicator
    connected={isConnected}
    lastUpdate={lastUpdate}
    onReconnect={reconnect}
  />
  
  {/* Update toast */}
  <UpdateToast
    message={`${updatedProjects.length} projects updated`}
    onRefresh={refreshData}
  />
</RealtimeProvider>
```

### 6.4 Smart Search

```jsx
<SmartSearch
  placeholder="Search projects, clients, estimates..."
  onSearch={handleSearch}
  features={[
    'autocomplete',
    'fuzzySearch',
    'recentSearches',
    'popularSearches',
    'searchFilters',
    'voiceSearch',
  ]}
  filters={[
    { field: 'status', operator: 'equals', value: 'active' },
    { field: 'created_date', operator: 'gte', value: '2026-01-01' },
  ]}
  suggestions={searchSuggestions}
/>
```

---

## 7. Extension System UI

### 7.1 Marketplace Integration

```jsx
<MarketplacePage
  categories={[
    { id: 'all', label: 'All Extensions', icon: Grid },
    { id: 'ai', label: 'AI & ML', icon: Brain },
    { id: 'integration', label: 'Integrations', icon: Plug },
    { id: 'analytics', label: 'Analytics', icon: BarChart },
    { id: 'automation', label: 'Automation', icon: Zap },
  ]}
  featured={featuredExtensions}
  trending={trendingExtensions}
  new={newExtensions}
  search
  filters={['category', 'price', 'rating', 'compatibility']}
/>

<ExtensionCard
  extension={extension}
  installed={extension.installed}
  onInstall={() => installExtension(extension)}
  onUninstall={() => uninstallExtension(extension)}
  showRating
  showReviews
  showChangelog
/>
```

### 7.2 Extension Settings

```jsx
<ExtensionSettings
  extension={extension}
  sections={[
    {
      title: 'General',
      fields: [
        { name: 'enabled', type: 'toggle', label: 'Enable Extension' },
        { name: 'auto_sync', type: 'toggle', label: 'Auto Sync' },
        { name: 'sync_interval', type: 'select', label: 'Sync Interval', options: syncIntervals },
      ]
    },
    {
      title: 'API Configuration',
      fields: [
        { name: 'api_key', type: 'secret', label: 'API Key' },
        { name: 'endpoint', type: 'url', label: 'API Endpoint' },
      ]
    },
    {
      title: 'Field Mapping',
      fields: [
        { name: 'mappings', type: 'mapping', label: 'Field Mappings' },
      ]
    },
  ]}
  onSave={saveSettings}
  onReset={resetToDefaults}
/>
```

### 7.3 Embedded Apps

```jsx
<EmbeddedApp
  appId="calendar-sync"
  container="modal" // modal | inline | sidebar
  title="Calendar Sync"
  size="large" // small | medium | large | full
  allowFullscreen
  onReady={(api) => {
    api.postMessage({ type: 'init', data: config });
  }}
  onMessage={(event) => handleAppMessage(event)}
/>
```

---

## 8. Responsive Design

### 8.1 Breakpoints

```css
/* Mobile First */
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Laptop */
--breakpoint-xl: 1280px;  /* Desktop */
--breakpoint-2xl: 1536px; /* Large Desktop */
```

### 8.2 Mobile Adaptations

```jsx
// Mobile navigation
<MobileNav
  type="bottom-tab" // bottom-tab | hamburger
  items={mobileNavItems}
  showLabels
/>

// Mobile cards
<ProjectCard
  project={project}
  compact
  swipeActions={[
    { icon: Edit, action: editProject },
    { icon: Trash, action: deleteProject, variant: 'destructive' },
  ]}
/>

// Mobile forms
<MobileForm
  steps={formSteps}
  progress
  swipeNavigation
  saveDraft
/>
```

---

## 9. Performance Guidelines

### 9.1 Loading Performance

```javascript
// Code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));

// Image optimization
<Image
  src={project.image}
  alt={project.title}
  loading="lazy"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  placeholder="blur"
  blurDataURL={project.imageBlur}
/>

// Virtual scrolling
<VirtualList
  items={largeDataset}
  itemHeight={60}
  overscan={5}
  renderItem={(item) => <ItemRow item={item} />}
/>
```

### 9.2 Animation Performance

```css
/* Hardware acceleration */
.animate-fade {
  animation: fade 200ms ease-out;
  will-change: opacity;
}

@keyframes fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Transform over position */
.slide-in {
  transform: translateX(-100%);
  transition: transform 300ms ease-out;
}

.slide-in.active {
  transform: translateX(0);
}
```

---

## 10. Accessibility

### 10.1 WCAG 2.1 AA Compliance

```jsx
// Focus management
<FocusTrap>
  <Modal>
    <ModalContent />
  </Modal>
</FocusTrap>

// Screen reader support
<div
  role="alert"
  aria-live="polite"
  aria-atomic="true"
>
  {notification}
</div>

// Keyboard navigation
<TabGroup
  manualActivation
  orientation="horizontal"
  aria-label="Project tabs"
>
  <TabList>
    {tabs.map(tab => (
      <Tab
        key={tab.id}
        aria-selected={activeTab === tab.id}
      >
        {tab.label}
      </Tab>
    ))}
  </TabList>
  <TabPanels>
    {tabs.map(tab => (
      <TabPanel key={tab.id}>
        {tab.content}
      </TabPanel>
    ))}
  </TabPanels>
</TabGroup>
```

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Q3 2026)
- [ ] Design system tokens
- [ ] Core component library
- [ ] App shell layout
- [ ] Navigation patterns
- [ ] Basic animations

### Phase 2: Premium Features (Q4 2026)
- [ ] Command palette
- [ ] Keyboard shortcuts
- [ ] Advanced data grid
- [ ] Smart search
- [ ] Micro-interactions

### Phase 3: Extension UI (Q1 2027)
- [ ] Marketplace UI
- [ ] Extension settings
- [ ] Embedded apps framework
- [ ] Widget system
- [ ] Custom layouts

### Phase 4: Polish (Q2 2027)
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Mobile refinement
- [ ] Real-time updates
- [ ] Advanced animations

---

**Version:** 1.0.0  
**Status:** Design Ready  
**Last Updated:** 2026-05-27