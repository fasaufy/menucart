// Plan and List: each screen puts the tab bar in its own Footer, under its main action.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return <main className="flex flex-1 flex-col">{children}</main>;
}
