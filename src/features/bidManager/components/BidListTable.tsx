import { Link } from "react-router-dom";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BID_MANAGER_ROUTES } from "../constants/routes";
import type { BidDto } from "../types/contracts";
import { toConfidenceValue, toDateTimeValue, toDisplayValue } from "../utils/presentation";

interface BidListTableProps {
  bids: BidDto[];
  mailboxId: string;
}

function getSenderValue(bid: BidDto): string {
  const senderName = toDisplayValue(bid.email.from.name);
  const senderEmail = toDisplayValue(bid.email.from.email);

  if (senderName === "-" && senderEmail === "-") {
    return "-";
  }

  if (senderName !== "-" && senderEmail !== "-") {
    return `${senderName} / ${senderEmail}`;
  }

  return senderName !== "-" ? senderName : senderEmail;
}

export function BidListTable({ bids, mailboxId }: BidListTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>From</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Confidence</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Solicitation</TableHead>
          <TableHead>Bid Due</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bids.map((bid) => (
          <TableRow key={bid.id}>
            <TableCell className="font-medium">{bid.id}</TableCell>
            <TableCell className="max-w-[280px] truncate">{toDisplayValue(bid.email.subject)}</TableCell>
            <TableCell className="max-w-[260px] truncate">{getSenderValue(bid)}</TableCell>
            <TableCell>{toDisplayValue(bid.classification.category)}</TableCell>
            <TableCell>{toConfidenceValue(bid.classification.confidence)}</TableCell>
            <TableCell className="max-w-[260px] truncate">{toDisplayValue(bid.parsed.project.project_name)}</TableCell>
            <TableCell>{toDisplayValue(bid.parsed.project.solicitation_number)}</TableCell>
            <TableCell>{toDateTimeValue(bid.parsed.dates.bid_due_datetime)}</TableCell>
            <TableCell className="text-right">
              <Button size="sm" variant="outline" asChild>
                <Link to={BID_MANAGER_ROUTES.details(mailboxId, bid.id)}>
                  <Eye />
                  View Details
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
