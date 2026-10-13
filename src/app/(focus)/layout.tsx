// Full-screen steps without the tab bar: pantry check and shopping mode.
export default function FocusLayout({ children }: LayoutProps<"/">) {
  return <main className="flex flex-1 flex-col">{children}</main>;
}
