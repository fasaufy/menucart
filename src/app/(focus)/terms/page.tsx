import { LegalPage } from "@/components/legal/LegalPage";

// DRAFT. Needs legal review before launch.
export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      updated="Draft · 14 October 2026"
      sections={[
        {
          heading: "Using MenuCart",
          body: (
            <p>
              MenuCart helps you plan meals and build a grocery list. It&apos;s free to use, with or without an
              account. Please use it for your own household planning.
            </p>
          ),
        },
        {
          heading: "Halal guidance",
          body: (
            <p>
              Halal flags and swaps are cooking suggestions, not religious rulings. Ingredients marked
              &ldquo;Check&rdquo; depend on the brand or source: look for a recognised halal logo. When in doubt,
              follow the guidance of a recognised halal authority.
            </p>
          ),
        },
        {
          heading: "Ingredients and quantities",
          body: (
            <p>
              Ingredient lists and amounts are estimates. Every line is editable; check them against how you cook,
              and for any allergies or dietary needs.
            </p>
          ),
        },
        {
          heading: "Your content",
          body: (
            <p>
              Dishes and ingredients you add are yours. Reports you send about wrong ingredients may be used to
              improve the shared dish library.
            </p>
          ),
        },
        {
          heading: "Availability",
          body: (
            <p>
              We work to keep MenuCart available and your data safe on your device, but the app is provided as is,
              without guarantees. Features may change as we build it.
            </p>
          ),
        },
        {
          heading: "Contact",
          body: <p>Questions: [contact email to be added before launch].</p>,
        },
      ]}
    />
  );
}
