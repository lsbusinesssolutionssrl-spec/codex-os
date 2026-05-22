const STATUS_STYLES = {
  // Estimate
  'Draft': 'bg-gray-100 text-gray-600',
  'To Review': 'bg-yellow-100 text-yellow-700',
  'Sent': 'bg-blue-100 text-blue-700',
  'Accepted': 'bg-green-100 text-green-700',
  'Rejected': 'bg-red-100 text-red-700',
  'Expired': 'bg-orange-100 text-orange-700',
  'Converted to Project': 'bg-purple-100 text-purple-700',
  // Project
  'Lead': 'bg-gray-100 text-gray-600',
  'Survey': 'bg-purple-100 text-purple-700',
  'Estimate': 'bg-blue-100 text-blue-700',
  'Approved': 'bg-teal-100 text-teal-700',
  'In Progress': 'bg-blue-100 text-blue-800',
  'Testing': 'bg-orange-100 text-orange-700',
  'Delivered': 'bg-green-100 text-green-700',
  'Guardian Active': 'bg-emerald-100 text-emerald-700',
  // Checklist
  'To Do': 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Done': 'bg-green-100 text-green-700',
  'Blocked': 'bg-red-100 text-red-700',
  // Tickets
  'Open': 'bg-red-100 text-red-700',
  'Waiting Client': 'bg-yellow-100 text-yellow-700',
  'Resolved': 'bg-green-100 text-green-700',
  'Closed': 'bg-gray-100 text-gray-500',
  // Guardian
  'Active': 'bg-green-100 text-green-700',
  'Paused': 'bg-yellow-100 text-yellow-700',
  'Cancelled': 'bg-red-100 text-red-700',
  // Priority
  'Low': 'bg-gray-100 text-gray-600',
  'Medium': 'bg-yellow-100 text-yellow-700',
  'High': 'bg-orange-100 text-orange-700',
  'Urgent': 'bg-red-100 text-red-700',
};

export default function StatusBadge({ status, className = '' }) {
  const style = STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}>
      {status}
    </span>
  );
}