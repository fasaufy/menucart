import { TabBar } from "@/components/TabBar";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="flex flex-1 flex-col">{children}</main>
      <TabBar />
    </>
  );
}
