import { decodeGuideId, parseRepoUrl } from "@/lib/utils";
import { GuideClient } from "@/components/guide/GuideClient";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface Props {
  params: { id: string };
}

export default function GuidePage({ params }: Props) {
  const repoUrl = decodeGuideId(params.id);
  const parsed = repoUrl ? parseRepoUrl(repoUrl) : null;

  if (!repoUrl || !parsed) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 mx-auto max-w-4xl w-full px-6 py-20">
          <div className="rounded-xl border border-border-default bg-bg-surface p-10 text-center">
            <p className="text-body-lg text-text-secondary">Invalid guide URL.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <GuideClient
      repoUrl={repoUrl}
      repoName={`${parsed.owner}/${parsed.repo}`}
    />
  );
}
