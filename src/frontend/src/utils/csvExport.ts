import type { TeamSummary } from '../backend';

export function exportAuctionSummaryToCSV(summaries: TeamSummary[]): void {
  if (summaries.length === 0) {
    return;
  }

  // CSV headers
  const headers = ['Team Name', 'Player Name', 'Price (Cr)', 'Total Purse (Cr)', 'Spent (Cr)', 'Remaining (Cr)'];
  
  // Build CSV rows
  const rows: string[][] = [];
  
  summaries.forEach((summary) => {
    const teamName = summary.team.name;
    const totalPurse = summary.team.totalPurse.toFixed(2);
    const remaining = summary.remainingPurse.toFixed(2);
    const spent = (summary.team.totalPurse - summary.remainingPurse).toFixed(2);

    if (summary.roster.length === 0) {
      // Team with no players
      rows.push([teamName, 'No players', '0.00', totalPurse, spent, remaining]);
    } else {
      // Add a row for each player
      summary.roster.forEach(([player, price]) => {
        rows.push([
          teamName,
          player.name,
          price.toFixed(2),
          totalPurse,
          spent,
          remaining,
        ]);
      });
    }
  });

  // Convert to CSV string
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `hpl-auction-summary-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
