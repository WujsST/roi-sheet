import { notFound } from "next/navigation";
import { getReportById } from "@/app/actions";
import { ReportRenderer } from "./ReportRenderer";

export const dynamic = "force-dynamic";

type Params = Promise<{ reportId: string }>;
type Search = Promise<{ print?: string }>;

export default async function ReportDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: Search;
}) {
  const { reportId } = await params;
  const { print } = await searchParams;

  const report = await getReportById(reportId);
  if (!report) notFound();

  return <ReportRenderer report={report} autoPrint={print === "1"} />;
}
