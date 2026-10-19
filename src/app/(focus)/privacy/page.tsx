import { LegalPage } from "@/components/legal/LegalPage";

// DRAFT. Describes what the app does today; needs legal review before launch.
// The Figma board (Privacy policy frame) carries the same text: keep them in step.
export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updated="Draft · 19 October 2026"
      sections={[
        {
          heading: "What we store, and where",
          body: (
            <>
              <p>
                MenuCart works on your phone first. Your weekly plans, grocery lists, ticks, pantry choices, settings,
                your own dishes and any recipe edits are saved in your browser&apos;s storage on this device, and the app
                works offline from them.
              </p>
              <p>
                If you use MenuCart without an account, none of this leaves your device. Clearing your browser data or
                uninstalling the app deletes it.
              </p>
            </>
          ),
        },
        {
          heading: "Your account",
          body: (
            <>
              <p>
                Accounts are optional. If you create one, we keep your email address so you can sign in with a
                one-time code or a sign-in link. We don&apos;t use passwords.
              </p>
              <p>
                Sign-in is provided by Clerk, which processes your email address, your sign-in sessions and basic
                device details (such as browser type and IP address) on our behalf to keep sign-in secure.
              </p>
            </>
          ),
        },
        {
          heading: "Sync between your devices",
          body: (
            <>
              <p>
                When you&apos;re signed in, a copy of your plans, lists, ticks, settings, your own dishes and recipe
                edits is stored on our servers so it follows you to your other devices. It&apos;s tied to your account
                and used only to run sync.
              </p>
              <p>
                Our database is hosted by Supabase and the app by Vercel. Both act as our service providers and
                process data only to run MenuCart. When you delete something, we keep a small marker that it was
                deleted, so your other devices remove it too.
              </p>
            </>
          ),
        },
        {
          heading: "Halal mode",
          body: (
            <p>
              Your Halal mode choice is stored with your other settings, and synced if you&apos;re signed in. We use it
              only to show halal flags and swap suggestions. We don&apos;t use it for anything else or share it.
            </p>
          ),
        },
        {
          heading: "Recipe reports",
          body: (
            <p>
              If you report a problem with an ingredient in one of our recipes, we receive the dish, the ingredient,
              the reason you picked and any note you add. We use reports only to fix the recipe library. They&apos;re
              sent when you&apos;re signed in; until then they wait on your device.
            </p>
          ),
        },
        {
          heading: "AI ingredient suggestions",
          body: (
            <p>
              This version of MenuCart doesn&apos;t send your dishes to any AI service. If we add AI-generated
              ingredient lists later, we&apos;ll update this policy first and explain what is sent.
            </p>
          ),
        },
        {
          heading: "What we don't do",
          body: (
            <p>
              We don&apos;t show ads, sell your data, or use third-party analytics or tracking. Vercel keeps standard
              server logs (such as IP addresses and request times) to run and protect the service.
            </p>
          ),
        },
        {
          heading: "How long we keep it",
          body: (
            <p>
              Data on your device stays until you delete it. Synced data and your reports stay while your account
              exists. When you delete your account, they&apos;re deleted from our servers straight away, and your
              sign-in details are deleted from Clerk.
            </p>
          ),
        },
        {
          heading: "Deleting your data",
          body: (
            <p>
              In Settings, guests can clear everything on this device. If you&apos;re signed in, you can delete your
              account: this removes your synced data and reports from our servers, deletes your account at Clerk and
              clears this device. When you sign out, you choose whether to keep this week&apos;s list on the phone.
            </p>
          ),
        },
        {
          heading: "Your rights",
          body: (
            <p>
              You can ask us for a copy of your data, to correct it, or to delete it. Indonesia&apos;s Personal Data
              Protection Law (UU PDP) gives you these rights, and we&apos;ll respond within the time it sets.
            </p>
          ),
        },
        {
          heading: "Changes to this policy",
          body: (
            <p>
              If we change how we handle your data, we&apos;ll update this page and the date at the top, and tell you
              in the app before significant changes take effect.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: <p>Questions about privacy or your data: [contact email to be added before launch].</p>,
        },
      ]}
    />
  );
}
