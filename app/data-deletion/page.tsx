export default function DataDeletionPage() {
  return (
    <div className="relative z-10 w-full max-w-2xl px-5 xl:px-0">
      <div className="mx-auto my-10 w-full">
        <div className="rounded-2xl border border-gray-200 bg-white/70 p-6 shadow-sm dark:border-[rgb(var(--dark-border))] dark:shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
          <div className="mt-2 overflow-hidden rounded-xl bg-white dark:bg-[rgb(var(--dark-card))]">
            <article className="prose prose-sm max-w-none px-6 py-7 text-gray-700 dark:prose-invert prose-headings:scroll-mt-24 prose-headings:font-semibold prose-h1:mb-2 prose-h1:text-3xl prose-h2:mb-3 prose-h2:mt-8 prose-h2:text-lg prose-p:leading-7 prose-a:text-pulse-bloom-deep hover:prose-a:text-pulse-bloom prose-li:leading-7 dark:text-gray-200 dark:prose-a:text-indigo-300 dark:hover:prose-a:text-indigo-200 md:px-8 md:py-8">
              <h1>Data Deletion</h1>
              <p className="!mt-0 text-sm text-gray-500 dark:text-gray-400">
                <strong>Last updated:</strong> February 07, 2026
              </p>
              <p>
                Pulse Bloom respects your right to control your personal data.
                If you signed in using Facebook and want to request deletion,
                choose one of the options below.
              </p>

              <h2>Option 1: Delete Data In App</h2>
              <p>
                You can permanently delete your data directly inside Pulse
                Bloom:
              </p>
              <ol>
                <li>Log in to your Pulse Bloom account.</li>
                <li>Navigate to your healer space.</li>
                <li>
                  Click <strong>Edit your space</strong>.
                </li>
                <li>
                  Select <strong>Delete your space</strong> and confirm.
                </li>
              </ol>
              <p>
                This action permanently deletes data associated with your
                account and cannot be undone.
              </p>

              <h2>Option 2: Contact Us</h2>
              <p>
                If you cannot access your account or prefer not to delete data
                in app, email us at{" "}
                <a href="mailto:yumengcao4888@gmail.com">
                  yumengcao4888@gmail.com
                </a>
                .
              </p>
              <p>
                Please include the email address associated with your Facebook
                account so we can verify your request.
              </p>

              <h2>Additional Information</h2>
              <ul>
                <li>
                  Deletion requests are processed as soon as reasonably
                  possible.
                </li>
                <li>Once deleted, data cannot be recovered.</li>
                <li>
                  Pulse Bloom does not retain personal data after deletion
                  except where required by law.
                </li>
              </ul>
              <p>
                If you have any questions about data deletion, contact us at{" "}
                <a href="mailto:yumengcao4888@gmail.com">
                  yumengcao4888@gmail.com
                </a>
                .
              </p>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
