/**
 * Formats a raw audit event type and metadata into a human-friendly label.
 * 
 * @param eventType - Raw event type from audit_events (e.g., "invoice.created")
 * @param metadata - Optional metadata payload that might contain useful info 
 */
export function formatAuditEvent(eventType: string, metadata?: any): string {
  if (!eventType) return 'Unknown activity';

  switch (eventType) {
    case 'invoice.created':
    case 'invoice_created':
      return metadata?.invoiceNumber ? `Invoice #${metadata.invoiceNumber} created` : 'Invoice created';
    case 'invoice.approved':
    case 'invoice_approved':
      return metadata?.invoiceNumber ? `Invoice #${metadata.invoiceNumber} approved` : 'Invoice approved';
    case 'invoice.paid':
    case 'invoice_paid':
      return 'Invoice paid';
    case 'invoice.rejected':
    case 'invoice_rejected':
      return 'Invoice rejected';
      
    case 'payment.completed':
    case 'payment_completed':
      return 'Payment completed';
    case 'payment.initiated':
    case 'payment_initiated':
      return 'Payment initiated';

    case 'vendor.created':
    case 'vendor_created':
      return metadata?.vendorName ? `Vendor ${metadata.vendorName} added` : 'Vendor added';
    case 'vendor.updated':
    case 'vendor_updated':
      return 'Vendor updated';

    case 'engagement.created':
    case 'engagement_created':
      return metadata?.title ? `Engagement "${metadata.title}" created` : 'Engagement created';
    case 'engagement.updated':
    case 'engagement_updated':
      return 'Engagement updated';
    case 'engagement.approved':
    case 'engagement_approved':
      return 'Engagement approved';

    case 'approval_request.created':
    case 'approval.requested':
      return 'Approval requested';
    case 'approval.approved':
    case 'approval_approved':
      return 'Approval completed';
    case 'approval.rejected':
    case 'approval_rejected':
      return 'Approval rejected';

    case 'document.uploaded':
    case 'document_uploaded':
      return 'Document uploaded';

    default:
      // Fallback: convert dot or underscore notation to Title Case
      // e.g., 'user.login' -> 'User login'
      const readable = eventType.replace(/[._]/g, ' ');
      return readable.charAt(0).toUpperCase() + readable.slice(1);
  }
}
