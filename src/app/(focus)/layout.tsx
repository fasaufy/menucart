// Full-screen steps without the tab bar: onboarding, pantry check, settings, sign-in.
export default function FocusLayout({ children }: LayoutProps<"/">) {
  return <main className="flex flex-1 flex-col">{children}</main>;
}
