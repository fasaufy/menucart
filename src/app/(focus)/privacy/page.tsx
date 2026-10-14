import { LegalPage } from "@/components/legal/LegalPage";

// DRAFT. Describes what the app does today; needs legal review before launch.
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="Draft · 14 October 2026"
      sections={[
        {
          heading: "What we store, and where",
          body: (
            <p>
              Your plans, grocery lists, ticks and settings are stored on your device, in your browser&apos;s storage.
              They stay there whether or not you have an account. If you clear your browser data or uninstall the
              app, they are deleted.
            </p>
          ),
        },
        {
          heading: "Your account",
          body: (
            <p>
              If you create an account, we keep your email address so you can sign in with a one-time code or link.
              Sign-in is provided by Clerk, which processes your email address and session on our behalf. We don&apos;t
              use passwords.
            </p>
          ),
        },
        {
          heading: "Sync (coming soon)",
          body: (
            <p>
              Syncing your plans between devices is not available yet. When it is, your plans and lists will be
              stored on our servers so they can follow your account, and this policy will be updated before that
              happens.
            </p>
          ),
        },
        {
          heading: "What we don't do",
          body: (
            <p>
              We don&apos;t show ads, sell your data, or use third-party tracking. The app is hosted on Vercel, which
              keeps standard server logs (such as IP addresses) to run the service.
            </p>
          ),
        },
        {
          heading: "Deleting your data",
          body: (
            <p>
              In Settings you can delete everything on this device, or delete your account, which also removes your
              email address from our sign-in provider.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: <p>Questions about privacy: [contact email to be added before launch].</p>,
        },
      ]}
    />
  );
}
