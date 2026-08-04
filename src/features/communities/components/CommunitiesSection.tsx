import SectionHeading from "@/components/common/SectionHeading";
import CommunityCard from "@/features/communities/components/CommunityCard";
import { COMMUNITIES } from "@/features/communities/data/communities";

export default function CommunitiesSection() {
  return (
    <section id="komunitas" className="border-y border-border/60">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <SectionHeading
          eyebrow="Verse"
          title="Temukan komunitasmu"
          description="Dari gaming sampai open source, semua punya rumah di sini. Satu langit, banyak bintang."
        />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {COMMUNITIES.map((community) => (
            <CommunityCard key={community.slug} community={community} />
          ))}
        </div>
      </div>
    </section>
  );
}
