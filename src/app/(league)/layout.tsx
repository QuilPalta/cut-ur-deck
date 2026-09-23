import LeagueHeader from "@/components/LeagueHeader";

export default function LeagueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen w-full relative z-10">
      <LeagueHeader />
      {children}
    </div>
  );
}